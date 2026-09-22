const FORMATO = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function pesos(monto: number): string {
  return FORMATO.format(monto);
}

/** "$342 mil" para los avisos cortos; cae a la cifra completa bajo 1.000. */
export function pesosCorto(monto: number): string {
  if (monto >= 1_000_000) {
    const millones = monto / 1_000_000;
    return `$${millones % 1 === 0 ? millones : millones.toFixed(1)} M`;
  }
  if (monto >= 1_000) return `$${Math.round(monto / 1_000)} mil`;
  return pesos(monto);
}

/** Primer y último día del mes, en YYYY-MM-DD. */
export function rangoMes(ancla: string): { desde: string; hasta: string } {
  const [anio, mes] = ancla.split("-").map(Number);
  const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { desde, hasta: `${anio}-${String(mes).padStart(2, "0")}-${ultimoDia}` };
}

export function mesSiguiente(ancla: string): string {
  const [anio, mes] = ancla.split("-").map(Number);
  return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, "0")}`;
}

export function mesAnterior(ancla: string): string {
  const [anio, mes] = ancla.split("-").map(Number);
  return mes === 1 ? `${anio - 1}-12` : `${anio}-${String(mes - 1).padStart(2, "0")}`;
}

export function nombreMes(ancla: string): string {
  const [anio, mes] = ancla.split("-").map(Number);
  const nombre = new Intl.DateTimeFormat("es-CO", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(anio, mes - 1, 1)),
  );
  const conMayuscula = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  const anioActual = new Date().getUTCFullYear();
  return anio === anioActual ? conMayuscula : `${conMayuscula} ${anio}`;
}

export function mesDeHoy(hoy: string): string {
  return hoy.slice(0, 7);
}
