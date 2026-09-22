import { Check, Clock3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { etiquetaFecha, etiquetaHora, todayBogota } from "@/lib/date";
import type { Item } from "@/features/capture/use-items";
import type { Tag } from "@/features/tags/use-tags";

const ETIQUETA_TIPO: Partial<Record<Item["tipo"], string>> = {
  evento: "Evento",
  seguimiento: "Seguimiento",
  idea: "Idea",
};

export function TaskCard({
  item,
  tag,
  onToggle,
  onTocarTag,
}: {
  item: Item;
  tag: Tag | undefined;
  onToggle: () => void;
  onTocarTag: () => void;
}) {
  const hoy = todayBogota();
  const color = tag?.color ?? "#6b7280";

  if (item.clasificando) {
    return (
      <article className="rounded-2xl border border-border bg-card p-3.5 opacity-70">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Sparkles size={15} className="pulse-dot" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold leading-snug">{item.texto}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ordenando...</p>
          </div>
        </div>
      </article>
    );
  }

  const tipoEtiqueta = ETIQUETA_TIPO[item.tipo];

  return (
    <article
      className={cn("rounded-2xl border border-border border-l-[5px] bg-card p-3.5", item.done && "opacity-55")}
      style={{ borderLeftColor: color }}
    >
      <div className="flex gap-3">
        <Button
          variant={item.done ? "checkActive" : "check"}
          size="iconSm"
          onClick={onToggle}
          aria-label={item.done ? "Marcar como pendiente" : "Completar"}
        >
          {item.done && <Check />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-display text-sm font-semibold leading-snug", item.done && "line-through")}>
              {item.texto}
            </p>
            <button
              onClick={onTocarTag}
              aria-label={`Cambiar etiqueta (ahora: ${tag?.nombre ?? "sin etiqueta"})`}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[13px]"
              style={{ backgroundColor: `color-mix(in oklch, ${color} 16%, var(--card))` }}
            >
              {tag?.emoji ?? "✦"}
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.fecha && (
              <span className={cn("tag", item.urgencia === "alta" ? "tag-urgent" : "tag-date")}>
                <Clock3 />
                {etiquetaFecha(item.fecha, hoy)}
                {item.hora ? ` · ${etiquetaHora(item.hora)}` : ""}
              </span>
            )}
            {!item.fecha && <span className="tag tag-neutral">Sin fecha</span>}
            {tipoEtiqueta && <span className="tag tag-neutral">{tipoEtiqueta}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
