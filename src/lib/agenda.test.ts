import { describe, expect, it } from "vitest";

import { colorDeEvento, ubicarBloques } from "./agenda";

const b = (id: string, inicioMin: number, finMin: number) => ({ id, inicioMin, finMin });

describe("ubicarBloques", () => {
  it("deja solo a los eventos que no se pisan", () => {
    const r = ubicarBloques([b("a", 540, 600), b("b", 660, 720)]);
    expect(r.map((x) => [x.id, x.columna, x.columnas])).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("pone lado a lado dos que se pisan", () => {
    const r = ubicarBloques([b("a", 540, 660), b("b", 600, 720)]);
    expect(r.map((x) => [x.id, x.columna, x.columnas])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("reusa la columna cuando el anterior ya terminó", () => {
    // a: 9–10, b: 9:30–11 (se pisan), c: 10:15–10:45 cabe en la columna de a.
    const r = ubicarBloques([b("a", 540, 600), b("b", 570, 660), b("c", 615, 645)]);
    const porId = Object.fromEntries(r.map((x) => [x.id, x]));
    expect(porId.a.columna).toBe(0);
    expect(porId.b.columna).toBe(1);
    expect(porId.c.columna).toBe(0);
    // Los tres están en el mismo racimo, así que comparten ancho.
    expect(new Set(r.map((x) => x.columnas))).toEqual(new Set([2]));
  });

  it("separa racimos que no se tocan", () => {
    const r = ubicarBloques([b("a", 540, 600), b("b", 550, 610), b("c", 700, 730)]);
    const porId = Object.fromEntries(r.map((x) => [x.id, x]));
    expect(porId.a.columnas).toBe(2);
    expect(porId.b.columnas).toBe(2);
    expect(porId.c.columnas).toBe(1);
  });

  it("maneja tres al mismo tiempo", () => {
    const r = ubicarBloques([b("a", 540, 660), b("b", 545, 665), b("c", 550, 670)]);
    expect(r.map((x) => x.columna)).toEqual([0, 1, 2]);
    expect(r.every((x) => x.columnas === 3)).toBe(true);
  });

  it("no se cae con la lista vacía", () => {
    expect(ubicarBloques([])).toEqual([]);
  });

  it("un evento que toca el final de otro no cuenta como solape", () => {
    const r = ubicarBloques([b("a", 540, 600), b("b", 600, 660)]);
    expect(r.every((x) => x.columnas === 1)).toBe(true);
  });
});

describe("colorDeEvento", () => {
  it("usa la paleta de Google", () => {
    expect(colorDeEvento("11")).toBe("#d50000");
    expect(colorDeEvento("2")).toBe("#33b679");
  });

  it("cae al azul por defecto", () => {
    expect(colorDeEvento(null)).toBe("#039be5");
    expect(colorDeEvento("99")).toBe("#039be5");
  });
});
