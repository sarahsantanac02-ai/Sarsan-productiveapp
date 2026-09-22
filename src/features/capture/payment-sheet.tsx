import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";
import { tipoEmoji, usePaymentMethods } from "@/features/finance/use-payment-methods";

export function PaymentSheet({
  transactionId,
  monto,
  texto,
  onClose,
}: {
  transactionId: string;
  monto: number;
  texto: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: medios } = usePaymentMethods();
  const queryClient = useQueryClient();

  const asignarMedio = useMutation({
    mutationFn: async (medioId: string) => {
      const { error } = await supabase.from("transactions").update({ medio_id: medioId }).eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      onClose();
    },
  });

  const montoFormateado = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monto);

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">UN PASO MÁS</p>
      <h2 className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">¿Con qué pagaste?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {texto} · {montoFormateado}
      </p>

      <div className="my-5 grid grid-cols-2 gap-2">
        {medios?.map((medio) => (
          <Button
            key={medio.id}
            variant="choice"
            onClick={() => asignarMedio.mutate(medio.id)}
            disabled={asignarMedio.isPending}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-base">{tipoEmoji(medio.tipo)}</span>
              <span className="text-xs leading-tight">{medio.nombre}</span>
            </span>
          </Button>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Después le digo
      </Button>
    </Sheet>
  );
}
