export type Urgencia = "alta" | "media" | "baja";

const DIA_MS = 86_400_000;

/**
 * Urgencia por días restantes (blueprint): ≤1 alta, ≤4 media, resto baja.
 * Una fecha ya vencida cuenta como alta.
 *
 * Ojo: esta regla también vive en supabase/functions/classify-capture/index.ts,
 * porque Deno y el bundle del navegador no comparten módulos. Si cambia una,
 * cambia la otra.
 */
export function urgenciaPorFecha(fecha: string, hoy: string): Urgencia {
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / DIA_MS);
  if (dias <= 1) return "alta";
  if (dias <= 4) return "media";
  return "baja";
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(fecha) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Día de la semana con lunes = 0, domingo = 6. */
function diaDeSemanaLunes(fecha: string): number {
  return (new Date(Date.parse(fecha)).getUTCDay() + 6) % 7;
}

export type OpcionFecha = "hoy" | "manana" | "esta_semana" | "proxima_semana";

/**
 * Resuelve las opciones rápidas del sheet "¿Para cuándo necesitas esto listo?".
 * "Esta semana" es el domingo que cierra la semana en curso (semanas de lunes a
 * domingo); "próxima semana", el domingo siguiente.
 */
export function resolverOpcionFecha(opcion: OpcionFecha, hoy: string): string {
  switch (opcion) {
    case "hoy":
      return hoy;
    case "manana":
      return sumarDias(hoy, 1);
    case "esta_semana":
      return sumarDias(hoy, 6 - diaDeSemanaLunes(hoy));
    case "proxima_semana":
      return sumarDias(hoy, 13 - diaDeSemanaLunes(hoy));
  }
}
