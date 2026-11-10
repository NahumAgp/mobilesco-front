import { describe, expect, it } from "vitest";
import { agruparMovimientosPorVisita } from "./historialRecepciones.js";

describe("historial de recepciones", () => {
  it("agrupa materiales de una visita y separa visitas hechas en el mismo minuto", () => {
    const fecha = "2026-11-09T10:30:15";
    const visitas = agruparMovimientosPorVisita([
      { id: 1, fecha, recepcionId: "primera", recibidoPor: "Ana" },
      { id: 2, fecha, recepcionId: "primera", recibidoPor: "Ana" },
      { id: 3, fecha, recepcionId: "segunda", recibidoPor: "Luis" }
    ]);

    expect(visitas).toHaveLength(2);
    expect(visitas.find((visita) => visita.llave === "primera").movimientos).toHaveLength(2);
    expect(visitas.find((visita) => visita.llave === "segunda").movimientos[0].recibidoPor).toBe("Luis");
  });
});
