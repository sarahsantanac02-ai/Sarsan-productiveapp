import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { nombreMes } from "@/lib/dinero";
import { agruparPorMes, useHistorial } from "@/features/historial/use-historial";

/** Todo lo hecho antes de esta semana, agrupado por mes. Se abre desde Ajustes. */
export function HistorialCard() {
  const { data: items, isLoading } = useHistorial();
  const [abierto, setAbierto] = useState<string | null>(null);

  const meses = agruparPorMes(items ?? []);

  return (
    <Card>
      <h2 className="font-display font-semibold">Historial</h2>
      <p className="mt-1 text-xs text-muted-foreground">Lo que ya hiciste, mes a mes.</p>

      {isLoading && <p className="mt-3 text-xs text-muted-foreground">Cargando...</p>}

      {!isLoading && meses.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Todavía no hay nada aquí: lo que marques hecho llega cuando termine esa semana.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {meses.map(([mes, delMes]) => {
          const expandido = abierto === mes;
          return (
            <div key={mes} className="rounded-xl border border-border">
              <button
                onClick={() => setAbierto(expandido ? null : mes)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 p-3 text-left text-sm font-semibold"
              >
                {nombreMes(mes)}
                <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
                  {delMes.length} {delMes.length === 1 ? "hecho" : "hechos"}
                  <ChevronDown size={14} className={cn("transition-transform", expandido && "rotate-180")} />
                </span>
              </button>
              {expandido && (
                <div className="space-y-2 border-t border-border p-3 pt-2.5">
                  {delMes.map((item) => (
                    <p key={item.id} className="truncate text-sm text-muted-foreground line-through">
                      {item.texto}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
