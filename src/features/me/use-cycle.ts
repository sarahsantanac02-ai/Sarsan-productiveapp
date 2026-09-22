import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { duracionesCiclo, promedioCiclo } from "@/lib/salud";
import { useAuth } from "@/features/auth/use-auth";

export function useCycle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cycle", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cycle_logs")
        .select("id, inicio")
        .eq("user_id", user!.id)
        .order("inicio", { ascending: false })
        .limit(13);
      if (error) throw error;

      const registros = data as Array<{ id: string; inicio: string }>;
      const duraciones = duracionesCiclo(registros.map((r) => r.inicio));
      return {
        registros,
        duraciones,
        promedio: promedioCiclo(duraciones),
        ultimo: registros[0]?.inicio ?? null,
      };
    },
  });
}

export function useLogCycle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inicio?: string) => {
      const { error } = await supabase
        .from("cycle_logs")
        .insert({ user_id: user!.id, inicio: inicio ?? todayBogota() });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cycle", user?.id] });
    },
  });
}

export function useUndoCycle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cycle_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cycle", user?.id] });
    },
  });
}
