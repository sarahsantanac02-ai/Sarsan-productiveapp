import { describe, expect, it } from "vitest";

import { construirFranjas, franjaActual, horaAMinutos, minutosAHora, rangoCorto } from "./franjas";

describe("construirFranjas con despertar 6am", () => {
  const franjas = construirFranjas("06:00", "22:00");

  // La tabla del blueprint: 6–9am, 9am–1pm, 1–3pm, 3–8pm, 8–10pm.
  it("reproduce los rangos del blueprint", () => {
    expect(franjas.map(rangoCorto)).toEqual(["6am–9am", "9am–1pm", "1pm–3pm", "3pm–8pm", "8pm–10pm"]);
  });

  it("marca la energía de cada franja", () => {
    expect(franjas.map((f) => f.energia)).toEqual(["media-baja", "alta", "baja", "alta", "baja"]);
  });
});

describe("construirFranjas con otros horarios", () => {
  it("se corre entera si se levanta más tarde", () => {
    const franjas = construirFranjas("08:30", "23:30");
    expect(rangoCorto(franjas[0])).toBe("8:30am–11:30am");
    expect(rangoCorto(franjas[1])).toBe("11:30am–3:30pm");
    expect(rangoCorto(franjas[4])).toBe("10:30pm–11:30pm");
  });

  it("maneja dormirse pasada la medianoche", () => {
    const franjas = construirFranjas("07:00", "01:00");
    // Cierre arranca a las 9pm y termina a la 1am del día siguiente.
    expect(franjas[4].desde).toBe(horaAMinutos("21:00"));
    expect(franjas[4].hasta).toBe(horaAMinutos("01:00") + 1440);
  });

  it("nunca deja Cierre vacía aunque se acueste temprano", () => {
    const franjas = construirFranjas("06:00", "19:00");
    expect(franjas[4].hasta).toBeGreaterThan(franjas[4].desde);
  });
});

describe("franjaActual", () => {
  const franjas = construirFranjas("06:00", "22:00");

  it("encuentra la franja que está viviendo", () => {
    expect(franjaActual(franjas, horaAMinutos("07:00"))?.id).toBe("arranque");
    expect(franjaActual(franjas, horaAMinutos("11:30"))?.id).toBe("foco");
    expect(franjaActual(franjas, horaAMinutos("14:00"))?.id).toBe("bajon");
    expect(franjaActual(franjas, horaAMinutos("17:00"))?.id).toBe("segundo_aire");
    expect(franjaActual(franjas, horaAMinutos("21:00"))?.id).toBe("cierre");
  });

  it("es exclusiva en el límite: 9am ya es Foco", () => {
    expect(franjaActual(franjas, horaAMinutos("09:00"))?.id).toBe("foco");
  });

  it("devuelve null de madrugada", () => {
    expect(franjaActual(franjas, horaAMinutos("03:00"))).toBeNull();
  });
});

describe("minutosAHora", () => {
  it("formatea en 12h sin ceros de más", () => {
    expect(minutosAHora(horaAMinutos("00:00"))).toBe("12am");
    expect(minutosAHora(horaAMinutos("09:00"))).toBe("9am");
    expect(minutosAHora(horaAMinutos("12:00"))).toBe("12pm");
    expect(minutosAHora(horaAMinutos("13:30"))).toBe("1:30pm");
  });
});
