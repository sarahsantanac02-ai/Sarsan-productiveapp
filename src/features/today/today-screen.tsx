import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTags } from "@/features/tags/use-tags";

export function TodayScreen() {
  const { data: tags, isLoading, isError } = useTags();

  const ahora = new Date();
  const diaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "long", timeZone: "America/Bogota" }).format(ahora);
  const hoy = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(
    ahora,
  );

  return (
    <div className="space-y-6 px-4 pt-3">
      <section>
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{diaSemana}</p>
        <h1 className="font-display text-[34px] font-bold leading-none">
          Hoy <span className="text-muted-foreground">{hoy}</span>
        </h1>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Tus etiquetas</h2>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {isError && <p className="text-sm text-destructive">No se pudieron cargar tus etiquetas.</p>}
        {tags && (
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: `color-mix(in oklch, ${tag.color} 14%, var(--card))`,
                  color: tag.color,
                  borderColor: `color-mix(in oklch, ${tag.color} 35%, var(--border))`,
                }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.emoji} {tag.nombre}
              </span>
            ))}
            <Button variant="chip" size="sm">
              <Plus /> Nueva etiqueta
            </Button>
          </div>
        )}
      </section>

      <Card>
        <h2 className="font-display font-semibold">Captura, Calendario y "Organizar mi día"</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Llegan en las próximas fases. Por ahora puedes ver tus etiquetas aquí, tus medios de pago en Finanzas y
          tus hábitos en Mí — todo ya guardado en tu cuenta.
        </p>
      </Card>
    </div>
  );
}
