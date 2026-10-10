import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "../../../services/api";
import { cancelarPedidoVenta, confirmarPedidoVenta, crearPedidoDesdeCotizacion, listarPedidosVenta } from "./pedidosVenta";

vi.mock("../../../services/api", () => ({ default: vi.fn() }));

describe("servicio de pedidos de venta", () => {
  beforeEach(() => request.mockReset());

  it("consulta pedidos con filtros", async () => {
    await listarPedidosVenta({ estado: "CONFIRMADO", busqueda: "PV-10" });
    expect(request).toHaveBeenCalledWith("/api/v1/pedidos-venta?estado=CONFIRMADO&busqueda=PV-10");
  });

  it("convierte una cotización aceptada en pedido", async () => {
    await crearPedidoDesdeCotizacion(7, { fechaCompromiso: "2026-10-30" });
    expect(request).toHaveBeenCalledWith("/api/v1/pedidos-venta/desde-cotizacion/7", {
      method: "POST", body: JSON.stringify({ fechaCompromiso: "2026-10-30" })
    });
  });

  it("usa acciones explícitas para confirmar y cancelar", async () => {
    await confirmarPedidoVenta(3);
    expect(request).toHaveBeenLastCalledWith("/api/v1/pedidos-venta/3/confirmar", { method: "PATCH" });
    await cancelarPedidoVenta(3);
    expect(request).toHaveBeenLastCalledWith("/api/v1/pedidos-venta/3/cancelar", { method: "PATCH" });
  });
});
