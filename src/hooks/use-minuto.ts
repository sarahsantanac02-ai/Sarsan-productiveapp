import { useEffect, useState } from "react";

import { minutosAhoraBogota } from "@/lib/franjas";

/**
 * Minutos desde medianoche en Bogotá, refrescados cada minuto. Así la franja
 * actual se mueve sola mientras Sarah tiene la app abierta, en vez de quedarse
 * congelada en la hora en que cargó.
 */
export function useMinutoBogota(): number {
  const [minutos, setMinutos] = useState(() => minutosAhoraBogota());

  useEffect(() => {
    const id = setInterval(() => setMinutos(minutosAhoraBogota()), 60_000);
    return () => clearInterval(id);
  }, []);

  return minutos;
}
