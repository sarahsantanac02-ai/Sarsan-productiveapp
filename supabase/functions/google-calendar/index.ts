import { createClient } from "npm:@supabase/supabase-js";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { construirRrule, GoogleNoConectado, tokenDeGoogle } from "../_shared/google.ts";

const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TZ = "America/Bogota";

type EventoGoogle = {
  id: string;
  summary?: string;
  colorId?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonResponse({ error: "Falta el token de sesión" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl) return jsonResponse({ error: "Falta SUPABASE_URL" }, 500);
  if (!serviceKey) return jsonResponse({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, 500);

  // Cliente con el JWT de Sarah para todo lo normal (RLS aplica)...
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  // ...y uno con service_role SOLO para `integrations`, que no es legible por el cliente.
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Sesión inválida");
    const userId = userData.user.id;

    const body = await req.json();
    const token = await tokenDeGoogle(admin, userId);

    if (body.accion === "listar") {
      const params = new URLSearchParams({
        timeMin: new Date(`${body.desde}T00:00:00-05:00`).toISOString(),
        timeMax: new Date(`${body.hasta}T23:59:59-05:00`).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const respuesta = await fetch(`${API}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!respuesta.ok) {
        throw new GoogleNoConectado(`Google Calendar respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
      }

      const json = (await respuesta.json()) as { items?: EventoGoogle[] };
      const eventos = (json.items ?? []).map((e) => ({
        id: e.id,
        titulo: e.summary ?? "(sin título)",
        color_id: e.colorId ?? null,
        link: e.htmlLink ?? null,
        inicio: e.start.dateTime ?? null,
        fin: e.end.dateTime ?? null,
        dia_completo: Boolean(e.start.date),
        fecha: e.start.date ?? e.start.dateTime?.slice(0, 10) ?? null,
      }));

      return jsonResponse({ eventos });
    }

    if (body.accion === "crear") {
      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("id, texto, fecha, hora, duracion_min, recurrencia, gcal_event_id")
        .eq("id", body.item_id)
        .single();
      if (itemError) throw new Error(`No encontré esa tarea: ${itemError.message}`);
      if (!item.fecha) throw new Error("Esa tarea no tiene fecha, no puedo agendarla");
      if (item.gcal_event_id) return jsonResponse({ ya_existe: true, gcal_event_id: item.gcal_event_id });

      const duracion = item.duracion_min ?? 60;
      const cuerpo: Record<string, unknown> = { summary: item.texto };

      if (item.hora) {
        const inicio = new Date(`${item.fecha}T${item.hora}-05:00`);
        const fin = new Date(inicio.getTime() + duracion * 60_000);
        cuerpo.start = { dateTime: inicio.toISOString(), timeZone: TZ };
        cuerpo.end = { dateTime: fin.toISOString(), timeZone: TZ };
      } else {
        const siguiente = new Date(Date.parse(item.fecha) + 86_400_000).toISOString().slice(0, 10);
        cuerpo.start = { date: item.fecha };
        cuerpo.end = { date: siguiente };
      }

      if (item.recurrencia) {
        cuerpo.recurrence = [construirRrule(item.recurrencia as { dias: string[]; hasta: string | null })];
      }

      const respuesta = await fetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!respuesta.ok) {
        throw new GoogleNoConectado(`Google Calendar respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
      }

      const creado = (await respuesta.json()) as EventoGoogle;
      await supabase
        .from("items")
        .update({ gcal_event_id: creado.id, gcal_status: "creado" })
        .eq("id", item.id);

      console.log(`google-calendar creó "${item.texto}" → ${creado.id}`);
      return jsonResponse({ gcal_event_id: creado.id, link: creado.htmlLink ?? null });
    }

    return jsonResponse({ error: "Acción desconocida" }, 400);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const reconectar = error instanceof GoogleNoConectado;
    console.error("google-calendar falló:", mensaje);
    // El blueprint pide que si Google falla, el resto de la app siga: devolvemos
    // 200 con el detalle para que la pantalla muestre cómo reconectar.
    return jsonResponse({ error: mensaje, reconectar }, 200);
  }
});
