import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "../../../services/api";
import { cambiarOperacionProduccion, convertirCotizacion, crearOrdenProduccion, registrarAvanceProduccion, surtirOrdenProduccion } from "./ordenesProduccion";

vi.mock("../../../services/api", () => ({ default: vi.fn() }));

describe("servicio de órdenes de producción", () => {
  beforeEach(() => request.mockReset());

  it("crea una orden manual con sus partidas", async () => {
    request.mockResolvedValue({ id: 1 });
    const payload = { partidas: [{ productoId: 8, cantidad: 2 }] };
    await crearOrdenProduccion(payload);
    expect(request).toHaveBeenCalledWith("/api/v1/ordenes-produccion", { method: "POST", body: JSON.stringify(payload) });
  });

  it("convierte una cotización aceptada", async () => {
    request.mockResolvedValue({ id: 4 });
    await convertirCotizacion(12, {});
    expect(request).toHaveBeenCalledWith("/api/v1/ordenes-produccion/desde-cotizacion/12", { method: "POST", body: "{}" });
  });

  it("envía surtidos, operaciones y avances a rutas específicas", async () => {
    request.mockResolvedValue({ id: 3 });
    await surtirOrdenProduccion(3, { insumos: [{ insumoId: 2, cantidad: 1 }] });
    await cambiarOperacionProduccion(3, 9, "EN_PROCESO");
    await registrarAvanceProduccion(3, 6, { cantidad: 1 });
    expect(request.mock.calls.map(call => call[0])).toEqual([
      "/api/v1/ordenes-produccion/3/surtidos",
      "/api/v1/ordenes-produccion/3/operaciones/9",
      "/api/v1/ordenes-produccion/3/partidas/6/avances",
    ]);
  });
});
