import { describe, expect, it } from "vitest";

import { resolverOpcionFecha, sumarDias, urgenciaPorFecha } from "./urgencia";

// 2026-09-22 es martes.
const HOY = "2026-09-22";

describe("urgenciaPorFecha", () => {
  it("es alta para hoy y mañana", () => {
    expect(urgenciaPorFecha(HOY, HOY)).toBe("alta");
    expect(urgenciaPorFecha("2026-09-23", HOY)).toBe("alta");
  });

  it("es alta para algo ya vencido", () => {
    expect(urgenciaPorFecha("2026-09-19", HOY)).toBe("alta");
  });

  it("es media entre 2 y 4 días", () => {
    expect(urgenciaPorFecha("2026-09-24", HOY)).toBe("media");
    // El ejemplo del blueprint: "entregar el informe de Virrey el viernes".
    expect(urgenciaPorFecha("2026-09-25", HOY)).toBe("media");
    expect(urgenciaPorFecha("2026-09-26", HOY)).toBe("media");
  });

  it("es baja de 5 días en adelante", () => {
    expect(urgenciaPorFecha("2026-09-27", HOY)).toBe("baja");
    expect(urgenciaPorFecha("2026-11-30", HOY)).toBe("baja");
  });
});

describe("sumarDias", () => {
  it("cruza fin de mes", () => {
    expect(sumarDias("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("cruza fin de año", () => {
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("resolverOpcionFecha", () => {
  it("resuelve hoy y mañana", () => {
    expect(resolverOpcionFecha("hoy", HOY)).toBe(HOY);
    expect(resolverOpcionFecha("manana", HOY)).toBe("2026-09-23");
  });

  it("esta semana cae en el domingo que cierra la semana", () => {
    // Martes 22 → domingo 27.
    expect(resolverOpcionFecha("esta_semana", HOY)).toBe("2026-09-27");
  });

  it("próxima semana cae en el domingo siguiente", () => {
    expect(resolverOpcionFecha("proxima_semana", HOY)).toBe("2026-10-04");
  });

  it("en domingo, esta semana es hoy mismo", () => {
    const domingo = "2026-09-27";
    expect(resolverOpcionFecha("esta_semana", domingo)).toBe(domingo);
    expect(resolverOpcionFecha("proxima_semana", domingo)).toBe("2026-10-04");
  });
});
