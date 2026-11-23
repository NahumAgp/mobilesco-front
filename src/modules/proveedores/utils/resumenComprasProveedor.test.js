import { describe, expect, it } from "vitest";
import { resumirComprasProveedor } from "./resumenComprasProveedor.js";

describe("resumirComprasProveedor", () => {
  it("ordena el historial, agrupa por mes y excluye canceladas del importe", () => {
    const resumen = resumirComprasProveedor([
      { id: 1, fechaCompra: "2026-09-04", total: 100, estado: "RECIBIDA" },
      { id: 2, fechaCompra: "2026-11-02", total: 50, estado: "PENDIENTE" },
      { id: 3, fechaCompra: "2026-11-10", total: 900, estado: "CANCELADA" },
    ]);

    expect(resumen.ordenadas.map((compra) => compra.id)).toEqual([3, 2, 1]);
    expect(resumen.monto).toBe(150);
    expect(resumen.promedio).toBe(75);
    expect(resumen.meses.find((mes) => mes.clave === "2026-11")?.monto).toBe(50);
    expect(resumen.estados.map((estado) => estado.cantidad)).toEqual([1, 1, 1]);
  });

  it("muestra seis meses vacíos cuando no hay compras", () => {
    const resumen = resumirComprasProveedor([], new Date(2026, 10, 20));
    expect(resumen.cantidad).toBe(0);
    expect(resumen.meses).toHaveLength(6);
    expect(resumen.meses.at(-1).clave).toBe("2026-11");
    expect(resumen.meses.every((mes) => mes.monto === 0)).toBe(true);
  });
});
