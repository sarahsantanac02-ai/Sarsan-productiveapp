import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { tipoEmoji, usePaymentMethods } from "@/features/finance/use-payment-methods";
import {
  useBorrarTransaccion,
  useMoneyCategories,
  useUpdateTransaction,
  type Transaction,
} from "@/features/finance/use-transactions";

/** Todo lo de un movimiento en un solo lugar. Se abre manteniendo presionada la card. */
export function TransactionSheet({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const { data: categorias } = useMoneyCategories();
  const { data: medios } = usePaymentMethods();
  const actualizar = useUpdateTransaction();
  const borrar = useBorrarTransaccion();

  const [texto, setTexto] = useState(transaction.texto ?? "");
  const [monto, setMonto] = useState(String(transaction.monto));
  const [fecha, setFecha] = useState(transaction.fecha);
  const [categoriaId, setCategoriaId] = useState(transaction.categoria_id);
  const [medioId, setMedioId] = useState(transaction.medio_id);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const ocupado = actualizar.isPending || borrar.isPending;
  const error = actualizar.error ?? borrar.error;
  const categoriasDelTipo = categorias?.filter((c) => c.tipo === transaction.tipo);

  function guardar() {
    const montoLimpio = Number(monto);
    if (!montoLimpio || montoLimpio <= 0) return;

    actualizar.mutate(
      {
        id: transaction.id,
        patch: {
          texto: texto.trim() || null,
          monto: montoLimpio,
          fecha,
          categoria_id: categoriaId,
          medio_id: medioId,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">{transaction.tipo === "gasto" ? "GASTO" : "INGRESO"}</p>

      <Input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="¿Qué fue?"
        aria-label="Descripción"
        className="mt-2 h-auto border-none bg-transparent px-0 font-display text-2xl font-bold leading-tight focus:border-none"
      />

      <div className="mt-5 flex gap-2">
        <div className="flex-1">
          <Label htmlFor="mov-monto">Monto</Label>
          <Input
            id="mov-monto"
            type="number"
            inputMode="numeric"
            min={0}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Label htmlFor="mov-fecha">Fecha</Label>
          <Input id="mov-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold">Categoría</p>
      <div className="flex flex-wrap gap-2">
        {categoriasDelTipo?.map((categoria) => {
          const activa = categoria.id === categoriaId;
          return (
            <Button
              key={categoria.id}
              variant={activa ? "choiceActive" : "choice"}
              className="h-11 flex-none px-3"
              onClick={() => setCategoriaId(categoria.id)}
            >
              {categoria.emoji ?? "❔"} {categoria.nombre}
            </Button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold">¿De dónde salió?</p>
      <div className="grid grid-cols-2 gap-2">
        {medios?.map((medio) => {
          const activo = medio.id === medioId;
          return (
            <button
              key={medio.id}
              onClick={() => setMedioId(medio.id)}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold",
                activo ? "border-2 border-primary bg-primary-soft text-primary" : "border border-border bg-card",
              )}
            >
              <span>{tipoEmoji(medio.tipo)}</span>
              <span className="truncate">{medio.nombre}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-xs text-destructive">{error.message}</p>}

      <Button
        variant="default"
        size="lg"
        className="mt-6 w-full"
        onClick={guardar}
        disabled={!monto || Number(monto) <= 0 || ocupado}
      >
        {actualizar.isPending ? "Guardando..." : "Guardar"}
      </Button>

      <div className="mt-3">
        {confirmarBorrado ? (
          <div className="rounded-2xl border border-destructive/40 p-3">
            <p className="text-sm">¿Borrar este movimiento?</p>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmarBorrado(false)}>
                No
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={ocupado}
                onClick={() => borrar.mutate(transaction.id, { onSuccess: onClose })}
              >
                {borrar.isPending ? "Borrando..." : "Sí, borrar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirmarBorrado(true)}>
            <Trash2 /> Borrar movimiento
          </Button>
        )}
      </div>
    </Sheet>
  );
}
