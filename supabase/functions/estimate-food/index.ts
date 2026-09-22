import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";
import { z } from "npm:zod";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const MODELO = "claude-sonnet-5";

const COMIDAS = ["desayuno", "almuerzo", "cena", "snack"] as const;

const estimacionSchema = z.object({
  nombre: z.string().min(1),
  kcal: z.number().positive(),
  kcal_min: z.number().positive(),
  kcal_max: z.number().positive(),
  proteina_g: z.number().nonnegative(),
  carbos_g: z.number().nonnegative(),
  grasa_g: z.number().nonnegative(),
  confianza: z.enum(["alta", "media", "baja"]),
});

const SYSTEM = `Estimas la energía y los macros de lo que Sarah come. Ella vive en Bogotá, así que la mayoría es comida colombiana: bandeja paisa, ajiaco, sancocho, arepa, changua, tamal, empanada, patacón, arroz con pollo, corrientazo, buñuelo, almojábana, sobrebarriga, lechona.

Reglas:
- Estima la porción por lo que se ve o se describe, con porciones colombianas reales (un corrientazo no es una porción de restaurante gringo).
- \`kcal\` es tu mejor estimación puntual; \`kcal_min\` y \`kcal_max\` acotan el rango razonable.
- \`confianza\`: alta si el plato es claro y estándar, media si falta contexto de porción, baja si la foto es ambigua o hay mucho tapado.
- \`nombre\`: corto y en español, como ella lo diría ("Bandeja paisa", "Arepa con queso", "Ensalada de pollo").
- Esto es para que ella vea cuánta energía lleva en el día. No comentes sobre peso, dietas ni si "debería" comer algo. Solo estima.

Llama a la herramienta \`registrar_comida\` una sola vez.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonResponse({ error: "Falta el token de sesión" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!supabaseUrl) return jsonResponse({ error: "Falta SUPABASE_URL" }, 500);
  if (!anthropicKey) return jsonResponse({ error: "Falta el secret ANTHROPIC_API_KEY" }, 500);

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  try {
    const { comida, descripcion, foto_path } = await req.json();
    if (!COMIDAS.includes(comida)) return jsonResponse({ error: "Comida inválida" }, 400);
    if (!descripcion && !foto_path) return jsonResponse({ error: "Mándame una foto o una descripción" }, 400);

    const contenido: Anthropic.MessageParam["content"] = [];

    if (foto_path) {
      const { data: archivo, error: descargaError } = await supabase.storage.from("comida").download(foto_path);
      if (descargaError) throw new Error(`Bajando la foto: ${descargaError.message}`);

      const bytes = new Uint8Array(await archivo.arrayBuffer());
      let binario = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }

      contenido.push({
        type: "image",
        source: {
          type: "base64",
          media_type: (archivo.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp",
          data: btoa(binario),
        },
      });
    }

    contenido.push({
      type: "text",
      text: descripcion
        ? `Esto es mi ${comida}: ${descripcion}`
        : `Esto es mi ${comida}. Estima lo que ves en la foto.`,
    });

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const respuesta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system: SYSTEM,
      tools: [
        {
          name: "registrar_comida",
          description: "Registra la estimación de energía y macros de la comida.",
          input_schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              nombre: { type: "string" },
              kcal: { type: "number" },
              kcal_min: { type: "number" },
              kcal_max: { type: "number" },
              proteina_g: { type: "number" },
              carbos_g: { type: "number" },
              grasa_g: { type: "number" },
              confianza: { type: "string", enum: ["alta", "media", "baja"] },
            },
            required: ["nombre", "kcal", "kcal_min", "kcal_max", "proteina_g", "carbos_g", "grasa_g", "confianza"],
          },
        },
      ] as never,
      tool_choice: { type: "tool", name: "registrar_comida" },
      messages: [{ role: "user", content: contenido }],
    });

    const bloque = respuesta.content.find((b) => b.type === "tool_use");
    if (!bloque || bloque.type !== "tool_use") {
      throw new Error(`La IA no devolvió la herramienta (stop_reason: ${respuesta.stop_reason})`);
    }

    const parseo = estimacionSchema.safeParse(bloque.input);
    if (!parseo.success) {
      console.error("estimate-food devolvió algo que no valida:", JSON.stringify(bloque.input));
      throw new Error("La IA respondió en un formato inesperado");
    }
    const estimacion = parseo.data;

    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: registro, error: insertError } = await supabase
      .from("food_logs")
      .insert({ user_id: userId, dia: hoy, comida, foto_path: foto_path ?? null, ...estimacion })
      .select("id")
      .single();
    if (insertError) throw new Error(`Guardando la comida: ${insertError.message}`);

    // Marca solo el no negociable de esa comida (blueprint): Desayunar,
    // Almorzar o Cenar. Un snack no marca nada.
    const habito = { desayuno: "Desayunar", almuerzo: "Almorzar", cena: "Cenar" }[comida as string];
    if (habito) {
      const { data: fila } = await supabase.from("habits").select("id").eq("nombre", habito).maybeSingle();
      if (fila) {
        await supabase
          .from("habit_logs")
          .upsert({ user_id: userId, habit_id: fila.id, dia: hoy, hecho: true }, { onConflict: "habit_id,dia" });
      }
    }

    console.log(`estimate-food OK: ${estimacion.nombre} ${estimacion.kcal} kcal (${estimacion.confianza})`);

    return jsonResponse({ id: registro.id, ...estimacion });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("estimate-food falló:", mensaje);
    return jsonResponse({ error: mensaje }, 200);
  }
});
