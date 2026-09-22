import { horaAMinutos, minutosAHora } from "@/lib/franjas";

/** Los cuatro factores de actividad que guarda el perfil. */
export const FACTORES_ACTIVIDAD = [
  { valor: 1.2, etiqueta: "Casi siempre sentada" },
  { valor: 1.375, etiqueta: "Me muevo un poco" },
  { valor: 1.55, etiqueta: "Activa varios días" },
  { valor: 1.725, etiqueta: "Muy activa" },
] as const;

/**
 * Meta de energía diaria con Mifflin-St Jeor para mujer, por factor de
 * actividad (blueprint). Es una estimación de cuánta energía gasta el cuerpo,
 * no una meta de dieta: ver TEXTO_ESTIMACION.
 */
export function metaEnergia({
  pesoKg,
  estaturaCm,
  edad,
  actividad,
}: {
  pesoKg: number;
  estaturaCm: number;
  edad: number;
  actividad: number;
}): number {
  const basal = 10 * pesoKg + 6.25 * estaturaCm - 5 * edad - 161;
  return Math.round(basal * actividad);
}

export const TEXTO_ESTIMACION =
  "Es una estimación con 15–30% de error, enfocada en energía, no en dieta.";

/** Tope diario de cafeína que usa la barra (blueprint). */
export const TOPE_CAFEINA_MG = 400;

/** Hora de corte de cafeína: seis horas antes de dormir. */
export function horaCorteCafeina(horaDormir: string): string {
  const corte = horaAMinutos(horaDormir) - 6 * 60;
  return minutosAHora(((corte % 1440) + 1440) % 1440);
}

export function minutosCorteCafeina(horaDormir: string): number {
  const corte = horaAMinutos(horaDormir) - 6 * 60;
  return ((corte % 1440) + 1440) % 1440;
}

/**
 * Duración de cada ciclo, en días, a partir de las fechas de inicio.
 * Devuelve n-1 duraciones para n inicios, de la más vieja a la más nueva.
 */
export function duracionesCiclo(inicios: string[]): number[] {
  const ordenados = [...inicios].sort();
  const duraciones: number[] = [];
  for (let i = 1; i < ordenados.length; i++) {
    const dias = Math.round((Date.parse(ordenados[i]) - Date.parse(ordenados[i - 1])) / 86_400_000);
    duraciones.push(dias);
  }
  return duraciones;
}

export function promedioCiclo(duraciones: number[]): number | null {
  if (duraciones.length === 0) return null;
  return Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length);
}

/** Racha de días seguidos, contando hacia atrás desde hoy (o ayer si hoy no está). */
export function racha(dias: string[], hoy: string): number {
  const marcados = new Set(dias);
  const DIA = 86_400_000;
  const hoyMs = Date.parse(hoy);

  // Si todavía no marca hoy, la racha viva es la que terminó ayer.
  let cursor = marcados.has(hoy) ? hoyMs : hoyMs - DIA;
  let total = 0;

  while (marcados.has(new Date(cursor).toISOString().slice(0, 10))) {
    total++;
    cursor -= DIA;
  }
  return total;
}
