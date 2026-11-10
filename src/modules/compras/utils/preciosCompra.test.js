import { describe, expect, it } from "vitest";
import { detectarCambiosPrecio } from "./preciosCompra";

describe("comparación de precios de compra", () => {
  it("evita la alerta cuando el precio por unidad de consumo no cambia", () => {
    const detalles = [{ insumoId: 8, insumoNombre: "Tela", precioUnitario: 80, factorConversion: 2 }];
    const anteriores = { 8: { precioUnitario: 40, factorConversion: 1 } };
    expect(detectarCambiosPrecio(detalles, anteriores)).toEqual([]);
  });

  it("identifica un cambio real y omite insumos sin compras previas", () => {
    const detalles = [
      { insumoId: 8, insumoNombre: "Tela", precioUnitario: 42, factorConversion: 1 },
      { insumoId: 9, insumoNombre: "Madera", precioUnitario: 10, factorConversion: 1 },
    ];
    const anteriores = { 8: { precioUnitario: 40, factorConversion: 1, unidadCompraSimbolo: "m" } };
    expect(detectarCambiosPrecio(detalles, anteriores)).toEqual([expect.objectContaining({
      insumoNombre: "Tela", precioAnterior: 40, precioNuevo: 42,
    })]);
  });
});
