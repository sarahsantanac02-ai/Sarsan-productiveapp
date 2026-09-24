import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js";

import { jsonResponse } from "../_shared/cors.ts";
import { construirFranjas, horaAMinutos, minutosAhoraBogota } from "../_shared/franjas.ts";
import { enviarAviso, type Aviso, type Suscripcion } from "../_shared/push.ts";

// El cron corre cada 15 minutos; una cita cuenta si cae dentro de esta ventana.
const VENTANA_MIN = 15;

type Perfil = {
  id: string;
  hora_despertar: string;
  hora_dormir: string;
  botellas_meta: number;
};

type Prefs = {
  user_id: string;
  por_franja: boolean;
  cierre_hora: string;
  vencimientos: boolean;
  pendientes_individuales: boolean;
  pendientes_hora: string;
};

function dentroDeVentana(minutosAhora: number, objetivo: number): boolean {
  const diferencia = minutosAhora - objetivo;
  return diferencia >= 0 && diferencia < VENTANA_MIN;
}

async function yaEnviado(admin: SupabaseClient, userId: string, tipo: string, dia: string): Promise<boolean> {
  const { data } = await admin
    .from("notifications_sent")
    .select("id")
    .eq("user_id", userId)
    .eq("tipo", tipo)
    .eq("dia", dia)
    .maybeSingle();
  return Boolean(data);
}

