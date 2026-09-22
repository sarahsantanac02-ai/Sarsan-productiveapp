export type FranjaId = "arranque" | "foco" | "bajon" | "segundo_aire" | "cierre";
export type Energia = "alta" | "media-baja" | "baja";

export type Franja = {
  id: FranjaId;
  nombre: string;
  energia: Energia;
  /** Minutos desde medianoche. */
  desde: number;
  hasta: number;
  tip: string;
};

/**
 * Franjas del blueprint, en horas desde que Sarah se despierta:
 * Arranque 0–3 (media-baja) · Foco 3–7 (alta) · Bajón 7–9 (baja) ·
 * Segundo aire 9–14 (alta) · Cierre 14–dormir (baja).
 */
const DEFINICION: Array<{ id: FranjaId; nombre: string; energia: Energia; desde: number; hasta: number | null; tip: string }> = [
  {
    id: "arranque",
    nombre: "Arranque",
    energia: "media-baja",
    desde: 0,
    hasta: 3,
    tip: "Cosas suaves: responder, ordenar, planear. No arranques con lo más duro.",
  },
  {
    id: "foco",
    nombre: "Foco",
    energia: "alta",
    desde: 3,
    hasta: 7,
    tip: "Tu mejor momento. Protege este bloque para lo que más cabeza pide.",
  },
  {
    id: "bajon",
    nombre: "Bajón",
    energia: "baja",
    desde: 7,
    hasta: 9,
    tip: "Buen rato para reuniones, trámites y cosas mecánicas.",
  },
  {
    id: "segundo_aire",
    nombre: "Segundo aire",
    energia: "alta",
    desde: 9,
    hasta: 14,
    tip: "Vuelve la energía: retoma lo exigente o cierra lo que dejaste a medias.",
  },
  {
    id: "cierre",
    nombre: "Cierre",
    energia: "baja",
    desde: 14,
    hasta: null,
    tip: "Baja el ritmo: deja listo mañana y cierra tus no negociables.",
  },
];

/** "06:00" o "06:00:00" → minutos desde medianoche. */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const total = ((minutos % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const sufijo = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${sufijo}` : `${h12}:${String(m).padStart(2, "0")}${sufijo}`;
}

/**
 * Construye las cinco franjas del día. `dormir` cierra la última; si queda
 * antes del inicio de Cierre (se acuesta muy temprano), Cierre dura al menos
 * media hora para que nunca quede vacía.
 */
export function construirFranjas(horaDespertar: string, horaDormir: string): Franja[] {
  const despertar = horaAMinutos(horaDespertar);
  let dormir = horaAMinutos(horaDormir);
  if (dormir <= despertar) dormir += 1440; // se acuesta pasada la medianoche

  return DEFINICION.map((def) => {
    const desde = despertar + def.desde * 60;
    const hasta = def.hasta === null ? Math.max(dormir, desde + 30) : despertar + def.hasta * 60;
    return { id: def.id, nombre: def.nombre, energia: def.energia, tip: def.tip, desde, hasta };
  });
}

/** La franja que Sarah está viviendo ahora, o null si ya se durmió o no se ha levantado. */
export function franjaActual(franjas: Franja[], minutosAhora: number): Franja | null {
  const candidatos = [minutosAhora, minutosAhora + 1440];
  for (const minuto of candidatos) {
    const franja = franjas.find((f) => minuto >= f.desde && minuto < f.hasta);
    if (franja) return franja;
  }
  return null;
}

export function minutosAhoraBogota(ahora: Date = new Date()): number {
  const hhmm = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(ahora);
  return horaAMinutos(hhmm);
}

/** Etiqueta corta para la barra de Hoy: "6–9am", "9am–1pm". */
export function rangoCorto(franja: Franja): string {
  return `${minutosAHora(franja.desde)}–${minutosAHora(franja.hasta)}`;
}
