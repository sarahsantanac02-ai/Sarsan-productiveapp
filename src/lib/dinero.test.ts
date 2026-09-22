import { describe, expect, it } from "vitest";

import { mesAnterior, mesSiguiente, nombreMes, pesosCorto, rangoMes } from "./dinero";

describe("pesosCorto", () => {
  it("abrevia miles y millones", () => {
    expect(pesosCorto(342_000)).toBe("$342 mil");
    expect(pesosCorto(1_000_000)).toBe("$1 M");
    expect(pesosCorto(1_250_000)).toBe("$1.3 M");
  });

  it("muestra la cifra completa bajo mil", () => {
    expect(pesosCorto(800)).toContain("800");
  });
});

describe("rangoMes", () => {
  it("cubre el mes entero", () => {
    expect(rangoMes("2026-09")).toEqual({ desde: "2026-09-01", hasta: "2026-09-30" });
    expect(rangoMes("2026-02")).toEqual({ desde: "2026-02-01", hasta: "2026-02-28" });
  });

  it("maneja febrero bisiesto", () => {
    expect(rangoMes("2028-02").hasta).toBe("2028-02-29");
  });
});

describe("navegación de meses", () => {
  it("cruza el año", () => {
    expect(mesSiguiente("2026-12")).toBe("2027-01");
    expect(mesAnterior("2026-01")).toBe("2025-12");
  });

  it("avanza y retrocede dentro del año", () => {
    expect(mesSiguiente("2026-09")).toBe("2026-10");
    expect(mesAnterior("2026-09")).toBe("2026-08");
  });
});

describe("nombreMes", () => {
  it("capitaliza el mes", () => {
    expect(nombreMes(`${new Date().getUTCFullYear()}-09`)).toBe("Septiembre");
  });

  it("agrega el año cuando no es el actual", () => {
    expect(nombreMes("2020-03")).toBe("Marzo 2020");
  });
});
