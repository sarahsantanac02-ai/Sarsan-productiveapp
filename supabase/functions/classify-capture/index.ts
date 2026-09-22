import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { clasificacionSchema, construirToolSchema, type Clasificacion } from "./schema.ts";
import { construirSystemPrompt, type Contexto } from "./prompt.ts";

const MODELO = "claude-haiku-4-5";

// Misma regla que src/lib/urgencia.ts en el cliente (blueprint: ≤1 alta, ≤4 media,
// resto baja). Vive duplicada porque Deno y el bundle del navegador no comparten
// módulos; si cambia una, cambia la otra.
function urgenciaPorFecha(fecha: string, hoy: string): "alta" | "media" | "baja" {
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86_400_000);
  if (dias <= 1) return "alta";
  if (dias <= 4) return "media";
  return "baja";
}

function partesBogota(ahora: Date) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(ahora);
  const diaSemana = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    timeZone: "America/Bogota",
  }).format(ahora);
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(ahora);
  return { hoy, diaSemana, hora };
}

/** Compara nombres ignorando mayúsculas y tildes, por si el modelo escribe "virrey". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonResponse({ error: "Falta el token de sesión" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!supabaseUrl) return jsonResponse({ error: "Falta SUPABASE_URL" }, 500);
  if (!anthropicKey) return jsonResponse({ error: "Falta el secret ANTHROPIC_API_KEY" }, 500);

  // Cliente con el JWT de Sarah: el RLS aplica, así que esta función solo puede
  // leer y escribir sus propias filas.
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  let itemId: string | undefined;

  try {
    const body = await req.json();
    itemId = body.item_id;
    const texto: string = body.texto;
    if (!itemId || !texto) return jsonResponse({ error: "Faltan item_id o texto" }, 400);

    const [tagsRes, mediosRes, categoriasRes, hintsRes] = await Promise.all([
      supabase.from("tags").select("id, nombre, descripcion").order("orden"),
      supabase.from("payment_methods").select("id, nombre, tipo").order("orden"),
      supabase.from("money_categories").select("id, tipo, nombre"),
      supabase.from("tag_hints").select("texto, tag_id").order("created_at", { ascending: false }).limit(20),
    ]);

    const errores = [tagsRes.error, mediosRes.error, categoriasRes.error, hintsRes.error].filter(Boolean);
    if (errores.length) throw new Error(`Leyendo el contexto: ${errores.map((e) => e!.message).join("; ")}`);

    const { hoy, diaSemana, hora } = partesBogota(new Date());
    const ctx: Contexto = {
      tags: tagsRes.data ?? [],
      medios: mediosRes.data ?? [],
      categorias: categoriasRes.data ?? [],
      hints: hintsRes.data ?? [],
      hoy,
      diaSemana,
      hora,
    };

    if (ctx.tags.length === 0) {
      throw new Error("No se leyó ninguna etiqueta: revisa el RLS o si la cuenta tiene sus seeds.");
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const respuesta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system: construirSystemPrompt(ctx),
      tools: [
        {
          name: "registrar_captura",
          description: "Registra la captura ya clasificada en SarSan.",
          input_schema: construirToolSchema({
            etiquetas: ctx.tags.map((t) => t.nombre),
            medios: ctx.medios.map((m) => m.nombre),
            categorias: [...new Set(ctx.categorias.map((c) => c.nombre))],
          }),
        },
      ] as never,
      tool_choice: { type: "tool", name: "registrar_captura" },
      messages: [{ role: "user", content: texto }],
    });

    const bloque = respuesta.content.find((b) => b.type === "tool_use");
    if (!bloque || bloque.type !== "tool_use") {
      throw new Error(`La IA no devolvió la herramienta (stop_reason: ${respuesta.stop_reason})`);
    }

    const parseo = clasificacionSchema.safeParse(bloque.input);
    if (!parseo.success) {
      console.error("La IA devolvió algo que no valida:", JSON.stringify(bloque.input));
      throw new Error(`Respuesta inválida: ${parseo.error.issues.map((i) => i.path.join(".")).join(", ")}`);
    }
    const clasificacion: Clasificacion = parseo.data;

    // La urgencia manda la fecha, no la IA (blueprint).
    const urgencia = clasificacion.fecha
      ? urgenciaPorFecha(clasificacion.fecha, hoy)
      : (clasificacion.urgencia ?? "media");

    const esMovimiento = clasificacion.tipo === "gasto" || clasificacion.tipo === "ingreso";

    // Nombre → id. Si no encaja ninguno, General (y queda en los logs para saberlo).
    const tag = clasificacion.etiqueta
      ? ctx.tags.find((t) => normalizar(t.nombre) === normalizar(clasificacion.etiqueta!))
      : undefined;
    const tagGeneral = ctx.tags.find((t) => t.nombre === "General");
    if (clasificacion.etiqueta && !tag) {
      console.warn(`Etiqueta desconocida "${clasificacion.etiqueta}" → General`);
    }

    const medio = clasificacion.medio
      ? ctx.medios.find((m) => normalizar(m.nombre) === normalizar(clasificacion.medio!))
      : undefined;

    const { error: updateError } = await supabase
      .from("items")
      .update({
        texto: clasificacion.texto_limpio,
        tipo: clasificacion.tipo,
        tag_id: tag?.id ?? tagGeneral?.id ?? null,
        urgencia: esMovimiento ? null : urgencia,
        fecha: clasificacion.fecha,
        hora: clasificacion.hora,
        duracion_min: clasificacion.duracion_min,
        recurrencia: clasificacion.recurrencia,
        clasificando: false,
      })
      .eq("id", itemId);

    if (updateError) throw new Error(`Actualizando el item: ${updateError.message}`);

    // Un gasto o ingreso además queda registrado en Finanzas. El item se guarda
    // como bitácora de la captura, pero no aparece entre los pendientes.
    let transactionId: string | null = null;
    if (esMovimiento && clasificacion.monto) {
      const categoria = ctx.categorias.find(
        (c) => c.tipo === clasificacion.tipo && normalizar(c.nombre) === normalizar(clasificacion.categoria ?? ""),
      );

      const { data: transaccion, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          tipo: clasificacion.tipo,
          monto: clasificacion.monto,
          categoria_id: categoria?.id ?? null,
          medio_id: medio?.id ?? null,
          fecha: clasificacion.fecha ?? hoy,
          texto: clasificacion.texto_limpio,
        })
        .select("id")
        .single();

      if (txError) throw new Error(`Creando el movimiento: ${txError.message}`);
      transactionId = transaccion.id;
    }

    console.log(
      `OK "${texto}" → ${clasificacion.tipo} / ${tag?.nombre ?? "General"}${
        clasificacion.fecha ? ` / ${clasificacion.fecha}` : ""
      }${clasificacion.monto ? ` / $${clasificacion.monto}` : ""}`,
    );

    return jsonResponse({
      ...clasificacion,
      urgencia: esMovimiento ? null : urgencia,
      tag_id: tag?.id ?? tagGeneral?.id ?? null,
      medio_id: medio?.id ?? null,
      transaction_id: transactionId,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("classify-capture falló:", mensaje);

    // Blueprint: si falla la IA, la captura queda como tarea en General, editable.
    if (itemId) {
      const { data: general } = await supabase.from("tags").select("id").eq("nombre", "General").maybeSingle();
      await supabase
        .from("items")
        .update({ tipo: "tarea", tag_id: general?.id ?? null, urgencia: "media", clasificando: false })
        .eq("id", itemId);
    }

    return jsonResponse({ error: mensaje, fallback: true }, 200);
  }
});
