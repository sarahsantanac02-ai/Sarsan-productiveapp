import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { useAuth } from "@/features/auth/use-auth";

export function useWaterToday() {
  const { user } = useAuth();
  const dia = todayBogota();

  return useQuery({
    queryKey: ["water", user?.id, dia],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("botellas")
        .eq("user_id", user!.id)
        .eq("dia", dia)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.botellas ?? 0);
    },
  });
}

export function useAddWater() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async ({ actual, suma, meta }: { actual: number; suma: number; meta: number }) => {
      const nuevo = Math.max(0, Math.min(meta, actual + suma));
      const { error } = await supabase
        .from("water_logs")
        .upsert({ user_id: user!.id, dia, botellas: nuevo }, { onConflict: "user_id,dia" });
      if (error) throw error;
      return nuevo;
    },
    onSuccess: (nuevo) => {
      queryClient.setQueryData(["water", user?.id, dia], nuevo);
    },
  });
}
