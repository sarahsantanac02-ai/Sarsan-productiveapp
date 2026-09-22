import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

export type EventoGoogle = {
  id: string;
  titulo: string;
  color_id: string | null;
  link: string | null;
  inicio: string | null;
  fin: string | null;
  dia_completo: boolean;
  fecha: string | null;
};

type RespuestaListar = { eventos?: EventoGoogle[]; error?: string; reconectar?: boolean };

export function useGoogleEvents(desde: string, hasta: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gcal", user?.id, desde, hasta],
    enabled: !!user,
    // Google cobra cuota por llamada y la agenda no cambia cada segundo.
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<RespuestaListar>("google-calendar", {
        body: { accion: "listar", desde, hasta },
      });
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error) as Error & { reconectar?: boolean };
        err.reconectar = data.reconectar;
        throw err;
      }
      return data?.eventos ?? [];
    },
    retry: false,
  });
}

/** Agenda en Google Calendar una tarea o evento que ya tiene fecha. */
export function useCrearEnGoogle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.functions.invoke<{ error?: string; gcal_event_id?: string }>(
        "google-calendar",
        { body: { accion: "crear", item_id: itemId } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["gcal", user?.id] });
    },
  });
}
