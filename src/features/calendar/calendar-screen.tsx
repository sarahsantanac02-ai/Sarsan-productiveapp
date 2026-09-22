import { CalendarDays } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/app-shell";

export function CalendarScreen() {
  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Google Calendar" title="Calendario" />
      <div className="px-4 pt-5">
        <Card className="text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <CalendarDays />
          </span>
          <p className="mt-3 font-display text-sm font-semibold">Llega en la Fase 4</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vistas Día, 3 días y Mes, conectadas con tu Google Calendar.
          </p>
        </Card>
      </div>
    </div>
  );
}
