export type Bloque = { id: string; inicioMin: number; finMin: number };

export type BloqueUbicado = Bloque & { columna: number; columnas: number };

/**
 * Reparte en columnas los eventos que se pisan, como Google Calendar: los que
 * se solapan quedan lado a lado, y los que no, ocupan todo el ancho.
 *
 * Trabaja por racimos: un racimo es una cadena de eventos donde cada uno se
 * pisa con algo del racimo. Todos los de un racimo comparten el mismo número
 * de columnas para que queden alineados.
 */
export function ubicarBloques(bloques: Bloque[]): BloqueUbicado[] {
  const ordenados = [...bloques].sort((a, b) => a.inicioMin - b.inicioMin || a.finMin - b.finMin);
  const ubicados: BloqueUbicado[] = [];

  let racimo: BloqueUbicado[] = [];
  let finDelRacimo = -Infinity;

  const cerrarRacimo = () => {
    const columnas = racimo.reduce((max, b) => Math.max(max, b.columna + 1), 0);
    for (const bloque of racimo) ubicados.push({ ...bloque, columnas });
    racimo = [];
    finDelRacimo = -Infinity;
  };

  for (const bloque of ordenados) {
    if (bloque.inicioMin >= finDelRacimo && racimo.length > 0) cerrarRacimo();

    // La primera columna libre: aquella cuyo último evento ya terminó.
    const finPorColumna: number[] = [];
    for (const puesto of racimo) {
      finPorColumna[puesto.columna] = Math.max(finPorColumna[puesto.columna] ?? -Infinity, puesto.finMin);
    }
    let columna = 0;
    while ((finPorColumna[columna] ?? -Infinity) > bloque.inicioMin) columna++;

    racimo.push({ ...bloque, columna, columnas: 1 });
    finDelRacimo = Math.max(finDelRacimo, bloque.finMin);
  }

  if (racimo.length > 0) cerrarRacimo();

  return ubicados.sort((a, b) => a.inicioMin - b.inicioMin || a.columna - b.columna);
}

/** Colores de Google Calendar por colorId. Sin colorId, el azul por defecto. */
const COLORES_GOOGLE: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f4511e",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d50000",
};

export function colorDeEvento(colorId: string | null): string {
  return (colorId && COLORES_GOOGLE[colorId]) || "#039be5";
}

/** "2026-09-22T09:30:00-05:00" → minutos desde medianoche en Bogotá. */
export function minutosDelDia(iso: string): number {
  const hhmm = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(new Date(iso));
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
