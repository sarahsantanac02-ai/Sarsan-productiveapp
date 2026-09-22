import { describe, expect, it } from "vitest";

import { duracionesCiclo, horaCorteCafeina, metaEnergia, promedioCiclo, racha } from "./salud";

describe("metaEnergia (Mifflin-St Jeor, mujer)", () => {
  // Los valores por defecto de Sarah: 51 kg, 147 cm, 24 años.
  // 10·51 + 6.25·147 − 5·24 − 161 = 510 + 918.75 − 120 − 161 = 1147.75
  const sarah = { pesoKg: 51, estaturaCm: 147, edad: 24 };

  it("aplica el factor de actividad", () => {
    expect(metaEnergia({ ...sarah, actividad: 1.2 })).toBe(1377);
    expect(metaEnergia({ ...sarah, actividad: 1.375 })).toBe(1578);
    expect(metaEnergia({ ...sarah, actividad: 1.55 })).toBe(1779);
    expect(metaEnergia({ ...sarah, actividad: 1.725 })).toBe(1980);
  });

  it("sube con el peso y baja con la edad", () => {
    const base = metaEnergia({ ...sarah, actividad: 1.375 });
    expect(metaEnergia({ ...sarah, pesoKg: 56, actividad: 1.375 })).toBeGreaterThan(base);
    expect(metaEnergia({ ...sarah, edad: 40, actividad: 1.375 })).toBeLessThan(base);
  });
});

describe("horaCorteCafeina", () => {
  it("son seis horas antes de dormir", () => {
    expect(horaCorteCafeina("22:00")).toBe("4pm");
    expect(horaCorteCafeina("23:30")).toBe("5:30pm");
  });

  it("cruza la medianoche hacia atrás", () => {
    expect(horaCorteCafeina("01:00")).toBe("7pm");
  });
});

describe("ciclo", () => {
  const inicios = ["2026-05-01", "2026-05-27", "2026-06-26", "2026-07-24"];

  it("calcula la duración entre inicios", () => {
    expect(duracionesCiclo(inicios)).toEqual([26, 30, 28]);
  });

  it("ordena aunque lleguen desordenados", () => {
    expect(duracionesCiclo(["2026-06-26", "2026-05-01", "2026-05-27"])).toEqual([26, 30]);
  });

  it("promedia", () => {
    expect(promedioCiclo([26, 30, 28])).toBe(28);
    expect(promedioCiclo([])).toBeNull();
  });

  it("con un solo inicio no hay duración todavía", () => {
    expect(duracionesCiclo(["2026-05-01"])).toEqual([]);
  });
});

describe("racha", () => {
  const hoy = "2026-09-22";

  it("cuenta los días seguidos terminando hoy", () => {
    expect(racha(["2026-09-22", "2026-09-21", "2026-09-20"], hoy)).toBe(3);
  });

  it("sigue viva si marcó ayer pero hoy todavía no", () => {
    expect(racha(["2026-09-21", "2026-09-20"], hoy)).toBe(2);
  });

  it("se rompe con un hueco", () => {
    expect(racha(["2026-09-22", "2026-09-20", "2026-09-19"], hoy)).toBe(1);
  });

  it("es cero sin registros", () => {
    expect(racha([], hoy)).toBe(0);
  });
});
