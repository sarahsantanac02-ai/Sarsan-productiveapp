import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

type Plan = {
  resumen?: string;
  asignaciones?: Array<{ id: string; franja: string }>;
  error?: string;
};

export function usePlanDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<Plan>("plan-day", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}
