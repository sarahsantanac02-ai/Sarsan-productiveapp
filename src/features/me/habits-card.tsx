import { useState } from "react";
import { Check, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHabitsToday, useToggleHabit } from "@/features/me/use-habits";
import { ReadingSheet } from "@/features/me/reading-sheet";

const HABITO_LECTURA = "Leer 20 minutos";

export function HabitsCard() {
  const { data, isLoading, isError } = useHabitsToday();
  const toggleHabit = useToggleHabit();
  const [leyendo, setLeyendo] = useState(false);

  const total = data?.habits.length ?? 0;
  const hechos = data?.done.size ?? 0;
  const progreso = total > 0 ? Math.round((hechos / total) * 100) : 0;

  return (
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
            {total === 0
              ? "Aún no tienes hábitos activos."
              : hechos === total
                ? "Los cerraste todos. Bien ahí."
                : `Te faltan ${total - hechos}.`}
          </p>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>}
      {isError && <p className="mt-4 text-sm text-destructive">No se pudieron cargar tus hábitos.</p>}

      {data && (
        <div className="mt-4 divide-y divide-border">
          {data.habits.map((habit) => {
            const hecho = data.done.has(habit.id);
            const racha = data.rachas.get(habit.id) ?? 0;
            const esLectura = habit.nombre === HABITO_LECTURA;

            return (
              <div key={habit.id} className="flex min-h-11 items-center gap-2.5 py-2">
                <Button
                  variant={hecho ? "checkActive" : "check"}
                  size="iconSm"
                  onClick={() => {
                    toggleHabit.mutate({ habitId: habit.id, hecho: !hecho });
                    if (esLectura && !hecho) setLeyendo(true);
                  }}
                  aria-label={hecho ? `Desmarcar ${habit.nombre}` : `Marcar ${habit.nombre}`}
                >
                  {hecho && <Check />}
                </Button>

                <span className="flex-1 text-sm font-medium">
                  {habit.emoji} {habit.nombre}
                </span>

                {racha > 1 && (
                  <span
                    className="flex items-center gap-0.5 text-xs text-urgent"
                    aria-label={`Racha de ${racha} días`}
                  >
                    <Flame size={13} /> {racha}
                  </span>
                )}

                {esLectura && (
                  <Button variant="soft" size="sm" onClick={() => setLeyendo(true)}>
                    Resumen
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {leyendo && <ReadingSheet onClose={() => setLeyendo(false)} />}
    </Card>
  );
}
