import { cn } from "@/lib/utils";
import { colorDeEvento } from "@/lib/agenda";
import type { EventoGoogle } from "@/features/calendar/use-calendar";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

/** Celdas de la grilla: días del mes precedidos por los huecos hasta el lunes. */
function celdasDelMes(mes: string): Array<string | null> {
  const [anio, mesNum] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(anio, mesNum - 1, 1));
  const huecos = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const total = new Date(Date.UTC(anio, mesNum, 0)).getUTCDate();

  const celdas: Array<string | null> = Array(huecos).fill(null);
  for (let dia = 1; dia <= total; dia++) {
    celdas.push(`${mes}-${String(dia).padStart(2, "0")}`);
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export function MonthView({
  mes,
  eventos,
  hoy,
  onElegirDia,
}: {
  mes: string;
  eventos: EventoGoogle[];
  hoy: string;
  onElegirDia: (dia: string) => void;
}) {
  const celdas = celdasDelMes(mes);

  const porDia = new Map<string, EventoGoogle[]>();
  for (const evento of eventos) {
    if (!evento.fecha) continue;
    porDia.set(evento.fecha, [...(porDia.get(evento.fecha) ?? []), evento]);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-3">
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
        {DIAS.map((dia, i) => (
          <span key={`${dia}${i}`} className="py-2">
            {dia}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`hueco-${i}`} className="aspect-square border-t border-border" />;

          const delDia = porDia.get(dia) ?? [];
          const esHoy = dia === hoy;

          return (
            <button
              key={dia}
              onClick={() => onElegirDia(dia)}
              className={cn(
                "relative flex aspect-square cursor-pointer flex-col items-center border-t border-border pt-2 text-xs transition-colors",
                esHoy && "rounded-xl bg-primary font-bold text-primary-foreground",
              )}
              aria-label={`${Number(dia.slice(-2))}, ${delDia.length} eventos`}
            >
              <span>{Number(dia.slice(-2))}</span>
              <span className="mt-1 flex gap-0.5">
                {delDia.slice(0, 3).map((evento) => (
                  <span
                    key={evento.id}
                    className="size-1 rounded-full"
                    style={{ backgroundColor: esHoy ? "var(--primary-foreground)" : colorDeEvento(evento.color_id) }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
