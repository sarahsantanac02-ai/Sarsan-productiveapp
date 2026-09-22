import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { reducirImagen } from "@/lib/imagen";
import { useAuth } from "@/features/auth/use-auth";

export type Comida = "desayuno" | "almuerzo" | "cena" | "snack";

export type FoodLog = {
  id: string;
  comida: Comida;
  nombre: string | null;
  kcal: number | null;
  kcal_min: number | null;
  kcal_max: number | null;
  proteina_g: number | null;
  carbos_g: number | null;
  grasa_g: number | null;
  confianza: string | null;
  foto_path: string | null;
};

export function useFoodToday() {
  const { user } = useAuth();
  const dia = todayBogota();

  return useQuery({
    queryKey: ["food", user?.id, dia],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("id, comida, nombre, kcal, kcal_min, kcal_max, proteina_g, carbos_g, grasa_g, confianza, foto_path")
        .eq("user_id", user!.id)
        .eq("dia", dia)
        .order("created_at");
      if (error) throw error;
      return data as FoodLog[];
    },
  });
}

export function useEstimateFood() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async ({
      comida,
      descripcion,
      foto,
    }: {
      comida: Comida;
      descripcion?: string;
      foto?: File;
    }) => {
      let fotoPath: string | undefined;

      if (foto) {
        const reducida = await reducirImagen(foto);
        fotoPath = `${user!.id}/${dia}-${comida}-${Date.now()}.jpg`;
        const { error: subidaError } = await supabase.storage
          .from("comida")
          .upload(fotoPath, reducida, { contentType: "image/jpeg" });
        if (subidaError) throw new Error(`No se pudo subir la foto: ${subidaError.message}`);
      }

      const { data, error } = await supabase.functions.invoke<{ error?: string; nombre?: string }>("estimate-food", {
        body: { comida, descripcion, foto_path: fotoPath },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["food", user?.id, dia] });
      void queryClient.invalidateQueries({ queryKey: ["habits-today", user?.id, dia] });
    },
  });
}

export function useDeleteFood() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["food", user?.id, dia] });
    },
  });
}
