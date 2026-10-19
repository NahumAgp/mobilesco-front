import { describe, expect, it } from "vitest";
import { evaluarAlertasCosto } from "./costosAlertas.js";

describe("alertas de costos de insumos", () => {
  const ahora = new Date("2026-10-02T12:00:00");

  it("marca un costo sin fecha y con desviación frente a compras", () => {
    const alertas = evaluarAlertasCosto({ costoCotizacion: 130, ultimoCostoCompra: 100 }, ahora);
    expect(alertas).toHaveLength(2);
    expect(alertas[0]).toContain("sin fecha");
    expect(alertas[1]).toContain("15%");
  });

  it("usa el promedio cuando no hay compra y acepta una revisión reciente", () => {
    const alertas = evaluarAlertasCosto({
      costoCotizacion: 105,
      ultimoCostoCompra: 0,
      costoPromedio: 100,
      fechaCostoCotizacion: "2026-10-01T12:00:00",
    }, ahora);
    expect(alertas).toEqual([]);
  });
});
