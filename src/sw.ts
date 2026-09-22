/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Toma el control apenas se instala una versión nueva, para que Sarah no se
// quede con la app vieja en caché después de un deploy.
self.skipWaiting();
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

type Aviso = { titulo: string; cuerpo: string; url?: string };

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let aviso: Aviso;
  try {
    aviso = event.data.json() as Aviso;
  } catch {
    aviso = { titulo: "SarSan", cuerpo: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.cuerpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: aviso.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data?.url as string) ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      // Si la app ya está abierta, la enfoca en vez de abrir otra pestaña.
      for (const ventana of ventanas) {
        if ("focus" in ventana) {
          void ventana.navigate?.(destino);
          return ventana.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
