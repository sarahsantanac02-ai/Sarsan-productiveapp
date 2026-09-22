import { useMemo, useState } from "react";
import { Sparkles, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { todayBogota } from "@/lib/date";
import { construirFranjas, franjaActual, type Franja } from "@/lib/franjas";
import { useMinutoBogota } from "@/hooks/use-minuto";
import { useProfile } from "@/features/onboarding/use-profile";
import { useTags } from "@/features/tags/use-tags";
import { TagSheet } from "@/features/tags/tag-sheet";
import { TaskCard } from "@/features/capture/task-card";
import { useItems, useUpdateItem, type Item } from "@/features/capture/use-items";
import { FranjaBar } from "@/features/today/franja-bar";
import { usePlanDay } from "@/features/today/use-plan-day";

export function TodayScreen() {
  const { data: profile } = useProfile();
  const { data: tags } = useTags();
  const { data: items, isLoading, isError } = useItems();
  const updateItem = useUpdateItem();
  const planDay = usePlanDay();

  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [franjaElegida, setFranjaElegida] = useState<Franja | null>(null);
  const [editandoTag, setEditandoTag] = useState<Item | null>(null);

  const hoy = todayBogota();
  const minutosAhora = useMinutoBogota();
  const diaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "long", timeZone: "America/Bogota" }).format(new Date());
  const fechaCorta = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  }).format(new Date());

  const franjas = useMemo(
    () => construirFranjas(profile?.hora_despertar ?? "06:00", profile?.hora_dormir ?? "22:00"),
    [profile?.hora_despertar, profile?.hora_dormir],
  );
  const actual = useMemo(() => franjaActual(franjas, minutosAhora), [franjas, minutosAhora]);

  const todos = items ?? [];
  const asignadaHoy = (item: Item) => (item.franja_dia === hoy ? item.franja : null);

  const conteos = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const item of todos) {
      const franja = asignadaHoy(item);
      if (franja) acc[franja] = (acc[franja] ?? 0) + 1;
    }
    return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, hoy]);

  const visibles = todos.filter((item) => {
    if (filtroTag && item.tag_id !== filtroTag) return false;
    if (franjaElegida && asignadaHoy(item) !== franjaElegida.id) return false;
    return true;
  });

  const hayFiltro = Boolean(filtroTag || franjaElegida);

  return (
    <div className="space-y-6 px-4 pt-3">
      <section>
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{diaSemana}</p>
        <h1 className="font-display text-[34px] font-bold leading-none">
          Hoy <span className="text-muted-foreground">{fechaCorta}</span>
        </h1>
      </section>

      <FranjaBar
        franjas={franjas}
        actual={actual}
        seleccionada={franjaElegida}
        onSeleccionar={(franja) => setFranjaElegida((previa) => (previa?.id === franja.id ? null : franja))}
        conteos={conteos}
      />

      <section>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {tags?.map((tag) => {
            const activa = filtroTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setFiltroTag(activa ? null : tag.id)}
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
        </div>
      </section>

      <section>
        <Button
          variant="soft"
          size="lg"
          className="w-full"
          onClick={() => planDay.mutate()}
          disabled={planDay.isPending || todos.length === 0}
        >
          <Wand2 />
          {planDay.isPending ? "Organizando..." : "Organizar mi día"}
        </Button>

        {planDay.data?.resumen && (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-3.5">
            <p className="text-sm leading-relaxed">{planDay.data.resumen}</p>
          </div>
        )}
        {planDay.isError && (
          <p className="mt-3 text-xs text-destructive">
            No pude organizarlo: {planDay.error instanceof Error ? planDay.error.message : "error desconocido"}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            {franjaElegida ? franjaElegida.nombre : "Lo que tienes hoy"}
          </h2>
          <div className="flex items-center gap-2">
            {visibles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {visibles.length} {visibles.length === 1 ? "pendiente" : "pendientes"}
              </span>
            )}
            {hayFiltro && (
              <Button
                variant="chip"
                size="sm"
                onClick={() => {
                  setFiltroTag(null);
                  setFranjaElegida(null);
                }}
              >
                <X /> Ver todo
              </Button>
            )}
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {isError && <p className="text-sm text-destructive">No se pudieron cargar tus pendientes.</p>}

        {items && visibles.length === 0 && (
          <div className="py-10 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">
              {hayFiltro ? "Nada por aquí" : "Eso es todo por ahora"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hayFiltro ? "Toca “Ver todo” para quitar los filtros." : "Toca el micrófono y suelta lo que tengas."}
            </p>
          </div>
        )}

        {visibles.map((item) => (
          <TaskCard
            key={item.id}
            item={item}
            tag={tags?.find((t) => t.id === item.tag_id)}
            franja={franjas.find((f) => f.id === asignadaHoy(item))}
            onToggle={() => updateItem.mutate({ id: item.id, patch: { done: !item.done } })}
            onTocarTag={() => setEditandoTag(item)}
          />
        ))}
      </section>

      {editandoTag && <TagSheet item={editandoTag} onClose={() => setEditandoTag(null)} />}
    </div>
  );
}