async function marcarEnviado(admin: SupabaseClient, userId: string, tipo: string, dia: string) {
  await admin.from("notifications_sent").insert({ user_id: userId, tipo, dia });
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Faltan las variables de Supabase" }, 500);

  // Esta función la llama pg_cron, no un navegador: corre con service_role y
  // filtra por user_id a mano en cada consulta.
  const admin = createClient(supabaseUrl, serviceKey);

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const minutosAhora = minutosAhoraBogota();
  const enviados: string[] = [];

  try {
    const { data: perfiles, error } = await admin
      .from("profiles")
      .select("id, hora_despertar, hora_dormir, botellas_meta");
    if (error) throw new Error(`Leyendo perfiles: ${error.message}`);

    for (const perfil of (perfiles ?? []) as Perfil[]) {
      const [{ data: prefsData }, { data: subsData }] = await Promise.all([
        admin.from("notification_prefs").select("*").eq("user_id", perfil.id).maybeSingle(),
        admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", perfil.id),
      ]);

      const suscripciones = (subsData ?? []) as Suscripcion[];
      if (suscripciones.length === 0) continue;

      const prefs = (prefsData ?? {
        por_franja: true,
        cierre_hora: "19:00",
        vencimientos: true,
        pendientes_individuales: false,
        pendientes_hora: "07:00",
      }) as Prefs;
      const franjas = construirFranjas(perfil.hora_despertar, perfil.hora_dormir);
      const pendientes: Array<{ tipo: string; aviso: Aviso }> = [];

      // 1. Arranque de las franjas de energía alta, con la tarea más prioritaria.
      if (prefs.por_franja) {
        for (const franja of franjas.filter((f) => f.energia === "alta")) {
          if (!dentroDeVentana(minutosAhora, franja.desde)) continue;

          const { data: tareas } = await admin
            .from("items")
            .select("texto, urgencia")
            .eq("user_id", perfil.id)
            .eq("done", false)
            .eq("franja", franja.id)
            .eq("franja_dia", hoy)
            .limit(1);

          const tarea = tareas?.[0];
          pendientes.push({
            tipo: `franja:${franja.id}`,
            aviso: {
              titulo: `Arrancas ${franja.nombre}`,
              cuerpo: tarea ? `Prioridad: ${tarea.texto}` : "Tu mejor momento del día. Aprovéchalo.",
              url: "/",
            },
          });
        }
      }

      // 2. Lo que vence hoy, a las 9am.
      if (prefs.vencimientos && dentroDeVentana(minutosAhora, horaAMinutos("09:00"))) {
        const { data: vencen } = await admin
          .from("items")
          .select("texto")
          .eq("user_id", perfil.id)
          .eq("done", false)
          .eq("fecha", hoy)
          .limit(3);

        if (vencen && vencen.length > 0) {
          pendientes.push({
            tipo: "vencimientos",
            aviso: {
              titulo: vencen.length === 1 ? "Hoy vence" : `Hoy vencen ${vencen.length}`,
              cuerpo: vencen.map((v) => v.texto).join(" · "),
              url: "/",
            },
          });
        }
      }

      // 2b. Un aviso separado por cada pendiente de "Hoy" (hoy o atrasado), sin
      // agrupar y sin tope: si hay 8, salen 8.
      if (prefs.pendientes_individuales && dentroDeVentana(minutosAhora, horaAMinutos(prefs.pendientes_hora))) {
        const { data: deHoy } = await admin
          .from("items")
          .select("id, texto")
          .eq("user_id", perfil.id)
          .eq("done", false)
          .in("tipo", ["tarea", "evento", "seguimiento", "idea"])
          .lte("fecha", hoy);

        for (const item of deHoy ?? []) {
          pendientes.push({
            tipo: `pendiente:${item.id}`,
            aviso: { titulo: "Pendiente por hacer", cuerpo: item.texto, url: "/" },
          });
        }
      }

      // 3. Cierre del día: no negociables y agua pendientes.
      if (dentroDeVentana(minutosAhora, horaAMinutos(prefs.cierre_hora))) {
        const [{ data: habitos }, { data: hechos }, { data: agua }] = await Promise.all([
          admin.from("habits").select("id").eq("user_id", perfil.id).eq("activo", true),
          admin.from("habit_logs").select("habit_id").eq("user_id", perfil.id).eq("dia", hoy).eq("hecho", true),
          admin.from("water_logs").select("botellas").eq("user_id", perfil.id).eq("dia", hoy).maybeSingle(),
        ]);

        const faltanHabitos = (habitos?.length ?? 0) - (hechos?.length ?? 0);
        const botellas = Number(agua?.botellas ?? 0);
        const faltaAgua = Math.max(0, perfil.botellas_meta - botellas);

        const partes: string[] = [];
        if (faltanHabitos > 0) partes.push(`${faltanHabitos} no negociable${faltanHabitos === 1 ? "" : "s"}`);
        if (faltaAgua > 0) partes.push(`${faltaAgua % 1 === 0 ? faltaAgua : faltaAgua.toFixed(2)} de agua`);

        if (partes.length > 0) {
          pendientes.push({
            tipo: "cierre",
            aviso: { titulo: "Antes de cerrar el día", cuerpo: `Te falta: ${partes.join(" y ")}`, url: "/mi" },
          });
        }
      }

      // 4. Media hora antes del corte de cafeína, solo si ya tomó algo hoy.
      const corteCafeina = horaAMinutos(perfil.hora_dormir) - 6 * 60;
      const avisoCafeina = ((corteCafeina - 30) % 1440 + 1440) % 1440;
      if (dentroDeVentana(minutosAhora, avisoCafeina)) {
        const { data: cafeina } = await admin
          .from("energy_logs")
          .select("mg")
          .eq("user_id", perfil.id)
          .gte("consumido_at", `${hoy}T00:00:00`);

        if (cafeina && cafeina.length > 0) {
          pendientes.push({
            tipo: "cafeina",
            aviso: {
              titulo: "En 30 minutos es tu hora de corte",
              cuerpo: "Si tomas cafeína después, te va a costar dormir.",
              url: "/mi",
            },
          });
        }
      }

      for (const { tipo, aviso } of pendientes) {
        if (await yaEnviado(admin, perfil.id, tipo, hoy)) continue;

        const muertos = await enviarAviso(suscripciones, aviso);
        if (muertos.length > 0) {
          await admin.from("push_subscriptions").delete().in("endpoint", muertos);
        }
        await marcarEnviado(admin, perfil.id, tipo, hoy);
        enviados.push(`${perfil.id}:${tipo}`);
      }
    }

    if (enviados.length > 0) console.log(`check-notifications envió: ${enviados.join(", ")}`);
    return jsonResponse({ enviados });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("check-notifications falló:", mensaje);
    return jsonResponse({ error: mensaje }, 500);
  }
});
