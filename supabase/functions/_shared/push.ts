import webpush from "npm:web-push";

export type Suscripcion = { endpoint: string; p256dh: string; auth: string };

export type Aviso = { titulo: string; cuerpo: string; url?: string };

let configurado = false;

function configurar() {
  if (configurado) return;
  const publica = Deno.env.get("VAPID_PUBLIC_KEY");
  const privada = Deno.env.get("VAPID_PRIVATE_KEY");
  const contacto = Deno.env.get("VAPID_SUBJECT") ?? "mailto:sarah.santanac02@gmail.com";
  if (!publica || !privada) throw new Error("Faltan los secrets VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY");
  webpush.setVapidDetails(contacto, publica, privada);
  configurado = true;
}

/**
 * Manda el aviso a todos los dispositivos registrados. Devuelve los endpoints
 * que ya no sirven (404/410) para poder borrarlos.
 */
export async function enviarAviso(suscripciones: Suscripcion[], aviso: Aviso): Promise<string[]> {
  configurar();
  const muertos: string[] = [];

  await Promise.all(
    suscripciones.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(aviso),
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          muertos.push(sub.endpoint);
        } else {
          console.error(`Push falló (${status}):`, error instanceof Error ? error.message : error);
        }
      }
    }),
  );

  return muertos;
}
