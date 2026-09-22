import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { colorDeEvento, minutosDelDia, ubicarBloques } from "@/lib/agenda";
import { minutosAHora, type Franja } from "@/lib/franjas";
import type { EventoGoogle } from "@/features/calendar/use-calendar";
import type { Item } from "@/features/capture/use-items";

const ALTO_HORA = 56; // px por hora, igual que la referencia de Lovable
const COLUMNA_HORAS = 58;

function minutosAPx(minutos: number, desdeHora: number) {
  return ((minutos - desdeHora * 60) / 60) * ALTO_HORA;
}

export function DayView({
  dia,
  eventos,
  tareas,
  franjas,
  minutosAhora,
  esHoy,
}: {
  dia: string;
  eventos: EventoGoogle[];
  tareas: Item[];
  franjas: Franja[];
  minutosAhora: number;
  esHoy: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  const delDia = eventos.filter((e) => e.fecha === dia);
  const conHora = delDia.filter((e) => !e.dia_completo && e.inicio && e.fin);
  const todoElDia = delDia.filter((e) => e.dia_completo);
  const tareasConHora = tareas.filter((t) => t.fecha === dia && t.hora);
  const tareasSinHora = tareas.filter((t) => t.fecha === dia && !t.hora);

  // Muestra desde una hora antes del primer evento (mínimo 6am) hasta 11pm.
  const primerInicio = Math.min(
    ...conHora.map((e) => minutosDelDia(e.inicio!)),
    ...tareasConHora.map((t) => Number(t.hora!.slice(0, 2)) * 60),
    9 * 60,
  );
  const desdeHora = Math.max(0, Math.floor(primerInicio / 60) - 1);
  const hastaHora = 23;
  const horas = Array.from({ length: hastaHora - desdeHora + 1 }, (_, i) => desdeHora + i);

  const ubicados = ubicarBloques([
    ...conHora.map((e) => ({ id: e.id, inicioMin: minutosDelDia(e.inicio!), finMin: minutosDelDia(e.fin!) })),
    ...tareasConHora.map((t) => {
      const inicio = Number(t.hora!.slice(0, 2)) * 60 + Number(t.hora!.slice(3, 5));
      return { id: `item-${t.id}`, inicioMin: inicio, finMin: inicio + (t.duracion_min ?? 60) };
    }),
  ]);

  // Al abrir, centra la vista en la hora actual.
  useEffect(() => {
    if (!esHoy || !contenedor.current) return;
    contenedor.current.scrollTop = Math.max(0, minutosAPx(minutosAhora, desdeHora) - 120);
  }, [esHoy, minutosAhora, desdeHora]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      {(todoElDia.length > 0 || tareasSinHora.length > 0) && (
        <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">Todo el día</span>
          {todoElDia.map((e) => (
            <span
              key={e.id}
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: `${colorDeEvento(e.color_id)}22`, color: colorDeEvento(e.color_id) }}
            >
              {e.titulo}
            </span>
          ))}
          {tareasSinHora.map((t) => (
            <span
              key={t.id}
              className="rounded-md border border-dashed border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
            >
              {t.texto}
            </span>
          ))}
        </div>
      )}

      <div ref={contenedor} className="relative max-h-[540px] overflow-y-auto">
        <div className="relative" style={{ height: horas.length * ALTO_HORA }}>
          {/* Franjas de energía alta, sombreadas de fondo */}
          {franjas
            .filter((f) => f.energia === "alta")
            .map((f) => (
              <div
                key={f.id}
                className="absolute left-0 right-0 bg-primary/5"
                style={{
                  top: minutosAPx(f.desde, desdeHora),
                  height: minutosAPx(f.hasta, desdeHora) - minutosAPx(f.desde, desdeHora),
                }}
                aria-hidden
              />
            ))}

          {/* Rejilla de horas */}
          {horas.map((hora, i) => (
            <div
              key={hora}
              className="absolute left-0 right-0 grid grid-cols-[58px_1fr]"
              style={{ top: i * ALTO_HORA, height: ALTO_HORA }}
            >
              <span className="pr-2 pt-1 text-right text-[10px] text-muted-foreground">
                {minutosAHora(hora * 60)}
              </span>
              <span className="border-t border-border" />
            </div>
          ))}

          {/* Eventos */}
          {ubicados.map((bloque) => {
            const esTarea = bloque.id.startsWith("item-");
            const evento = esTarea ? null : conHora.find((e) => e.id === bloque.id);
            const tarea = esTarea ? tareasConHora.find((t) => `item-${t.id}` === bloque.id) : null;
            const color = evento ? colorDeEvento(evento.color_id) : "var(--muted-foreground)";
            const anchoPct = 100 / bloque.columnas;

            return (
              <div
                key={bloque.id}
                className={cn(
                  "absolute overflow-hidden rounded-lg border-l-4 p-2",
                  esTarea && "border-dashed border-y border-r",
                )}
                style={{
                  top: minutosAPx(bloque.inicioMin, desdeHora),
                  height: Math.max(22, minutosAPx(bloque.finMin, desdeHora) - minutosAPx(bloque.inicioMin, desdeHora) - 2),
                  left: `calc(${COLUMNA_HORAS}px + ${bloque.columna * anchoPct}% - ${(bloque.columna * anchoPct * COLUMNA_HORAS) / 100}px)`,
                  width: `calc(${anchoPct}% - ${(anchoPct * COLUMNA_HORAS) / 100}px - 6px)`,
                  backgroundColor: esTarea ? "transparent" : `${color}1f`,
                  borderColor: color,
                  color,
                }}
              >
                <p className="text-[10px] font-semibold leading-tight">{minutosAHora(bloque.inicioMin)}</p>
                <p className="mt-0.5 truncate text-xs font-semibold leading-tight">
                  {evento?.titulo ?? tarea?.texto}
                </p>
              </div>
            );
          })}

          {/* Línea de la hora actual */}
          {esHoy && minutosAhora >= desdeHora * 60 && minutosAhora <= (hastaHora + 1) * 60 && (
            <div
              className="pointer-events-none absolute left-11 right-0 z-20 flex items-center"
              style={{ top: minutosAPx(minutosAhora, desdeHora) }}
              aria-label="Hora actual"
            >
              <span className="size-2 rounded-full bg-urgent" />
              <span className="h-px flex-1 bg-urgent" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
