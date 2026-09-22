import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTags } from "@/features/tags/use-tags";
import { TagSheet } from "@/features/tags/tag-sheet";
import { TaskCard } from "@/features/capture/task-card";
import { useItems, useUpdateItem, type Item } from "@/features/capture/use-items";

export function TodayScreen() {
  const { data: tags } = useTags();
  const { data: items, isLoading, isError } = useItems();
  const updateItem = useUpdateItem();
  const [filtro, setFiltro] = useState<string | null>(null);
  const [editandoTag, setEditandoTag] = useState<Item | null>(null);

  const ahora = new Date();
  const diaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "long", timeZone: "America/Bogota" }).format(ahora);
  const hoy = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(
    ahora,
  );

  const visibles = filtro ? (items ?? []).filter((item) => item.tag_id === filtro) : (items ?? []);

  return (
    <div className="space-y-6 px-4 pt-3">
      <section>
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{diaSemana}</p>
        <h1 className="font-display text-[34px] font-bold leading-none">
          Hoy <span className="text-muted-foreground">{hoy}</span>
        </h1>
      </section>

      <section>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {tags?.map((tag) => {
            const activa = filtro === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setFiltro(activa ? null : tag.id)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activa ? tag.color : `color-mix(in oklch, ${tag.color} 14%, var(--card))`,
                  color: activa ? "var(--primary-foreground)" : tag.color,
                  borderColor: activa ? tag.color : `color-mix(in oklch, ${tag.color} 35%, var(--border))`,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: activa ? "var(--primary-foreground)" : tag.color }}
                />
                {tag.emoji} {tag.nombre}
              </button>
            );
          })}
          <Button variant="chip" size="sm">
            <Plus /> Nueva etiqueta
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Lo que tienes hoy</h2>
          {visibles.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {visibles.length} {visibles.length === 1 ? "pendiente" : "pendientes"}
            </span>
          )}
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {isError && <p className="text-sm text-destructive">No se pudieron cargar tus pendientes.</p>}

        {items && visibles.length === 0 && (
          <div className="py-10 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">
              {filtro ? "Nada en esta etiqueta" : "Eso es todo por ahora"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtro ? "Toca la etiqueta otra vez para ver todo." : "Toca el micrófono y suelta lo que tengas."}
            </p>
          </div>
        )}

        {visibles.map((item) => (
          <TaskCard
            key={item.id}
            item={item}
            tag={tags?.find((t) => t.id === item.tag_id)}
            onToggle={() => updateItem.mutate({ id: item.id, patch: { done: !item.done } })}
            onTocarTag={() => setEditandoTag(item)}
          />
        ))}
      </section>

      {editandoTag && <TagSheet item={editandoTag} onClose={() => setEditandoTag(null)} />}
    </div>
  );
}
