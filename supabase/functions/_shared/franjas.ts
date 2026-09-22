// Espejo en Deno de src/lib/franjas.ts. Lo usan plan-day y (en la fase 8) las
// notificaciones por franja. Si cambia una regla, cambia en los dos lados.

export type FranjaId = "arranque" | "foco" | "bajon" | "segundo_aire" | "cierre";

export type Franja = {
  id: FranjaId;
  nombre: string;
  energia: "alta" | "media-baja" | "baja";
  desde: number;
  hasta: number;
};

const DEFINICION: Array<{ id: FranjaId; nombre: string; energia: Franja["energia"]; desde: number; hasta: number | null }> = [
  { id: "arranque", nombre: "Arranque", energia: "media-baja", desde: 0, hasta: 3 },
  { id: "foco", nombre: "Foco", energia: "alta", desde: 3, hasta: 7 },
  { id: "bajon", nombre: "Bajón", energia: "baja", desde: 7, hasta: 9 },
  { id: "segundo_aire", nombre: "Segundo aire", energia: "alta", desde: 9, hasta: 14 },
  { id: "cierre", nombre: "Cierre", energia: "baja", desde: 14, hasta: null },
];

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

export function construirFranjas(horaDespertar: string, horaDormir: string): Franja[] {
  const despertar = horaAMinutos(horaDespertar);
  let dormir = horaAMinutos(horaDormir);
  if (dormir <= despertar) dormir += 1440;

  return DEFINICION.map((def) => {
    const desde = despertar + def.desde * 60;
    const hasta = def.hasta === null ? Math.max(dormir, desde + 30) : despertar + def.hasta * 60;
    return { id: def.id, nombre: def.nombre, energia: def.energia, desde, hasta };
  });
}

export function minutosAhoraBogota(ahora = new Date()): number {
  const hhmm = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(ahora);
  return horaAMinutos(hhmm);
}
