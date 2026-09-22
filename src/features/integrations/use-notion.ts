import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/use-auth";

const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID as string | undefined;

export function rutaCallbackNotion(): string {
  return `${window.location.origin}/notion-callback`;
}

export function puedeConectarNotion(): boolean {
  return Boolean(NOTION_CLIENT_ID);
}

export function urlDeAutorizacionNotion(): string {
  const params = new URLSearchParams({
    client_id: NOTION_CLIENT_ID!,
    response_type: "code",
    owner: "user",
    redirect_uri: rutaCallbackNotion(),
  });
  return `https://api.notion.com/v1/oauth/authorize?${params}`;
}

type Respuesta = { error?: string; reconectar?: boolean; url?: string | null };

async function llamar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<Respuesta>("notion-sync", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useConectarNotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => llamar({ accion: "conectar", code, redirect_uri: rutaCallbackNotion() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["integraciones"] });
    },
  });
}

export function useEnviarANotion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => llamar({ accion: "crear", item_id: itemId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}

/** Mantiene la casilla "Hecha" de Notion al día cuando Sarah marca la tarea acá. */
export function useSincronizarNotion() {
  return useMutation({
    mutationFn: ({ notionPageId, hecha }: { notionPageId: string; hecha: boolean }) =>
      llamar({ accion: "marcar", notion_page_id: notionPageId, hecha }),
  });
}
