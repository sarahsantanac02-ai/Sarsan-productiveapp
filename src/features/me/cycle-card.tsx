import { Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/me/section-heading";
import { useCycle, useLogCycle } from "@/features/me/use-cycle";
import { etiquetaFecha, todayBogota } from "@/lib/date";

export function CycleCard() {
  const { data } = useCycle();
  const logCycle = useLogCycle();
  const hoy = todayBogota();

  const duraciones = data?.duraciones ?? [];
  const promedio = data?.promedio;
  const maximo = duraciones.length ? Math.max(...duraciones, 35) : 35;
  const yaRegistroHoy = data?.ultimo === hoy;

  const diasDesdeUltimo = data?.ultimo
    ? Math.round((Date.parse(hoy) - Date.parse(data.ultimo)) / 86_400_000)
    : null;

  return (
    <Card>
      <SectionHeading icon={<Moon />} title="Ciclo" meta={promedio ? `Promedio ${promedio} días` : undefined} />

      {diasDesdeUltimo !== null && (
        <p className="mt-2 text-xs text-muted-foreground">
          Último inicio: {etiquetaFecha(data!.ultimo!, hoy)} · llevas {diasDesdeUltimo}{" "}
          {diasDesdeUltimo === 1 ? "día" : "días"}.
        </p>
      )}

      {duraciones.length > 0 ? (
        <div className="cycle-chart mt-5">
          {duraciones.map((dias, i) => (
            <span key={i} style={{ height: `${(dias / maximo) * 80}px` }}>
              <i>{dias}</i>
            </span>
          ))}
          {promedio && <div style={{ bottom: `${(promedio / maximo) * 80}px` }} />}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Cuando registres dos inicios te muestro la duración de tus ciclos y el promedio.
        </p>
      )}

      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => logCycle.mutate(undefined)}
        disabled={logCycle.isPending || yaRegistroHoy}
      >
        {yaRegistroHoy ? "Registrado hoy" : "Me llegó"}
      </Button>
    </Card>
  );
}
