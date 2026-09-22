import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Mic, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { etiquetaFecha, todayBogota } from "@/lib/date";
import { mesAnterior, mesDeHoy, mesSiguiente, nombreMes, pesos, pesosCorto } from "@/lib/dinero";
import { tipoEmoji, usePaymentMethods } from "@/features/finance/use-payment-methods";
import { useMoneyCategories, useTransactions, type TipoMovimiento } from "@/features/finance/use-transactions";
import { useCapture } from "@/features/capture/use-items";
import { useCaptureSheets } from "@/features/capture/capture-provider";

export function FinanceScreen() {
  const hoy = todayBogota();
  const [mes, setMes] = useState(() => mesDeHoy(hoy));
  const [tipo, setTipo] = useState<TipoMovimiento>("gasto");
  const [rapido, setRapido] = useState("");

  const { data: medios } = usePaymentMethods();
  const { data: categorias } = useMoneyCategories();
  const { data: movimientos, isLoading } = useTransactions(mes);
  const capture = useCapture();
  const { abrirVoz } = useCaptureSheets();

  const delTipo = useMemo(
    () => (movimientos ?? []).filter((m) => m.tipo === tipo),
    [movimientos, tipo],
  );

  const total = delTipo.reduce((suma, m) => suma + m.monto, 0);

  const porCategoria = useMemo(() => {
    const acc = new Map<string, number>();
    for (const m of delTipo) acc.set(m.categoria_id ?? "sin", (acc.get(m.categoria_id ?? "sin") ?? 0) + m.monto);
    return [...acc.entries()].sort((a, b) => b[1] - a[1]);
  }, [delTipo]);

  const porMedio = useMemo(() => {
    const acc = new Map<string, number>();
    for (const m of delTipo) acc.set(m.medio_id ?? "sin", (acc.get(m.medio_id ?? "sin") ?? 0) + m.monto);
    return [...acc.entries()].sort((a, b) => b[1] - a[1]);
  }, [delTipo]);

  const aCredito = useMemo(() => {
    const creditos = new Set((medios ?? []).filter((m) => m.tipo === "credito").map((m) => m.id));
    return delTipo.filter((m) => m.medio_id && creditos.has(m.medio_id)).reduce((s, m) => s + m.monto, 0);
  }, [delTipo, medios]);

  const porDia = useMemo(() => {
    const acc = new Map<string, typeof delTipo>();
    for (const m of delTipo) acc.set(m.fecha, [...(acc.get(m.fecha) ?? []), m]);
    return [...acc.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [delTipo]);

  const maximoCategoria = porCategoria[0]?.[1] ?? 1;

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Tu plata, sin enredos" title="Finanzas" />

      <div className="space-y-5 px-4 pt-5">
        <div className="flex rounded-xl bg-muted p-1">
          {(["gasto", "ingreso"] as const).map((t) => (
            <Button
              key={t}
              variant={tipo === t ? "segmentActive" : "segment"}
              size="sm"
              onClick={() => setTipo(t)}
              className="capitalize"
            >
              {t === "gasto" ? "Gastos" : "Ingresos"}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="iconSm" onClick={() => setMes(mesAnterior(mes))} aria-label="Mes anterior">
            <ArrowLeft />
          </Button>
          <span className="text-sm font-semibold">{nombreMes(mes)}</span>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setMes(mesSiguiente(mes))}
            disabled={mes >= mesDeHoy(hoy)}
            aria-label="Mes siguiente"
          >
            <ArrowRight />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">{tipo === "gasto" ? "Has gastado" : "Has recibido"}</p>
          <p className="mt-1 font-display text-[38px] font-bold leading-none">{pesos(total)}</p>
        </div>

        <div className="flex items-center rounded-2xl border border-border bg-card p-2 pl-4">
          <input
            value={rapido}
            onChange={(e) => setRapido(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && rapido.trim()) {
                capture.mutate(rapido.trim());
                setRapido("");
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Ej: almuerzo 18 mil con Nequi"
          />
          {rapido.trim() ? (
            <Button
              variant="default"
              size="icon"
              onClick={() => {
                capture.mutate(rapido.trim());
                setRapido("");
              }}
              disabled={capture.isPending}
              aria-label="Guardar movimiento"
            >
              <Sparkles />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={abrirVoz} aria-label="Dictar movimiento">
              <Mic />
            </Button>
          )}
        </div>
        {capture.isPending && <p className="-mt-3 text-center text-xs text-muted-foreground">Ordenando...</p>}

        {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

        {!isLoading && delTipo.length === 0 && (
          <div className="py-10 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">
              Sin {tipo === "gasto" ? "gastos" : "ingresos"} en {nombreMes(mes).toLowerCase()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Dicta uno arriba y yo lo clasifico.</p>
          </div>
        )}

        {delTipo.length > 0 && (
          <>
            <Card className="space-y-4">
              <h2 className="font-display font-semibold">Por categoría</h2>
              {porCategoria.map(([id, monto]) => {
                const categoria = categorias?.find((c) => c.id === id);
                return (
                  <div key={id}>
                    <div className="mb-1.5 flex text-xs">
                      <span>
                        {categoria?.emoji ?? "❔"} {categoria?.nombre ?? "Sin categoría"}
                      </span>
                      <span className="ml-auto font-semibold">{pesos(monto)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (monto / maximoCategoria) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display font-semibold">Por dónde salió</h2>
                {aCredito > 0 && (
                  <span className="rounded-full bg-amber-soft px-2 py-1 text-[10px] font-semibold text-amber-strong">
                    {pesosCorto(aCredito)} a crédito
                  </span>
                )}
              </div>
              <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4">
                {porMedio.map(([id, monto]) => {
                  const medio = medios?.find((m) => m.id === id);
                  return (
                    <article key={id} className="min-w-36 rounded-2xl border border-border bg-card p-4">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-sm">
                        {medio ? tipoEmoji(medio.tipo) : "❔"}
                      </span>
                      <p className="mt-4 text-xs text-muted-foreground">{medio?.nombre ?? "Sin medio"}</p>
                      <p className="mt-1 font-display font-semibold">{pesos(monto)}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-display font-semibold">Movimientos</h2>
              <div className="space-y-3">
                {porDia.map(([fecha, delDia]) => {
                  const subtotal = delDia.reduce((s, m) => s + m.monto, 0);
                  return (
                    <Card key={fecha}>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {etiquetaFecha(fecha, hoy)}
                        </p>
                        <p className="text-xs font-semibold">{pesos(subtotal)}</p>
                      </div>
                      {delDia.map((m) => {
                        const categoria = categorias?.find((c) => c.id === m.categoria_id);
                        const medio = medios?.find((x) => x.id === m.medio_id);
                        return (
                          <div key={m.id} className="flex items-center gap-3 border-t border-border py-3 first:border-0">
                            <span className="text-xl">{categoria?.emoji ?? "❔"}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{m.texto ?? categoria?.nombre ?? "Movimiento"}</p>
                              <p className="text-[10px] text-muted-foreground">{medio?.nombre ?? "Sin medio de pago"}</p>
                            </div>
                            <span className={cn("text-sm font-semibold", tipo === "ingreso" && "text-success")}>
                              {tipo === "gasto" ? "−" : "+"}
                              {pesos(m.monto)}
                            </span>
                          </div>
                        );
                      })}
                    </Card>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
