import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { racha } from "@/lib/salud";
import { useAuth } from "@/features/auth/use-auth";

export type Habit = {
  id: string;
  nombre: string;
  emoji: string | null;
  orden: number;
};

const DIAS_HISTORIAL = 60;

export function useHabitsToday() {
  const { user } = useAuth();
  const dia = todayBogota();

  return useQuery({
    queryKey: ["habits-today", user?.id, dia],
    enabled: !!user,
    queryFn: async () => {
      const desde = new Date(Date.parse(dia) - DIAS_HISTORIAL * 86_400_000).toISOString().slice(0, 10);

      const [habitsRes, logsRes] = await Promise.all([
        supabase
          .from("habits")
          .select("id, nombre, emoji, orden")
          .eq("user_id", user!.id)
          .eq("activo", true)
          .order("orden"),
        supabase
          .from("habit_logs")
          .select("habit_id, dia")
          .eq("user_id", user!.id)
          .eq("hecho", true)
          .gte("dia", desde),
      ]);
      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      const porHabito = new Map<string, string[]>();
      for (const log of logsRes.data as Array<{ habit_id: string; dia: string }>) {
        const lista = porHabito.get(log.habit_id) ?? [];
        lista.push(log.dia);
        porHabito.set(log.habit_id, lista);
      }

      const habits = habitsRes.data as Habit[];
      return {
        habits,
        done: new Set(
          (logsRes.data as Array<{ habit_id: string; dia: string }>)
            .filter((l) => l.dia === dia)
            .map((l) => l.habit_id),
        ),
        rachas: new Map(habits.map((h) => [h.id, racha(porHabito.get(h.id) ?? [], dia)])),
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
