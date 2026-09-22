import { useRef, useState } from "react";
import { Camera, Pencil, Trash2, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { SectionHeading } from "@/features/me/section-heading";
import { useDeleteFood, useEstimateFood, useFoodToday, type Comida } from "@/features/me/use-food";
import { metaEnergia, TEXTO_ESTIMACION } from "@/lib/salud";
import type { Profile } from "@/features/onboarding/use-profile";

const COMIDAS: Array<{ id: Comida; label: string }> = [
  { id: "desayuno", label: "Desayuno" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "cena", label: "Cena" },
  { id: "snack", label: "Snack" },
];

export function FoodCard({ profile }: { profile: Profile }) {
  const { data: comidas } = useFoodToday();
  const estimate = useEstimateFood();
  const deleteFood = useDeleteFood();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  const meta = profile.edad
    ? metaEnergia({
        pesoKg: profile.peso_kg,
        estaturaCm: profile.estatura_cm,
        edad: profile.edad,
        actividad: profile.actividad,
      })
    : null;

  const consumido = Math.round((comidas ?? []).reduce((suma, c) => suma + Number(c.kcal ?? 0), 0));
  const falta = meta ? Math.max(0, meta - consumido) : null;

  const macros = (comidas ?? []).reduce(
    (acc, c) => ({
      proteina: acc.proteina + Number(c.proteina_g ?? 0),
      carbos: acc.carbos + Number(c.carbos_g ?? 0),
      grasa: acc.grasa + Number(c.grasa_g ?? 0),
    }),
    { proteina: 0, carbos: 0, grasa: 0 },
  );

  function elegirFoto(comida: Comida) {
    const input = inputFoto.current;
    if (!input) return;
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (archivo) estimate.mutate({ comida, foto: archivo });
      input.value = "";
    };
    input.click();
  }

  return (
    <Card>
      <SectionHeading
        icon={<Utensils />}
        title="Comida"
        meta={meta ? `${consumido.toLocaleString("es-CO")} / ${meta.toLocaleString("es-CO")} kcal` : `${consumido} kcal`}
      />

      {meta && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (consumido / meta) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {falta && falta > 0 ? `Te faltan ${falta.toLocaleString("es-CO")} kcal de energía.` : "Ya cubriste tu energía del día."}
          </p>
        </>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Macro value={`${Math.round(macros.proteina)} g`} label="Proteína" />
        <Macro value={`${Math.round(macros.carbos)} g`} label="Carbos" />
        <Macro value={`${Math.round(macros.grasa)} g`} label="Grasas" />
      </div>

      {comidas && comidas.length > 0 && (
        <div className="mt-4 divide-y divide-border">
          {comidas.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nombre ?? "Comida"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {COMIDAS.find((x) => x.id === c.comida)?.label}
                  {c.kcal ? ` · ${Math.round(Number(c.kcal))} kcal` : ""}
                  {c.kcal_min && c.kcal_max
                    ? ` (${Math.round(Number(c.kcal_min))}–${Math.round(Number(c.kcal_max))})`
                    : ""}
                  {c.confianza ? ` · confianza ${c.confianza}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => deleteFood.mutate(c.id)}
                aria-label={`Borrar ${c.nombre ?? "comida"}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setSheetAbierto(true)} disabled={estimate.isPending}>
          <Camera /> {estimate.isPending ? "Estimando..." : "Registrar"}
        </Button>
        <Button variant="soft" onClick={() => setSheetAbierto(true)} disabled={estimate.isPending}>
          <Pencil /> Describir
        </Button>
      </div>

      {estimate.isError && (
        <p className="mt-2 text-xs text-destructive">
          {estimate.error instanceof Error ? estimate.error.message : "No se pudo estimar"}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{TEXTO_ESTIMACION}</p>

      <input ref={inputFoto} type="file" accept="image/*" capture="environment" className="hidden" />

      {sheetAbierto && (
        <FoodSheet
          onClose={() => setSheetAbierto(false)}
          onFoto={(comida) => {
            setSheetAbierto(false);
            elegirFoto(comida);
          }}
          onDescripcion={(comida, descripcion) => {
            estimate.mutate({ comida, descripcion });
            setSheetAbierto(false);
          }}
        />
      )}
    </Card>
  );
}

function Macro({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted p-3 text-center">
      <p className="font-display text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function FoodSheet({
  onClose,
  onFoto,
  onDescripcion,
}: {
  onClose: () => void;
  onFoto: (comida: Comida) => void;
  onDescripcion: (comida: Comida, descripcion: string) => void;
}) {
  const [comida, setComida] = useState<Comida>("almuerzo");
  const [descripcion, setDescripcion] = useState("");

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">QUÉ COMISTE</p>
      <h2 className="mt-1 font-display text-2xl font-bold">Cuéntame</h2>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {COMIDAS.map((c) => (
          <Button
            key={c.id}
            variant={comida === c.id ? "choiceActive" : "choice"}
            className="h-11 text-xs"
            onClick={() => setComida(c.id)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <Button variant="default" size="lg" className="mt-5 w-full" onClick={() => onFoto(comida)}>
        <Camera /> Tomar foto
      </Button>

      <p className="mb-2 mt-5 text-xs font-semibold">O descríbelo</p>
      <textarea
        rows={2}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        placeholder="Ej: bandeja paisa con jugo de mora"
      />
      <Button
        variant="soft"
        size="lg"
        className="mt-3 w-full"
        onClick={() => onDescripcion(comida, descripcion.trim())}
        disabled={!descripcion.trim()}
      >
        Estimar
      </Button>
    </Sheet>
  );
}
