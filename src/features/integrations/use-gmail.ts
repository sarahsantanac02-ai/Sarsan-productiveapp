import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

export type HiloGmail = {
  id: string;
  asunto: string;
  de: string;
  fecha: string;
  resumen: string;
  link: string;
  mensajes: number;
};

type Respuesta = { hilos?: HiloGmail[]; error?: string; reconectar?: boolean };

/** Hilos de Gmail que mencionan SunAce, SAPQ o sunacepq (blueprint). */
export function useHilosSapq(activo: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gmail-sapq", user?.id],
    enabled: !!user && activo,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<Respuesta>("gmail-sapq", { body: {} });
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error) as Error & { reconectar?: boolean };
        err.reconectar = data.reconectar;
        throw err;
      }
      return data?.hilos ?? [];
    },
  });
}

/** "Sarah Santana <sarah@..>" → "Sarah Santana" */
export function nombreDelRemitente(de: string): string {
  const conNombre = de.match(/^\s*"?([^"<]+?)"?\s*</);
  return (conNombre?.[1] ?? de.replace(/[<>]/g, "")).trim();
}
