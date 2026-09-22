import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";
import { z } from "npm:zod";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { construirFranjas, minutosAHora, minutosAhoraBogota, type Franja } from "../_shared/franjas.ts";

const MODELO = "claude-sonnet-5";

const FRANJA_IDS = ["arranque", "foco", "bajon", "segundo_aire", "cierre"] as const;

const planSchema = z.object({
  resumen: z.string().min(1),
  asignaciones: z.array(
    z.object({
      id: z.string(),
      franja: z.enum(FRANJA_IDS),
    }),
  ),
});

type Item = {
  id: string;
  texto: string;
  tipo: string;
  urgencia: string | null;
  fecha: string | null;
  hora: string | null;
  duracion_min: number | null;
  tag_id: string | null;
};

function describirFranjas(franjas: Franja[], minutosAhora: number): string {
  return franjas
    .map((f) => {
      const pasada = minutosAhora >= f.hasta;
      return `- ${f.id} · ${f.nombre} (${minutosAHora(f.desde)}–${minutosAHora(f.hasta)}) · energía ${f.energia}${
        pasada ? " · YA PASÓ, no asignes nada aquí" : ""
      }`;
    })
    .join("\n");
}

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
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    const minutosAhora = minutosAhoraBogota();

    const [perfilRes, itemsRes, cafeinaRes, tagsRes] = await Promise.all([
      supabase.from("profiles").select("hora_despertar, hora_dormir").single(),
      supabase
        .from("items")
        .select("id, texto, tipo, urgencia, fecha, hora, duracion_min, tag_id")
        .eq("done", false)
        .eq("clasificando", false)
        .in("tipo", ["tarea", "seguimiento", "evento"])
        .or(`fecha.is.null,fecha.lte.${hoy}`),
      supabase.from("energy_logs").select("mg").gte("consumido_at", `${hoy}T00:00:00`),
      supabase.from("tags").select("id, nombre"),
    ]);

    if (perfilRes.error) throw new Error(`Leyendo el perfil: ${perfilRes.error.message}`);
    if (itemsRes.error) throw new Error(`Leyendo los pendientes: ${itemsRes.error.message}`);

    const items = (itemsRes.data ?? []) as Item[];
    if (items.length === 0) {
      return jsonResponse({ resumen: "Hoy no tienes nada pendiente. Disfruta el día.", asignaciones: [] });
    }

    const franjas = construirFranjas(perfilRes.data.hora_despertar, perfilRes.data.hora_dormir);
    const tags = new Map((tagsRes.data ?? []).map((t: { id: string; nombre: string }) => [t.id, t.nombre]));
    const cafeina = (cafeinaRes.data ?? []).reduce((suma: number, log: { mg: number }) => suma + Number(log.mg), 0);

    const eventos = items.filter((i) => i.tipo === "evento" && i.hora);
    const tareas = items.filter((i) => i.tipo !== "evento" || !i.hora);

    const listaTareas = tareas
      .map((i) => {
        const partes = [
          `id: ${i.id}`,
          `"${i.texto}"`,
          i.tag_id ? `etiqueta ${tags.get(i.tag_id) ?? "?"}` : null,
          i.urgencia ? `urgencia ${i.urgencia}` : null,
          i.fecha ? (i.fecha < hoy ? `VENCIDA el ${i.fecha}` : `vence ${i.fecha}`) : "sin fecha",
          i.duracion_min ? `${i.duracion_min} min` : null,
        ].filter(Boolean);
        return `- ${partes.join(" · ")}`;
      })
      .join("\n");

    const listaEventos = eventos.length
      ? eventos.map((e) => `- ${e.hora} "${e.texto}"${e.duracion_min ? ` (${e.duracion_min} min)` : ""}`).join("\n")
      : "(sin eventos con hora hoy)";

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const respuesta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 2048,
      system: `Organizas el día de Sarah repartiendo sus pendientes entre las franjas de energía de hoy. Ella es diseñadora UX/UI y estudiante en Bogotá. Hablas español colombiano, directo y cálido, de tú.

Son las ${minutosAHora(minutosAhora)} de hoy ${hoy}.

## Sus franjas de energía hoy
${describirFranjas(franjas, minutosAhora)}

## Eventos con hora ya agendados
${listaEventos}

## Cafeína de hoy
${cafeina > 0 ? `${cafeina} mg` : "todavía nada"}

## Reglas
- Asigna UNA franja a CADA tarea de la lista, usando su id exacto.
- Lo que más cabeza pide (diseñar, escribir, resolver, entregar) va en las franjas de energía alta: foco y segundo_aire.
- Reuniones, trámites, llamadas y cosas mecánicas van en bajon o arranque.
- NO asignes nada a una franja que ya pasó. Si ya pasaron varias, reparte en las que quedan.
- No amontones todo en una sola franja: si hay eventos ocupando una franja, carga menos ahí.
- Lo vencido y lo urgente va primero, en la franja útil más cercana.

## El resumen
Máximo 3 frases. Dile en qué se le va el día y qué proteger, en su idioma, sin lista ni viñetas. Nada de "¡Hola!" ni relleno. Si viene apretado, dilo sin dramatizar.

Llama a la herramienta \`organizar_dia\` una sola vez.`,
      tools: [
        {
          name: "organizar_dia",
          description: "Entrega el resumen del día y la franja de cada tarea.",
          input_schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              resumen: { type: "string", description: "Máximo 3 frases." },
              asignaciones: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string", description: "El id exacto de la tarea." },
                    franja: { type: "string", enum: FRANJA_IDS },
                  },
                  required: ["id", "franja"],
                },
              },
            },
            required: ["resumen", "asignaciones"],
          },
        },
      ] as never,
      tool_choice: { type: "tool", name: "organizar_dia" },
      messages: [{ role: "user", content: `Mis pendientes:\n${listaTareas}` }],
    });

    const bloque = respuesta.content.find((b) => b.type === "tool_use");
    if (!bloque || bloque.type !== "tool_use") {
      throw new Error(`La IA no devolvió la herramienta (stop_reason: ${respuesta.stop_reason})`);
    }

    const parseo = planSchema.safeParse(bloque.input);
    if (!parseo.success) {
      console.error("plan-day devolvió algo que no valida:", JSON.stringify(bloque.input));
      throw new Error("La IA respondió en un formato inesperado");
    }

    // Solo guardamos asignaciones de tareas que existen de verdad.
    const idsValidos = new Set(tareas.map((t) => t.id));
    const asignaciones = parseo.data.asignaciones.filter((a) => idsValidos.has(a.id));

    await Promise.all(
      asignaciones.map((a) =>
        supabase.from("items").update({ franja: a.franja, franja_dia: hoy }).eq("id", a.id),
      ),
    );

    console.log(`plan-day OK: ${asignaciones.length}/${tareas.length} tareas asignadas`);

    return jsonResponse({ resumen: parseo.data.resumen, asignaciones });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("plan-day falló:", mensaje);
    return jsonResponse({ error: mensaje }, 200);
  }
});
