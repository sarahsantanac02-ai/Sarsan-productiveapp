import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { useAuth } from "@/features/auth/use-auth";

export type Habit = {
  id: string;
  nombre: string;
  emoji: string | null;
  orden: number;
};

export function useHabitsToday() {
  const { user } = useAuth();
  const dia = todayBogota();

  return useQuery({
    queryKey: ["habits-today", user?.id, dia],
    enabled: !!user,
    queryFn: async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("id, nombre, emoji, orden").eq("user_id", user!.id).eq("activo", true).order("orden"),
        supabase.from("habit_logs").select("habit_id").eq("user_id", user!.id).eq("dia", dia).eq("hecho", true),
      ]);
      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      const done = new Set(logsRes.data.map((log) => log.habit_id));
      return {
        habits: habitsRes.data as Habit[],
        done,
      };
    },
  });
}

export function useToggleHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dia = todayBogota();

  return useMutation({
    mutationFn: async ({ habitId, hecho }: { habitId: string; hecho: boolean }) => {
      if (hecho) {
        const { error } = await supabase
          .from("habit_logs")
          .upsert({ user_id: user!.id, habit_id: habitId, dia, hecho: true }, { onConflict: "habit_id,dia" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("dia", dia);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["habits-today", user?.id, dia] });
    },
  });
}
