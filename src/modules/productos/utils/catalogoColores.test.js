import { describe, expect, it } from "vitest";
import { getColorHex, listarColoresModelo } from "./catalogoColores";

describe("colores del modelo", () => {
  it("usa el color real y no repite variantes del mismo color", () => {
    const colores = listarColoresModelo([
      { id: 1, colorId: 8, colorNombre: "Azul", colorHex: "#123ABC" },
      { id: 2, colorId: 8, colorNombre: "Azul", colorHex: "#123ABC" },
      { id: 3, colorId: 9, colorNombre: "Blanco" },
    ]);
    expect(colores).toHaveLength(2);
    expect(colores[0]).toMatchObject({ nombre: "Azul", hex: "#123abc", productoId: 1 });
    expect(getColorHex({ colorNombre: "Blanco" })).toBe("#f8fafc");
  });
});
