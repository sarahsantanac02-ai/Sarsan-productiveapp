import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/app-shell";
import { tipoEmoji, usePaymentMethods } from "@/features/finance/use-payment-methods";

export function FinanceScreen() {
  const { data: medios, isLoading, isError } = usePaymentMethods();

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Tu plata, sin enredos" title="Finanzas" />
      <div className="space-y-5 px-4 pt-5">
        <Card>
          <h2 className="font-display font-semibold">Tus medios de pago</h2>
          {isLoading && <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>}
          {isError && <p className="mt-3 text-sm text-destructive">No se pudieron cargar tus medios de pago.</p>}
          {medios && (
            <div className="mt-3 divide-y divide-border">
              {medios.map((medio) => (
                <div key={medio.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-sm">
                    {tipoEmoji(medio.tipo)}
                  </span>
                  <span className="text-sm font-medium">{medio.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Gastos, ingresos y entrada por voz</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Llegan en la Fase 6.</p>
        </Card>
      </div>
    </div>
  );
}
