import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";
import { useTags } from "@/features/tags/use-tags";
import { todayBogota } from "@/lib/date";
import { urgenciaPorFecha } from "@/lib/urgencia";

export type SugerenciaCorreo = {
  id: string;
  gmail_thread_id: string;
  asunto: string;
  de: string;
  recibido_at: string | null;
  link: string;
  tipo: "evento" | "tarea";
  titulo: string;
  fecha: string | null;
  hora: string | null;
  duracion_min: number | null;
  etiqueta: string | null;
  razon: string | null;
};

type Resumen = { revisados: number; nuevos: number; hallazgos: number };

/** Lo que la IA encontró y Sarah todavía no ha resuelto. */
export function useSugerenciasCorreo() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mail-suggestions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mail_suggestions")
        .select(
          "id, gmail_thread_id, asunto, de, recibido_at, link, tipo, titulo, fecha, hora, duracion_min, etiqueta, razon",
        )
        .eq("user_id", user!.id)
        .eq("estado", "propuesta")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SugerenciaCorreo[];
    },
  });
}

/** Manda a Claude a leer la bandeja. Devuelve cuántos correos miró y qué encontró. */
export function useRevisarCorreo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<Resumen & { error?: string; reconectar?: boolean }>(
        "gmail-triage",
        { body: {} },
      );
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error) as Error & { reconectar?: boolean };
        err.reconectar = data.reconectar;
        throw err;
      }
      return data as Resumen;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mail-suggestions", user?.id] });
    },
  });
}

/**
 * Crea el item y marca la sugerencia como aceptada. Un evento además se agenda
 * en Google Calendar reusando la función que ya existe — si esa parte falla, el
 * item igual queda creado y ella lo ve en sus pendientes.
 */
export function useAceptarSugerencia() {
  const { user } = useAuth();
  const { data: tags } = useTags();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sugerencia: SugerenciaCorreo) => {
      const hoy = todayBogota();
      const tagId = sugerencia.etiqueta
        ? tags?.find((t) => t.nombre === sugerencia.etiqueta)?.id ?? null
        : null;

      const { data: item, error } = await supabase
        .from("items")
        .insert({
          user_id: user!.id,
          texto: sugerencia.titulo,
          texto_original: sugerencia.asunto,
          tipo: sugerencia.tipo,
          tag_id: tagId,
          fecha: sugerencia.fecha,
          hora: sugerencia.hora,
          duracion_min: sugerencia.duracion_min,
          urgencia: sugerencia.fecha ? urgenciaPorFecha(sugerencia.fecha, hoy) : "media",
        })
        .select("id")
        .single();
      if (error) throw error;

      let avisoCalendario: string | null = null;
      if (sugerencia.tipo === "evento" && !sugerencia.fecha) {
        // El correo no decía cuándo. Queda en pendientes y ella le pone fecha
        // desde la card, que es el mismo camino de siempre.
        avisoCalendario = "El correo no decía la fecha, así que quedó en tus pendientes. Ponle fecha y ahí lo agendo.";
      } else if (sugerencia.tipo === "evento") {
        const { data: gcal, error: gcalError } = await supabase.functions.invoke<{ error?: string }>(
          "google-calendar",
          { body: { accion: "crear", item_id: item.id } },
        );
        const detalle = gcalError?.message ?? gcal?.error ?? null;
        if (detalle) {
          avisoCalendario = `Lo guardé en tus pendientes, pero no pude agendarlo en Google: ${detalle}`;
        }
      }

      const { error: updateError } = await supabase
        .from("mail_suggestions")
        .update({ estado: "aceptada", item_id: item.id })
        .eq("id", sugerencia.id);
      if (updateError) throw updateError;

      return { avisoCalendario };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mail-suggestions", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["gcal", user?.id] });
    },
  });
}

export function useDescartarSugerencia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mail_suggestions")
        .update({ estado: "descartada" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mail-suggestions", user?.id] });
    },
  });
}
