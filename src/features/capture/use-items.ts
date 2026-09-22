import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";
import type { Urgencia } from "@/lib/urgencia";
import type { FranjaId } from "@/lib/franjas";

export type Tipo = "tarea" | "evento" | "seguimiento" | "idea" | "gasto" | "ingreso";

export type Item = {
  id: string;
  texto: string;
  texto_original: string | null;
  tipo: Tipo;
  tag_id: string | null;
  urgencia: Urgencia | null;
  fecha: string | null;
  hora: string | null;
  duracion_min: number | null;
  done: boolean;
  clasificando: boolean;
  franja: FranjaId | null;
  franja_dia: string | null;
  created_at: string;
};

/** Lo que devuelve la Edge Function classify-capture. */
export type Clasificacion = {
  tipo: Tipo;
  tag_id: string | null;
  urgencia: Urgencia | null;
  fecha: string | null;
  monto: number | null;
  medio_id: string | null;
  pedir_notion: boolean;
  texto_limpio: string;
  transaction_id: string | null;
  error?: string;
  fallback?: boolean;
};

const ORDEN_URGENCIA: Record<Urgencia, number> = { alta: 0, media: 1, baja: 2 };

/** Blueprint: pendientes ordenados por fecha y luego urgencia. Sin fecha van al final. */
function ordenar(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.fecha !== b.fecha) {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return a.fecha < b.fecha ? -1 : 1;
    }
    const ua = ORDEN_URGENCIA[a.urgencia ?? "baja"];
    const ub = ORDEN_URGENCIA[b.urgencia ?? "baja"];
    if (ua !== ub) return ua - ub;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

export function useItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user!.id)
        .eq("done", false)
        .in("tipo", ["tarea", "evento", "seguimiento", "idea"]);
      if (error) throw error;
      return ordenar(data as Item[]);
    },
  });
}

/**
 * Inserta la captura al instante en estado "clasificando" (así la card aparece
 * antes de que responda la IA) y luego llama a la Edge Function, que actualiza
 * la fila con lo clasificado.
 */
export function useCapture() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (texto: string) => {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: user!.id,
          texto,
          texto_original: texto,
          tipo: "tarea",
          clasificando: true,
        })
        .select("id")
        .single();
      if (error) throw error;

      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });

      const { data: clasificacion, error: fnError } = await supabase.functions.invoke<Clasificacion>(
        "classify-capture",
        { body: { item_id: data.id, texto } },
      );
      if (fnError) throw fnError;

      return { itemId: data.id as string, texto, clasificacion };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
    },
  });
}

export function useUpdateItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Item> }) => {
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}

/**
 * Cambiar de etiqueta a mano es una corrección: se guarda en tag_hints para que
 * la IA la use como ejemplo en las próximas capturas (blueprint).
 */
export function useCorregirTag() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, tagId }: { item: Item; tagId: string }) => {
      const { error } = await supabase.from("items").update({ tag_id: tagId }).eq("id", item.id);
      if (error) throw error;

      const { error: hintError } = await supabase.from("tag_hints").insert({
        user_id: user!.id,
        texto: item.texto_original ?? item.texto,
        tag_id: tagId,
      });
      if (hintError) console.error("No se pudo guardar la corrección:", hintError.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}
