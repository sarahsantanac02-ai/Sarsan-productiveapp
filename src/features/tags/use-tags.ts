import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { reducirLogo } from "@/lib/imagen";
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

/**
 * General es el cajón de lo que la IA no sabe dónde poner: classify-capture la
 * busca por nombre, así que no se puede borrar ni renombrar (blueprint).
 */
export const TAG_GENERAL = "General";

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

const FIRMA_SEGUNDOS = 60 * 60;

/**
 * El bucket `logos` es privado: cada logo se ve con una URL firmada. Se piden
 * todas de una vez y se renuevan antes de que venzan.
 */
export function useTagLogos() {
  const { data: tags } = useTags();
  const paths = (tags ?? []).map((t) => t.logo_path).filter((p): p is string => !!p);

  return useQuery({
    queryKey: ["tag-logos", paths],
    enabled: paths.length > 0,
    staleTime: (FIRMA_SEGUNDOS - 10 * 60) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("logos").createSignedUrls(paths, FIRMA_SEGUNDOS);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const firmada of data) {
        if (firmada.path && firmada.signedUrl) urls[firmada.path] = firmada.signedUrl;
      }
      return urls;
    },
  });
}

export type DatosTag = {
  nombre: string;
  descripcion: string | null;
  color: string;
  emoji: string | null;
};

/** `logo`: un archivo nuevo, "quitar" para volver al emoji, o undefined para no tocarlo. */
export type CambioLogo = File | "quitar" | undefined;

function mensajeDeError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Ya tienes una etiqueta con ese nombre.";
  return error.message;
}

export function useGuardarTag() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tag, datos, logo }: { tag: Tag | null; datos: DatosTag; logo: CambioLogo }) => {
      let tagId = tag?.id;

      if (tag) {
        const { error } = await supabase.from("tags").update(datos).eq("id", tag.id);
        if (error) throw new Error(mensajeDeError(error));
      } else {
        const tags = queryClient.getQueryData<Tag[]>(["tags", user?.id]) ?? [];
        const orden = Math.max(-1, ...tags.map((t) => t.orden)) + 1;
        const { data, error } = await supabase
          .from("tags")
          .insert({ ...datos, user_id: user!.id, orden, es_default: false })
          .select("id")
          .single();
        if (error) throw new Error(mensajeDeError(error));
        tagId = data.id as string;
      }

      if (logo === undefined) return;

      let logoPath: string | null = null;
      if (logo instanceof File) {
        logoPath = `${user!.id}/${tagId}-${Date.now()}.png`;
        const reducido = await reducirLogo(logo);
        const { error } = await supabase.storage.from("logos").upload(logoPath, reducido, { contentType: "image/png" });
        if (error) throw new Error(`La etiqueta quedó guardada, pero el logo no subió: ${error.message}`);
      }

      const { error } = await supabase.from("tags").update({ logo_path: logoPath }).eq("id", tagId!);
      if (error) throw new Error(mensajeDeError(error));

      // El logo viejo ya no lo usa nadie. Si no se puede borrar no pasa nada.
      if (tag?.logo_path) await supabase.storage.from("logos").remove([tag.logo_path]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags", user?.id] });
    },
  });
}

/** Blueprint: al borrar una etiqueta, sus pendientes pasan a General. */
export function useBorrarTag() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: Tag) => {
      if (tag.nombre === TAG_GENERAL) throw new Error("General no se puede borrar.");

      const tags = queryClient.getQueryData<Tag[]>(["tags", user?.id]) ?? [];
      const general = tags.find((t) => t.nombre === TAG_GENERAL);

      if (general) {
        const { error } = await supabase.from("items").update({ tag_id: general.id }).eq("tag_id", tag.id);
        if (error) throw new Error(`No pude pasar sus pendientes a General: ${error.message}`);
      }

      const { error } = await supabase.from("tags").delete().eq("id", tag.id);
      if (error) throw error;

      if (tag.logo_path) await supabase.storage.from("logos").remove([tag.logo_path]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}
