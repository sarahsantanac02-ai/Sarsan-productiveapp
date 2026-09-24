import { useMemo, useState } from "react";
import { Plus, Sparkles, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { todayBogota } from "@/lib/date";
import { sumarDias } from "@/lib/urgencia";
import { construirFranjas, franjaActual, type Franja } from "@/lib/franjas";
import { useMinutoBogota } from "@/hooks/use-minuto";
import { useLongPress } from "@/hooks/use-long-press";
import { useProfile } from "@/features/onboarding/use-profile";
import { useTags, type Tag } from "@/features/tags/use-tags";
import { TagSheet } from "@/features/tags/tag-sheet";
import { TagLogo } from "@/features/tags/tag-logo";
import { TagEditorSheet } from "@/features/tags/tag-editor-sheet";
import { ItemSheet } from "@/features/capture/item-sheet";
import { TaskCard } from "@/features/capture/task-card";
import { useItems, useUpdateItem, type Item } from "@/features/capture/use-items";
import { FranjaBar } from "@/features/today/franja-bar";
import { usePlanDay } from "@/features/today/use-plan-day";
import { useEnviarANotion, useSincronizarNotion } from "@/features/integrations/use-notion";
import { SapqInbox } from "@/features/integrations/sapq-inbox";
import { MailInbox } from "@/features/integrations/mail-inbox";

type Vista = "hoy" | "manana" | "proximamente";

const VISTAS: { id: Vista; nombre: string }[] = [
  { id: "hoy", nombre: "Hoy" },
  { id: "manana", nombre: "Mañana" },
  { id: "proximamente", nombre: "Próximamente" },
];

export function TodayScreen() {
  const { data: profile } = useProfile();
  const { data: tags } = useTags();
  const { data: items, isLoading, isError } = useItems();
  const updateItem = useUpdateItem();
  const planDay = usePlanDay();
  const enviarANotion = useEnviarANotion();
  const sincronizarNotion = useSincronizarNotion();

  const [vista, setVista] = useState<Vista>("hoy");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [franjaElegida, setFranjaElegida] = useState<Franja | null>(null);
  const [editandoTag, setEditandoTag] = useState<Item | null>(null);
  const [editandoItem, setEditandoItem] = useState<Item | null>(null);
  // null = cerrado, "nueva" = crear, Tag = editar esa.
  const [editorTag, setEditorTag] = useState<Tag | "nueva" | null>(null);

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

  const manana = sumarDias(hoy, 1);
  /** Sin fecha cuenta como "proximamente": todavía no tiene un día asignado. */
  const vistaDeItem = (item: Item): Vista => {
    if (item.fecha && item.fecha <= hoy) return "hoy";
    if (item.fecha === manana) return "manana";
    return "proximamente";
  };

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
    if (vistaDeItem(item) !== vista) return false;
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
          {tags?.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              activa={filtroTag === tag.id}
              onTocar={() => setFiltroTag(filtroTag === tag.id ? null : tag.id)}
              onEditar={() => setEditorTag(tag)}
            />
          ))}
          {tags && (
            <Button variant="chip" size="sm" className="shrink-0" onClick={() => setEditorTag("nueva")}>
              <Plus /> Nueva etiqueta
            </Button>
          )}
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

      {/* Lo que Claude encontró en el correo, antes de los pendientes: ella
          aprueba y de ahí bajan a la lista de abajo. */}
      <MailInbox />

      <section className="space-y-3">
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {VISTAS.map((opcion) => (
            <Button
              key={opcion.id}
              variant={vista === opcion.id ? "segmentActive" : "segment"}
              size="sm"
              onClick={() => setVista(opcion.id)}
            >
              {opcion.nombre}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            {franjaElegida ? franjaElegida.nombre : VISTAS.find((opcion) => opcion.id === vista)!.nombre}
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
            onToggle={() => {
              const hecha = !item.done;
              updateItem.mutate({ id: item.id, patch: { done: hecha } });
              // Si la tarea vive también en Notion, deja la casilla al día allá.
              if (item.notion_page_id) {
                sincronizarNotion.mutate({ notionPageId: item.notion_page_id, hecha });
              }
            }}
            onTocarTag={() => setEditandoTag(item)}
            onEditar={() => setEditandoItem(item)}
            onNotion={() => enviarANotion.mutate(item.id)}
            enviandoANotion={enviarANotion.isPending && enviarANotion.variables === item.id}
          />
        ))}

        {enviarANotion.isError && (
          <p className="text-xs text-destructive">
            {enviarANotion.error instanceof Error ? enviarANotion.error.message : "No se pudo enviar a Notion"}
          </p>
        )}
      </section>

      {/* Blueprint: los correos de SAPQ se ven al filtrar por esa etiqueta. */}
      <SapqInbox activo={tags?.find((t) => t.id === filtroTag)?.nombre === "SAPQ"} />

      {editandoTag && <TagSheet item={editandoTag} onClose={() => setEditandoTag(null)} />}
      {editandoItem && <ItemSheet item={editandoItem} onClose={() => setEditandoItem(null)} />}
      {editorTag && (
        <TagEditorSheet tag={editorTag === "nueva" ? null : editorTag} onClose={() => setEditorTag(null)} />
      )}
    </div>
  );
}

/** Tocar filtra; mantener presionado abre la edición de la etiqueta. */
function TagChip({
  tag,
  activa,
  onTocar,
  onEditar,
}: {
  tag: Tag;
  activa: boolean;
  onTocar: () => void;
  onEditar: () => void;
}) {
  const longPress = useLongPress(onEditar);

  return (
    <button
      {...longPress}
      onClick={onTocar}
      className="no-callout inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
      style={{
        backgroundColor: activa ? tag.color : `color-mix(in oklch, ${tag.color} 14%, var(--card))`,
        color: activa ? "var(--primary-foreground)" : tag.color,
        borderColor: tag.color,
      }}
    >
      <TagLogo tag={tag} />
      {tag.nombre}
    </button>
  );
}
