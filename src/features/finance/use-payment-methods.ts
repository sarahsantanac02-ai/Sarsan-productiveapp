import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

export type PaymentMethod = {
  id: string;
  nombre: string;
  tipo: "efectivo" | "debito" | "credito" | "transferencia";
  orden: number;
};

const TIPO_EMOJI: Record<PaymentMethod["tipo"], string> = {
  efectivo: "💵",
  debito: "💳",
  credito: "🏧",
  transferencia: "🔁",
};

export function tipoEmoji(tipo: PaymentMethod["tipo"]) {
  return TIPO_EMOJI[tipo];
}

export function usePaymentMethods() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment_methods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user!.id)
        .order("orden", { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}
