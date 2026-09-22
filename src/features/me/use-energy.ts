import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { useAuth } from "@/features/auth/use-auth";

export type Drink = { id: string; nombre: string; emoji: string | null; mg_cafeina: number };

export function useDrinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["drinks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("id, nombre, emoji, mg_cafeina")
        .eq("user_id", user!.id)
        .order("mg_cafeina", { ascending: false });
      if (error) throw error;
      return data as Drink[];
    },
  });
}

export function useCaffeineToday() {
  const { user } = useAuth();
  const dia = todayBogota();

  return useQuery({
    queryKey: ["caffeine", user?.id, dia],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_logs")
        .select("id, mg, consumido_at, drink_id")
        .eq("user_id", user!.id)
        .gte("consumido_at", `${dia}T00:00:00`)
        .order("consumido_at");
      if (error) throw error;
      const registros = data as Array<{ id: string; mg: number; consumido_at: string; drink_id: string | null }>;
      return {
        registros,
        total: registros.reduce((suma, r) => suma + Number(r.mg), 0),
      };
    },
  });
}

export function useLogDrink() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async (drink: Drink) => {
      const { error } = await supabase
        .from("energy_logs")
        .insert({ user_id: user!.id, drink_id: drink.id, mg: drink.mg_cafeina });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caffeine", user?.id, dia] });
    },
  });
}

export function useUndoDrink() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("energy_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caffeine", user?.id, dia] });
    },
  });
}
