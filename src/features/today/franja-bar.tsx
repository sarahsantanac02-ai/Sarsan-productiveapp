import { BatteryCharging } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rangoCorto, type Franja, type FranjaId } from "@/lib/franjas";

// Alturas de la barra, tomadas de la referencia de Lovable: la energía alta
// se ve más alta, el bajón más bajo.
const ALTURA: Record<FranjaId, string> = {
  arranque: "h-8",
  foco: "h-14",
  bajon: "h-6",
  segundo_aire: "h-11",
  cierre: "h-7",
};

const NOMBRE_CORTO: Record<FranjaId, string> = {
  arranque: "Arranque",
  foco: "Foco",
  bajon: "Bajón",
  segundo_aire: "2º aire",
  cierre: "Cierre",
};

export function FranjaBar({
  franjas,
  actual,
  seleccionada,
  onSeleccionar,
  conteos,
}: {
  franjas: Franja[];
  actual: Franja | null;
  seleccionada: Franja | null;
  onSeleccionar: (franja: Franja) => void;
  conteos: Record<string, number>;
}) {
  const mostrada = seleccionada ?? actual;

  return (
    <section aria-label="Energía del día">
      <div className="flex h-24 items-end justify-between gap-2">
        {franjas.map((franja) => {
          const esActual = actual?.id === franja.id;
          const esSeleccionada = mostrada?.id === franja.id;
          const pendientes = conteos[franja.id] ?? 0;

          return (
            <Button
              key={franja.id}
              variant="energyBand"
              className="h-auto flex-1 px-0"
              onClick={() => onSeleccionar(franja)}
              aria-label={`${franja.nombre}, ${rangoCorto(franja)}${esActual ? ", franja actual" : ""}`}
              aria-pressed={esSeleccionada}
            >
              <span className="relative w-full">
                <span
                  className={cn(
                    "block w-full rounded-md transition-colors",
                    ALTURA[franja.id],
                    esSeleccionada ? "bg-primary" : esActual ? "bg-primary/40" : "bg-primary/14",
                  )}
                />
                {pendientes > 0 && (
                  <span className="absolute -right-0.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-urgent text-[9px] font-bold text-primary-foreground">
                    {pendientes}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "whitespace-normal text-[10px] leading-tight",
                  esSeleccionada ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {NOMBRE_CORTO[franja.id]}
              </span>
              <span className="text-[9px] font-normal text-muted-foreground">{rangoCorto(franja)}</span>
            </Button>
          );
        })}
      </div>

      {mostrada && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BatteryCharging size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {mostrada.nombre}
                {actual?.id === mostrada.id ? " · estás aquí ahora" : ` · ${rangoCorto(mostrada)}`}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mostrada.tip}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
