import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/app-shell";
import { useHabitsToday, useToggleHabit } from "@/features/me/use-habits";

export function MeScreen() {
  const { data, isLoading, isError } = useHabitsToday();
  const toggleHabit = useToggleHabit();

  const total = data?.habits.length ?? 0;
  const hechos = data?.done.size ?? 0;
  const progreso = total > 0 ? Math.round((hechos / total) * 100) : 0;

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Cuidarme también cuenta" title="Mí" />
      <div className="space-y-5 px-4 pt-5">
        <Card>
          <div className="flex items-center gap-4">
            <div className="progress-ring" style={{ "--progress": `${progreso}%` } as React.CSSProperties}>
              <span className="font-display text-lg font-bold">
                {hechos}/{total}
              </span>
            </div>
            <div>
              <h2 className="font-display font-semibold">No negociables</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {total === 0 ? "Aún no tienes hábitos activos." : "Marca lo que ya hiciste hoy."}
              </p>
            </div>
          </div>

          {isLoading && <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>}
          {isError && <p className="mt-4 text-sm text-destructive">No se pudieron cargar tus hábitos.</p>}

          {data && (
            <div className="mt-4 divide-y divide-border">
              {data.habits.map((habit) => {
                const hecho = data.done.has(habit.id);
                return (
                  <div key={habit.id} className="flex min-h-11 items-center gap-2.5 py-2">
                    <Button
                      variant={hecho ? "checkActive" : "check"}
                      size="iconSm"
                      onClick={() => toggleHabit.mutate({ habitId: habit.id, hecho: !hecho })}
                      aria-label={hecho ? `Desmarcar ${habit.nombre}` : `Marcar ${habit.nombre}`}
                    >
                      {hecho && <Check />}
                    </Button>
                    <span className="flex-1 text-sm font-medium">
                      {habit.emoji} {habit.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Agua, comida, energizantes y ciclo</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Llegan en la Fase 5.</p>
        </Card>
      </div>
    </div>
  );
}
