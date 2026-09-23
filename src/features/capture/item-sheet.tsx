import { useState } from "react";
import { CalendarDays, Clock3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { todayBogota } from "@/lib/date";
import { resolverOpcionFecha, urgenciaPorFecha, type OpcionFecha, type Urgencia } from "@/lib/urgencia";
import { useBorrarItem, useCorregirTag, useUpdateItem, type Item } from "@/features/capture/use-items";
import { TagLogo } from "@/features/tags/tag-logo";
import { useTags } from "@/features/tags/use-tags";

const OPCIONES: Array<{ id: OpcionFecha; label: string }> = [
  { id: "hoy", label: "Hoy" },
  { id: "manana", label: "Mañana" },
  { id: "esta_semana", label: "Esta semana" },
  { id: "proxima_semana", label: "Próxima semana" },
];

const URGENCIAS: Array<{ id: Urgencia; label: string }> = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Media" },
  { id: "baja", label: "Baja" },
];

/** Todo lo de un pendiente en un solo lugar. Se abre manteniendo presionada la card. */
export function ItemSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { data: tags } = useTags();
  const updateItem = useUpdateItem();
  const corregirTag = useCorregirTag();
  const borrarItem = useBorrarItem();
  const hoy = todayBogota();

  const [texto, setTexto] = useState(item.texto);
  const [descripcion, setDescripcion] = useState(item.descripcion ?? "");
  const [fecha, setFecha] = useState(item.fecha ?? "");
  const [hora, setHora] = useState(item.hora?.slice(0, 5) ?? "");
  const [urgencia, setUrgencia] = useState<Urgencia>(item.urgencia ?? "media");
  const [tagId, setTagId] = useState(item.tag_id);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const ocupado = updateItem.isPending || corregirTag.isPending || borrarItem.isPending;
  const error = updateItem.error ?? corregirTag.error ?? borrarItem.error;

  function elegirFecha(nueva: string) {
    setFecha(nueva);
    // La urgencia sigue a la fecha, como cuando la IA la pone; se puede cambiar después.
    if (nueva) setUrgencia(urgenciaPorFecha(nueva, hoy));
    else setHora("");
  }

  const cambiaFechaUHora = (fecha || null) !== item.fecha || (hora || null) !== (item.hora?.slice(0, 5) ?? null);

  async function guardar() {
    const limpio = texto.trim();
    if (!limpio) return;

    const patch: Partial<Item> = {
      texto: limpio,
      fecha: fecha || null,
      hora: fecha && hora ? hora : null,
      urgencia,
    };
    // Solo si cambió: así, si la migración de la descripción aún no está
    // aplicada, lo demás se sigue pudiendo guardar.
    const nuevaDescripcion = descripcion.trim() || null;
    if (nuevaDescripcion !== (item.descripcion ?? null)) patch.descripcion = nuevaDescripcion;

    await updateItem.mutateAsync({ id: item.id, patch });
    // Cambiar la etiqueta a mano es una corrección que la IA aprende (tag_hints).
    if (tagId && tagId !== item.tag_id) await corregirTag.mutateAsync({ item, tagId });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">PENDIENTE</p>

      <textarea
        rows={2}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-label="Título"
        className="mt-1 w-full resize-none bg-transparent pr-8 font-display text-2xl font-bold leading-tight outline-none"
      />

      <Label htmlFor="item-descripcion">Descripción</Label>
      <textarea
        id="item-descripcion"
        rows={3}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Detalles, links, lo que necesites recordar"
        className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
      />

      <p className="mb-2 mt-5 text-xs font-semibold">Fecha</p>
      <div className="grid grid-cols-2 gap-2">
        {OPCIONES.map((opcion) => {
          const valor = resolverOpcionFecha(opcion.id, hoy);
          return (
            <Button
              key={opcion.id}
              variant={fecha === valor ? "choiceActive" : "choice"}
              className="h-11"
              onClick={() => elegirFecha(valor)}
            >
              {opcion.label}
            </Button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => elegirFecha(e.target.value)}
            aria-label="Elegir fecha"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className={cn("flex w-32 items-center gap-2 rounded-xl border border-border bg-card px-3", !fecha && "opacity-50")}>
          <Clock3 className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="time"
            value={hora}
            disabled={!fecha}
            onChange={(e) => setHora(e.target.value)}
            aria-label="Hora"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      {fecha && (
        <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => elegirFecha("")}>
          Quitar fecha
        </Button>
      )}
      {item.gcal_event_id && cambiaFechaUHora && (
        <p className="mt-1 text-xs text-muted-foreground">
          Ojo: este evento también está en Google Calendar y allá no se mueve solo.
        </p>
      )}

      <p className="mb-2 mt-5 text-xs font-semibold">Urgencia</p>
      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        {URGENCIAS.map((opcion) => (
          <Button
            key={opcion.id}
            variant={urgencia === opcion.id ? "segmentActive" : "segment"}
            size="sm"
            onClick={() => setUrgencia(opcion.id)}
          >
            {opcion.label}
          </Button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold">Etiqueta</p>
      <div className="flex flex-wrap gap-2">
        {tags?.map((tag) => {
          const activa = tag.id === tagId;
          return (
            <button
              key={tag.id}
              onClick={() => setTagId(tag.id)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: activa ? `color-mix(in oklch, ${tag.color} 16%, var(--card))` : "var(--card)",
                borderColor: activa ? tag.color : "var(--border)",
                color: activa ? tag.color : undefined,
              }}
            >
              <TagLogo tag={tag} className="size-3.5" /> {tag.nombre}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-xs text-destructive">{error.message}</p>}

      <Button variant="default" size="lg" className="mt-6 w-full" onClick={() => void guardar()} disabled={!texto.trim() || ocupado}>
        {updateItem.isPending || corregirTag.isPending ? "Guardando..." : "Guardar"}
      </Button>

      <div className="mt-3">
        {confirmarBorrado ? (
          <div className="rounded-2xl border border-destructive/40 p-3">
            <p className="text-sm">
              ¿Borrar este pendiente?{item.notion_page_id ? " En Notion se queda; bórralo allá si quieres." : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmarBorrado(false)}>
                No
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={ocupado}
                onClick={() => borrarItem.mutate(item.id, { onSuccess: onClose })}
              >
                {borrarItem.isPending ? "Borrando..." : "Sí, borrar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirmarBorrado(true)}>
            <Trash2 /> Borrar pendiente
          </Button>
        )}
      </div>
    </Sheet>
  );
}
