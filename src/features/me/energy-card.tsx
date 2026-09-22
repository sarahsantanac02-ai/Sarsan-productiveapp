import { Undo2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/me/section-heading";
import { useCaffeineToday, useDrinks, useLogDrink, useUndoDrink } from "@/features/me/use-energy";
import { horaCorteCafeina, minutosCorteCafeina, TOPE_CAFEINA_MG } from "@/lib/salud";
import { minutosAhoraBogota } from "@/lib/franjas";
import { cn } from "@/lib/utils";

export function EnergyCard({ horaDormir }: { horaDormir: string }) {
  const { data: drinks } = useDrinks();
  const { data: cafeina } = useCaffeineToday();
  const logDrink = useLogDrink();
  const undoDrink = useUndoDrink();

  const total = cafeina?.total ?? 0;
  const porcentaje = Math.min(100, (total / TOPE_CAFEINA_MG) * 100);
  const pasado = total > TOPE_CAFEINA_MG;

  const corte = horaCorteCafeina(horaDormir);
  const yaEsTarde = minutosAhoraBogota() >= minutosCorteCafeina(horaDormir);
  const ultimo = cafeina?.registros.at(-1);

  return (
    <Card>
      <SectionHeading icon={<Zap />} title="Energizantes" meta={`${total} / ${TOPE_CAFEINA_MG} mg`} />

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", pasado ? "bg-urgent" : "bg-amber")}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Tu hora de corte es a las <span className="font-semibold text-foreground">{corte}</span>
        {yaEsTarde ? " — ya pasó, ojo con el sueño." : "."}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {drinks?.map((drink) => (
          <Button
            key={drink.id}
            variant="tile"
            onClick={() => logDrink.mutate(drink)}
            disabled={logDrink.isPending}
            className="flex-col gap-0.5"
          >
            <span>
              {drink.emoji} {drink.nombre}
            </span>
            <span className="text-[9px] font-normal text-muted-foreground">{drink.mg_cafeina} mg</span>
          </Button>
        ))}
      </div>

      {ultimo && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          onClick={() => undoDrink.mutate(ultimo.id)}
          disabled={undoDrink.isPending}
        >
          <Undo2 /> Deshacer el último ({ultimo.mg} mg)
        </Button>
      )}
    </Card>
  );
}
