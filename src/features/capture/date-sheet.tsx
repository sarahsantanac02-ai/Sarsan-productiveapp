import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { todayBogota } from "@/lib/date";
import { resolverOpcionFecha, urgenciaPorFecha, type OpcionFecha } from "@/lib/urgencia";
import { useUpdateItem } from "@/features/capture/use-items";

const OPCIONES: Array<{ id: OpcionFecha; label: string }> = [
  { id: "hoy", label: "Hoy" },
  { id: "manana", label: "Mañana" },
  { id: "esta_semana", label: "Esta semana" },
  { id: "proxima_semana", label: "Próxima semana" },
];

export function DateSheet({
  itemId,
  texto,
  onClose,
}: {
  itemId: string;
  texto: string;
  onClose: () => void;
}) {
  const [otraFecha, setOtraFecha] = useState("");
  const updateItem = useUpdateItem();
  const hoy = todayBogota();

  function guardar(fecha: string | null) {
    updateItem.mutate(
      { id: itemId, patch: { fecha, urgencia: fecha ? urgenciaPorFecha(fecha, hoy) : "media" } },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">UN PASO MÁS</p>
      <h2 className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">
        ¿Para cuándo necesitas esto listo?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{texto}</p>

      <div className="my-5 grid grid-cols-2 gap-2">
        {OPCIONES.map((opcion) => (
          <Button
            key={opcion.id}
            variant="choice"
            onClick={() => guardar(resolverOpcionFecha(opcion.id, hoy))}
            disabled={updateItem.isPending}
          >
            {opcion.label}
          </Button>
        ))}
      </div>

      <Label htmlFor="otra-fecha">Elegir fecha</Label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <input
          id="otra-fecha"
          type="date"
          value={otraFecha}
          onChange={(e) => setOtraFecha(e.target.value)}
          className="h-12 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => guardar(null)} disabled={updateItem.isPending}>
          Sin fecha
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={() => guardar(otraFecha)}
          disabled={!otraFecha || updateItem.isPending}
        >
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}
