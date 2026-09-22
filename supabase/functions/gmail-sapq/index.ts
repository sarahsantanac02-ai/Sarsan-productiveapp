import { createClient } from "npm:@supabase/supabase-js";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GoogleNoConectado, tokenDeGoogle } from "../_shared/google.ts";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

// Blueprint: hilos que mencionen SunAce, SAPQ o sunacepq.
const CONSULTA = "SunAce OR SAPQ OR sunacepq";

type Hilo = { id: string; snippet?: string; messages?: Array<{ payload?: { headers?: Array<{ name: string; value: string }> } }> };

function encabezado(hilo: Hilo, nombre: string): string | null {
  const headers = hilo.messages?.[0]?.payload?.headers ?? [];
  return headers.find((h) => h.name.toLowerCase() === nombre.toLowerCase())?.value ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonResponse({ error: "Falta el token de sesión" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Faltan las variables de Supabase" }, 500);

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Sesión inválida");

    const token = await tokenDeGoogle(admin, userData.user.id);
    const headers = { Authorization: `Bearer ${token}` };

    const lista = await fetch(
      `${API}/threads?q=${encodeURIComponent(CONSULTA)}&maxResults=10`,
      { headers },
    );
    if (!lista.ok) {
      throw new GoogleNoConectado(`Gmail respondió ${lista.status}: ${(await lista.text()).slice(0, 200)}`);
    }

    const { threads } = (await lista.json()) as { threads?: Array<{ id: string }> };
    if (!threads?.length) return jsonResponse({ hilos: [] });

    const detalles = await Promise.all(
      threads.map(async ({ id }) => {
        const respuesta = await fetch(
          `${API}/threads/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers },
        );
        if (!respuesta.ok) return null;
        const hilo = (await respuesta.json()) as Hilo;
        return {
          id,
          asunto: encabezado(hilo, "Subject") ?? "(sin asunto)",
          de: encabezado(hilo, "From") ?? "",
          fecha: encabezado(hilo, "Date") ?? "",
          resumen: hilo.snippet ?? "",
          link: `https://mail.google.com/mail/u/0/#inbox/${id}`,
          mensajes: hilo.messages?.length ?? 1,
        };
      }),
    );

    return jsonResponse({ hilos: detalles.filter(Boolean) });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const reconectar = error instanceof GoogleNoConectado;
    console.error("gmail-sapq falló:", mensaje);
    return jsonResponse({ error: mensaje, reconectar }, 200);
  }
});
