import { Droplets } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/me/section-heading";
import { useAddWater, useWaterToday } from "@/features/me/use-water";

const PASOS = [
  { suma: 0.25, label: "+¼" },
  { suma: 0.5, label: "+½" },
  { suma: 1, label: "+1" },
];

export function WaterCard({ botellaMl, meta }: { botellaMl: number; meta: number }) {
  const { data: botellas = 0 } = useWaterToday();
  const addWater = useAddWater();

  const litros = ((botellas * botellaMl) / 1000).toFixed(2);
  const metaLitros = ((meta * botellaMl) / 1000).toFixed(1);

  return (
    <Card>
      <SectionHeading icon={<Droplets />} title="Agua" meta={`${litros} / ${metaLitros} L`} />

      <div className="my-4 flex justify-center gap-4">
        {Array.from({ length: meta }, (_, i) => {
          const llenado = Math.min(100, Math.max(0, (botellas - i) * 100));
          return (
            <div key={i} className="water-bottle" aria-label={`Botella ${i + 1}: ${Math.round(llenado)}%`}>
              <span style={{ height: `${llenado}%` }} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PASOS.map((paso) => (
          <Button
            key={paso.label}
            variant="soft"
            onClick={() => addWater.mutate({ actual: botellas, suma: paso.suma, meta })}
            disabled={addWater.isPending || botellas >= meta}
          >
            {paso.label}
          </Button>
        ))}
      </div>

      {botellas > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => addWater.mutate({ actual: botellas, suma: -0.25, meta })}
          disabled={addWater.isPending}
        >
          Me pasé, quítale ¼
        </Button>
      )}
    </Card>
  );
}
