import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

export type Tag = {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  emoji: string | null;
  logo_path: string | null;
  orden: number;
  es_default: boolean;
};

export function useTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tags", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user!.id)
        .order("orden", { ascending: true });
      if (error) throw error;
      return data as Tag[];
    },
  });
}
