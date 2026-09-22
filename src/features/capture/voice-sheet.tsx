import { useEffect } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useSpeech } from "@/features/capture/use-speech";

const EJEMPLOS = ["“el viernes”", "“es urgente”", "“para la U”", "“18 mil con Nequi”"];

export function VoiceSheet({ onClose, onCapturar }: { onClose: () => void; onCapturar: (texto: string) => void }) {
  const { texto, escuchando, error, soportado, empezar, detener } = useSpeech();

  useEffect(() => {
    if (soportado) empezar();
  }, [soportado, empezar]);

  function listo() {
    detener();
    const limpio = texto.trim();
    if (limpio) onCapturar(limpio);
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-urgent-soft text-urgent">
          <span className={`size-4 rounded-full bg-urgent ${escuchando ? "pulse-dot" : ""}`} />
        </span>
        <h2 className="font-display text-2xl font-bold">{escuchando ? "Escuchando" : "Listo para escuchar"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Habla como te salga. Yo lo ordeno.</p>
      </div>

      <div className="my-6 min-h-24 rounded-2xl border border-border bg-card p-4">
        {texto ? (
          <p className="text-sm leading-relaxed">
            {texto}
            {escuchando && <span className="typing-cursor" />}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {escuchando ? "Te escucho..." : "Toca el botón de abajo para empezar."}
            {escuchando && <span className="typing-cursor" />}
          </p>
        )}
      </div>

      {error && <p className="mb-4 text-center text-xs text-destructive">{error}</p>}
      {!soportado && (
        <p className="mb-4 text-center text-xs text-muted-foreground">
          Tu navegador no deja dictar. Cierra esto y usa el lápiz para escribir.
        </p>
      )}

      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">También puedes decir</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EJEMPLOS.map((ejemplo) => (
            <span key={ejemplo} className="example-chip">
              {ejemplo}
            </span>
          ))}
        </div>
      </div>

      {escuchando ? (
        <Button variant="default" size="lg" className="w-full" onClick={listo} disabled={!texto.trim()}>
          <Check /> Listo, ordénalo
        </Button>
      ) : (
        <Button variant="outline" size="lg" className="w-full" onClick={empezar} disabled={!soportado}>
          Empezar a hablar
        </Button>
      )}
    </Sheet>
  );
}
