import { useEffect, useState } from "react";
import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { useSpeech } from "@/features/capture/use-speech";
import { useReadings, useSaveReading } from "@/features/me/use-readings";

export function ReadingSheet({ onClose }: { onClose: () => void }) {
  const { data: lecturas } = useReadings();
  const saveReading = useSaveReading();
  const { texto, escuchando, soportado, empezar, detener } = useSpeech();

  // Precarga el último libro: casi siempre sigue leyendo el mismo.
  const [libro, setLibro] = useState("");
  const [resumen, setResumen] = useState("");

  useEffect(() => {
    if (lecturas?.[0]?.libro && !libro) setLibro(lecturas[0].libro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturas]);

  useEffect(() => {
    if (texto) setResumen(texto);
  }, [texto]);

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">LEER 20 MINUTOS</p>
      <h2 className="mt-1 font-display text-2xl font-bold">¿Qué leíste?</h2>

      <div className="mt-5">
        <Label htmlFor="libro">Libro</Label>
        <Input id="libro" value={libro} onChange={(e) => setLibro(e.target.value)} placeholder="Nombre del libro" />
      </div>

      <div className="mt-4">
        <Label htmlFor="resumen">Lo que te quedó</Label>
        <textarea
          id="resumen"
          rows={4}
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          placeholder="Una idea, una frase, lo que sea"
        />
        {soportado && (
          <Button
            variant={escuchando ? "checkActive" : "chip"}
            size="sm"
            className="mt-2"
            onClick={() => (escuchando ? detener() : empezar())}
          >
            {escuchando ? (
              <>
                <Square /> Listo
              </>
            ) : (
              <>
                <Mic /> Dictar
              </>
            )}
          </Button>
        )}
      </div>

      <Button
        variant="default"
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          detener();
          saveReading.mutate({ libro: libro.trim(), resumen: resumen.trim() }, { onSuccess: onClose });
        }}
        disabled={!resumen.trim() || saveReading.isPending}
      >
        {saveReading.isPending ? "Guardando..." : "Guardar"}
      </Button>

      {lecturas && lecturas.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Lo que has leído</p>
          <div className="divide-y divide-border">
            {lecturas.slice(0, 5).map((lectura) => (
              <div key={lectura.id} className="py-2.5">
                <p className="text-xs font-semibold">{lectura.libro ?? "Sin libro"}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {lectura.resumen}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
