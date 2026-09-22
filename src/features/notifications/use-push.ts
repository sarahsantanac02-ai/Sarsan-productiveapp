import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** En iPhone, el push solo funciona si la app está instalada en la pantalla de inicio. */
export function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function estaInstalada(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || "standalone" in navigator;
}

export function soportaPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** La llave VAPID viaja en base64url; pushManager.subscribe la quiere en bytes. */
function base64UrlABuffer(base64: string): ArrayBuffer {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(normal);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

export function usePushSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["push_subscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, dispositivo, created_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as Array<{ id: string; endpoint: string; dispositivo: string | null; created_at: string }>;
    },
  });
}

export function useActivarPush() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!soportaPush()) throw new Error("Este navegador no soporta notificaciones.");
      if (!VAPID_PUBLIC_KEY) throw new Error("Falta VITE_VAPID_PUBLIC_KEY en las variables de entorno.");
      if (esIOS() && !estaInstalada()) {
        throw new Error(
          "En iPhone primero tienes que instalar SarSan en la pantalla de inicio: botón de compartir → Añadir a pantalla de inicio.",
        );
      }

      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") throw new Error("No diste permiso para las notificaciones.");

      const registro = await navigator.serviceWorker.ready;
      const existente = await registro.pushManager.getSubscription();
      const suscripcion =
        existente ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlABuffer(VAPID_PUBLIC_KEY),
        }));

      const json = suscripcion.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user!.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          dispositivo: esIOS() ? "iPhone" : navigator.platform || "Navegador",
        },
        { onConflict: "user_id,endpoint" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["push_subscriptions", user?.id] });
    },
  });
}

export function useDesactivarPush() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("push_subscriptions").delete().eq("id", id);
      if (error) throw error;

      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      await suscripcion?.unsubscribe();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["push_subscriptions", user?.id] });
    },
  });
}

export function useNotificationPrefs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notification_prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_prefs")
        .select("por_franja, cierre_hora, vencimientos")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as { por_franja: boolean; cierre_hora: string; vencimientos: boolean };
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<{ por_franja: boolean; cierre_hora: string; vencimientos: boolean }>) => {
      const { error } = await supabase.from("notification_prefs").update(patch).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification_prefs", user?.id] });
    },
  });

  return { ...query, update };
}
