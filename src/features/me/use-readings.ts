import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { useAuth } from "@/features/auth/use-auth";

export type Reading = { id: string; dia: string; libro: string | null; resumen: string | null };

export function useReadings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["readings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("readings")
        .select("id, dia, libro, resumen")
        .eq("user_id", user!.id)
        .order("dia", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Reading[];
    },
  });
}

export function useSaveReading() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ libro, resumen }: { libro: string; resumen: string }) => {
      const { error } = await supabase
        .from("readings")
        .insert({ user_id: user!.id, dia: todayBogota(), libro, resumen });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["readings", user?.id] });
    },
  });
}
