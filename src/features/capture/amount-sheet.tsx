import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { useAuth } from "@/features/auth/use-auth";
import type { TipoMovimiento } from "@/features/finance/use-transactions";

/** Falta el monto: sin él no existe el movimiento en Finanzas todavía. Al
 * guardar, se crea la transacción y de ahí se sigue preguntando el medio. */
export function AmountSheet({
  texto,
  tipo,
  fecha,
  onClose,
  onListo,
}: {
  texto: string;
  tipo: TipoMovimiento;
  fecha: string | null;
  onClose: () => void;
  onListo: (transactionId: string, monto: number) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [monto, setMonto] = useState("");

  const crear = useMutation({
    mutationFn: async () => {
      const montoLimpio = Number(monto);
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          tipo,
          monto: montoLimpio,
          fecha: fecha ?? todayBogota(),
          texto,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id as string, monto: montoLimpio };
    },
    onSuccess: ({ id, monto: montoGuardado }) => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      onListo(id, montoGuardado);
    },
  });

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">UN PASO MÁS</p>
      <h2 className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">¿Cuánto fue?</h2>
      <p className="mt-2 text-sm text-muted-foreground">{texto}</p>

      <Input
        type="number"
        inputMode="numeric"
        min={0}
        autoFocus
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Ej: 18000"
        aria-label="Monto"
        className="mt-5"
      />

      {crear.isError && <p className="mt-2 text-xs text-destructive">No se pudo guardar. Intenta otra vez.</p>}

      <Button
        variant="default"
        size="lg"
        className="mt-5 w-full"
        onClick={() => crear.mutate()}
        disabled={!monto || Number(monto) <= 0 || crear.isPending}
      >
        {crear.isPending ? "Guardando..." : "Guardar"}
      </Button>

      <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
        Después le digo
      </Button>
    </Sheet>
  );
}
