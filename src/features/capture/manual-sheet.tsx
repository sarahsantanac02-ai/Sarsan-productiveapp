import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function ManualSheet({ onClose, onCapturar }: { onClose: () => void; onCapturar: (texto: string) => void }) {
  const [texto, setTexto] = useState("");

  function guardar() {
    const limpio = texto.trim();
    if (!limpio) return;
    onCapturar(limpio);
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">NUEVA CAPTURA</p>
      <h2 className="mt-1 font-display text-2xl font-bold">Sácalo de tu cabeza</h2>

      <textarea
        autoFocus
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="mt-5 w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
        placeholder="¿Qué tienes pendiente?"
      />

      <p className="mt-3 text-xs text-muted-foreground">
        Escríbelo como se te venga: la fecha, la plata y la etiqueta las saco yo.
      </p>

      <Button variant="default" size="lg" className="mt-6 w-full" onClick={guardar} disabled={!texto.trim()}>
        Guardar
      </Button>
    </Sheet>
  );
}
