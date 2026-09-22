import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

export type Profile = {
  id: string;
  nombre: string | null;
  hora_despertar: string;
  hora_dormir: string;
  edad: number | null;
  estatura_cm: number;
  peso_kg: number;
  actividad: number;
  botella_ml: number;
  botellas_meta: number;
  zona_horaria: string;
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
