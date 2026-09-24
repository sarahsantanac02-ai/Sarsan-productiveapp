import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { rangoMes } from "@/lib/dinero";
import { useAuth } from "@/features/auth/use-auth";

export type TipoMovimiento = "gasto" | "ingreso";

export type Transaction = {
  id: string;
  tipo: TipoMovimiento;
  monto: number;
  categoria_id: string | null;
  medio_id: string | null;
  fecha: string;
  texto: string | null;
};

export type MoneyCategory = { id: string; tipo: TipoMovimiento; nombre: string; emoji: string | null };

export function useMoneyCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["money_categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("money_categories")
        .select("id, tipo, nombre, emoji")
        .eq("user_id", user!.id)
        .order("nombre");
      if (error) throw error;
      return data as MoneyCategory[];
    },
  });
}

export function useTransactions(mes: string) {
  const { user } = useAuth();
  const { desde, hasta } = rangoMes(mes);

  return useQuery({
    queryKey: ["transactions", user?.id, mes],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, tipo, monto, categoria_id, medio_id, fecha, texto")
        .eq("user_id", user!.id)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]).map((t) => ({ ...t, monto: Number(t.monto) }));
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Transaction> }) => {
      const { error } = await supabase.from("transactions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
    },
  });
}

export function useBorrarTransaccion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
    },
  });
}
