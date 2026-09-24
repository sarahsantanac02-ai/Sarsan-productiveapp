import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { todayBogota } from "@/lib/date";
import { inicioSemana, sumarDias } from "@/lib/urgencia";
import { useAuth } from "@/features/auth/use-auth";
import type { Item } from "@/features/capture/use-items";

/** America/Bogota no tiene horario de verano: el offset es fijo. */
const BOGOTA_OFFSET = "-05:00";
const TIPOS_PENDIENTE = ["tarea", "evento", "seguimiento", "idea"];

/** Lo marcado hecho esta semana (lunes a domingo). Se ve en la pestaña "Realizadas". */
export function useItemsRealizadosSemana() {
  const { user } = useAuth();
  const desde = inicioSemana(todayBogota());
  const hasta = sumarDias(desde, 7);

  return useQuery({
    queryKey: ["items_realizados_semana", user?.id, desde],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user!.id)
        .eq("done", true)
        .in("tipo", TIPOS_PENDIENTE)
        .gte("completado_en", `${desde}T00:00:00${BOGOTA_OFFSET}`)
        .lt("completado_en", `${hasta}T00:00:00${BOGOTA_OFFSET}`)
        .order("completado_en", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });
}

/** Lo marcado hecho antes de esta semana: el archivo completo, para Ajustes. */
export function useHistorial() {
  const { user } = useAuth();
  const desde = inicioSemana(todayBogota());

  return useQuery({
    queryKey: ["items_historial", user?.id, desde],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user!.id)
        .eq("done", true)
        .in("tipo", TIPOS_PENDIENTE)
        .lt("completado_en", `${desde}T00:00:00${BOGOTA_OFFSET}`)
        .order("completado_en", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });
}

const MES_FORMATO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
});

/** "2026-09" en hora Bogotá, para agrupar y para pasarle a `nombreMes`. */
function mesDe(completadoEn: string): string {
  const partes = MES_FORMATO.formatToParts(new Date(completadoEn));
  const anio = partes.find((p) => p.type === "year")!.value;
  const mes = partes.find((p) => p.type === "month")!.value;
  return `${anio}-${mes}`;
}

/** Agrupa por mes, más reciente primero (los items ya vienen ordenados por completado_en). */
export function agruparPorMes(items: Item[]): Array<[string, Item[]]> {
  const acc = new Map<string, Item[]>();
  for (const item of items) {
    if (!item.completado_en) continue;
    const mes = mesDe(item.completado_en);
    acc.set(mes, [...(acc.get(mes) ?? []), item]);
  }
  return [...acc.entries()];
}
