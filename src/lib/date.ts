// Fecha de "hoy" para Sarah, siempre en America/Bogota (blueprint: zona horaria fija).
export function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}
