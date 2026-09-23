import { Check, Clock3, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/use-long-press";
import { etiquetaFecha, etiquetaHora, todayBogota } from "@/lib/date";
import type { Franja } from "@/lib/franjas";
import type { Item } from "@/features/capture/use-items";
import { TagLogo } from "@/features/tags/tag-logo";
import type { Tag } from "@/features/tags/use-tags";

const ETIQUETA_TIPO: Partial<Record<Item["tipo"], string>> = {
  evento: "Evento",
  seguimiento: "Seguimiento",
  idea: "Idea",
};

export function TaskCard({
  item,
  tag,
  franja,
  onToggle,
  onTocarTag,
  onEditar,
  onNotion,
  enviandoANotion,
}: {
  item: Item;
  tag: Tag | undefined;
  franja?: Franja;
  onToggle: () => void;
  onTocarTag: () => void;
  /** Mantener presionada la card (o tocar "Sin fecha") abre la edición completa. */
  onEditar: () => void;
  onNotion?: () => void;
  enviandoANotion?: boolean;
}) {
  const hoy = todayBogota();
  const color = tag?.color ?? "#6b7280";
  const longPress = useLongPress(onEditar);

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
      {...longPress}
      className={cn("no-callout rounded-2xl border border-border border-l-[5px] bg-card p-3.5", item.done && "opacity-55")}
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
              <TagLogo tag={tag} />
            </button>
          </div>

          {item.descripcion && (
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">{item.descripcion}</p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.fecha && (
              <span className={cn("tag", item.urgencia === "alta" ? "tag-urgent" : "tag-date")}>
                <Clock3 />
                {etiquetaFecha(item.fecha, hoy)}
                {item.hora ? ` · ${etiquetaHora(item.hora)}` : ""}
              </span>
            )}
            {!item.fecha && (
              <button onClick={onEditar} className="tag tag-neutral cursor-pointer">
                Sin fecha · ponerla
              </button>
            )}
            {franja && (
              <span className="tag tag-neutral">
                <Zap />
                {franja.nombre}
              </span>
            )}
            {tipoEtiqueta && <span className="tag tag-neutral">{tipoEtiqueta}</span>}

            {item.notion_page_id ? (
              <span className="tag tag-neutral">N · En Notion</span>
            ) : (
              onNotion && (
                <button
                  onClick={onNotion}
                  disabled={enviandoANotion}
                  className="tag tag-neutral cursor-pointer disabled:opacity-50"
                >
                  N · {enviandoANotion ? "Enviando..." : "Colocar en Notion"}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
