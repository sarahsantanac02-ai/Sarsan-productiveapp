import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GoogleNoConectado, tokenDeGoogle } from "../_shared/google.ts";
import { construirLista, construirSystemPrompt } from "./prompt.ts";
import { construirToolSchema, respuestaSchema } from "./schema.ts";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

// Bandeja principal, últimos 7 días: se salta Promociones, Redes sociales y
// Notificaciones, que es donde está casi todo el ruido.
const CONSULTA = "in:inbox category:primary newer_than:7d";

// Tope por revisión. Gmail puede devolver muchos más; leerlos todos en una
// sola llamada al modelo sale caro y tampoco mejora el criterio.
const MAX_POR_REVISION = 25;

// Sonnet y no Haiku: el modo de fallar aquí es proponer basura (un boletín
// leído como cita), y distinguir "te piden algo" de "te están vendiendo algo"
// es justo donde se separan. Corre unas pocas veces al día sobre textos cortos.
const MODELO = "claude-sonnet-5";

type Encabezado = { name: string; value: string };
type Mensaje = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: Encabezado[] };
};

function encabezado(mensaje: Mensaje, nombre: string): string | null {
  const headers = mensaje.payload?.headers ?? [];
  return headers.find((h) => h.name.toLowerCase() === nombre.toLowerCase())?.value ?? null;
}

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
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Faltan las variables de Supabase" }, 500);
  if (!anthropicKey) return jsonResponse({ error: "Falta el secret ANTHROPIC_API_KEY" }, 500);

  // Cliente con el JWT de Sarah para todo lo suyo (el RLS aplica); el de
  // service_role solo para leer los tokens de Google, que el navegador no puede.
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Sesión inválida");
    const userId = userData.user.id;

    const token = await tokenDeGoogle(admin, userId);
    const headers = { Authorization: `Bearer ${token}` };

    const lista = await fetch(
      `${API}/messages?q=${encodeURIComponent(CONSULTA)}&maxResults=60`,
      { headers },
    );
    if (!lista.ok) {
      throw new GoogleNoConectado(`Gmail respondió ${lista.status}: ${(await lista.text()).slice(0, 200)}`);
    }

    const { messages } = (await lista.json()) as { messages?: Array<{ id: string }> };
    if (!messages?.length) return jsonResponse({ revisados: 0, nuevos: 0, hallazgos: 0 });

    // Los que ya miramos antes no se vuelven a pagar.
    const { data: vistos } = await supabase
      .from("mail_seen")
      .select("gmail_message_id")
      .in("gmail_message_id", messages.map((m) => m.id));

    const yaVistos = new Set((vistos ?? []).map((v) => v.gmail_message_id as string));
    const pendientes = messages.filter((m) => !yaVistos.has(m.id)).slice(0, MAX_POR_REVISION);

    if (!pendientes.length) {
      return jsonResponse({ revisados: messages.length, nuevos: 0, hallazgos: 0 });
    }

    const detalles = await Promise.all(
      pendientes.map(async ({ id }) => {
        const respuesta = await fetch(
          `${API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers },
        );
        if (!respuesta.ok) return null;
        const mensaje = (await respuesta.json()) as Mensaje;
        return {
          id,
          threadId: mensaje.threadId,
          asunto: encabezado(mensaje, "Subject") ?? "(sin asunto)",
          de: encabezado(mensaje, "From") ?? "",
          fecha: encabezado(mensaje, "Date") ?? "",
          recibidoAt: mensaje.internalDate
            ? new Date(Number(mensaje.internalDate)).toISOString()
            : null,
          resumen: (mensaje.snippet ?? "").slice(0, 400),
        };
      }),
    );

    const correos = detalles.filter((d): d is NonNullable<typeof d> => d !== null);
    if (!correos.length) return jsonResponse({ revisados: messages.length, nuevos: 0, hallazgos: 0 });

    const { data: tags } = await supabase.from("tags").select("nombre, descripcion").order("orden");
    const etiquetas = (tags ?? []).map((t) => t.nombre as string);

    const ahora = new Date();
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(ahora);
    const diaSemana = new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      timeZone: "America/Bogota",
    }).format(ahora);

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const respuesta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 4096,
      system: construirSystemPrompt({
        tags: (tags ?? []) as Array<{ nombre: string; descripcion: string | null }>,
        hoy,
        diaSemana,
      }),
      messages: [
        {
          role: "user",
          content: construirLista(correos),
        },
      ],
      tools: [
        {
          name: "reportar_hallazgos",
          description: "Reporta los correos que piden una acción de Sarah o son una cita.",
          input_schema: construirToolSchema(etiquetas),
        },
      ],
      tool_choice: { type: "tool", name: "reportar_hallazgos" },
    });

    const bloque = respuesta.content.find((b) => b.type === "tool_use");
    if (!bloque || bloque.type !== "tool_use") throw new Error("El modelo no llamó a la herramienta");

    const validado = respuestaSchema.safeParse(bloque.input);
    if (!validado.success) {
      // El input crudo es lo único que sirve para entender por qué falló.
      console.error("gmail-triage: respuesta inválida", JSON.stringify(bloque.input));
      throw new Error(`La respuesta de la IA no tenía la forma esperada: ${validado.error.issues[0]?.message}`);
    }

    const filas = validado.data.hallazgos
      .filter((h) => h.indice >= 0 && h.indice < correos.length)
      .map((h) => {
        const correo = correos[h.indice];
        // El modelo escribe el nombre de la etiqueta; lo dejamos tal como está
        // en la tabla de Sarah para que el cliente lo resuelva sin ambigüedad.
        const etiqueta = h.etiqueta
          ? etiquetas.find((n) => normalizar(n) === normalizar(h.etiqueta!)) ?? null
          : null;
        return {
          user_id: userId,
          gmail_message_id: correo.id,
          gmail_thread_id: correo.threadId,
          asunto: correo.asunto,
          de: correo.de,
          recibido_at: correo.recibidoAt,
          link: `https://mail.google.com/mail/u/0/#inbox/${correo.threadId}`,
          tipo: h.tipo,
          titulo: h.titulo,
          fecha: h.fecha,
          hora: h.hora,
          duracion_min: h.duracion_min,
          etiqueta,
          razon: h.razon,
        };
      });

    if (filas.length) {
      const { error: insertError } = await supabase
        .from("mail_suggestions")
        .upsert(filas, { onConflict: "user_id,gmail_message_id", ignoreDuplicates: true });
      if (insertError) throw new Error(`No pude guardar los hallazgos: ${insertError.message}`);
    }

    // Se marcan como vistos TODOS los revisados, no solo los que dieron algo:
    // si no, los correos descartados se volverían a analizar cada vez.
    const { error: seenError } = await supabase
      .from("mail_seen")
      .upsert(
        correos.map((c) => ({ user_id: userId, gmail_message_id: c.id })),
        { onConflict: "user_id,gmail_message_id", ignoreDuplicates: true },
      );
    if (seenError) console.error("gmail-triage: no pude marcar los vistos", seenError.message);

    return jsonResponse({
      revisados: messages.length,
      nuevos: correos.length,
      hallazgos: filas.length,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const reconectar = error instanceof GoogleNoConectado;
    console.error("gmail-triage falló:", mensaje);
    return jsonResponse({ error: mensaje, reconectar }, 200);
  }
});
