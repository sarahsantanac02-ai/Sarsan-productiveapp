// Fecha de "hoy" para Sarah, siempre en America/Bogota (blueprint: zona horaria fija).
export function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/** "Hoy", "Mañana", "Ayer" o "25 sep" — como se lee en los chips de las cards. */
export function etiquetaFecha(fecha: string, hoy: string): string {
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.parse(fecha)),
  );
}

export function etiquetaHora(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${sufijo}` : `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}
