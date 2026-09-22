import type { SupabaseClient } from "npm:@supabase/supabase-js";

/**
 * Los access_token de Google duran una hora. Guardamos el refresh_token en
 * `integrations` al entrar por primera vez (ver use-auth.tsx) y aquí lo
 * cambiamos por uno fresco cuando hace falta.
 *
 * Ojo con el cliente: `integrations` NO tiene política de SELECT, justamente
 * para que el navegador no pueda leerse los tokens. Por eso estas funciones
 * reciben un cliente con service_role, y por eso TODA consulta aquí filtra por
 * user_id a mano: la service_role se salta el RLS.
 *
 * Necesita los secrets GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET: son los mismos
 * del cliente OAuth de Google Cloud que ya está configurado en Supabase Auth,
 * pero las Edge Functions no pueden leer esa configuración.
 */
export class GoogleNoConectado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "GoogleNoConectado";
  }
}

type Integracion = { access_token: string | null; refresh_token: string | null; expira_at: string | null };

export async function tokenDeGoogle(admin: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await admin
    .from("integrations")
    .select("access_token, refresh_token, expira_at")
    .eq("user_id", userId)
    .eq("proveedor", "google")
    .maybeSingle<Integracion>();

  if (error) throw new GoogleNoConectado(`No pude leer tu conexión con Google: ${error.message}`);
  if (!data?.refresh_token) {
    throw new GoogleNoConectado("Tu cuenta de Google no está conectada. Vuelve a entrar con Google para reconectarla.");
  }

  const vigente = data.expira_at && Date.parse(data.expira_at) > Date.now() + 60_000;
  if (vigente && data.access_token) return data.access_token;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new GoogleNoConectado("Faltan los secrets GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Supabase.");
  }

  const respuesta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    // En modo prueba de Google el refresh_token caduca a los 7 días.
    throw new GoogleNoConectado(
      `Google rechazó la reconexión (${respuesta.status}). Vuelve a entrar con Google. ${detalle.slice(0, 200)}`,
    );
  }

  const json = (await respuesta.json()) as { access_token: string; expires_in: number };
  const expiraAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

  await admin
    .from("integrations")
    .update({ access_token: json.access_token, expira_at: expiraAt })
    .eq("user_id", userId)
    .eq("proveedor", "google");

  return json.access_token;
}

const DIA_A_BYDAY: Record<string, string> = {
  lun: "MO",
  mar: "TU",
  mie: "WE",
  jue: "TH",
  vie: "FR",
  sab: "SA",
  dom: "SU",
};

/** RRULE semanal con BYDAY y UNTIL, como pide el blueprint. */
export function construirRrule(recurrencia: { dias: string[]; hasta: string | null }): string {
  const byday = recurrencia.dias.map((d) => DIA_A_BYDAY[d]).filter(Boolean).join(",");
  let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byday}`;
  if (recurrencia.hasta) {
    // UNTIL va en UTC; tomamos el final del día en Bogotá (UTC−5).
    const hasta = new Date(`${recurrencia.hasta}T23:59:59-05:00`);
    rrule += `;UNTIL=${hasta.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;
  }
  return rrule;
}
