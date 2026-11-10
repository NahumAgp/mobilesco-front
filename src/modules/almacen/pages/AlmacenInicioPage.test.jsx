import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlmacenInicioPage from "./AlmacenInicioPage";
import Tablero from "../../tablero/pages/Tablero";

vi.mock("../../tablero/services/tablero", () => ({
  obtenerResumenTablero: vi.fn(),
  conectarEventosTablero: vi.fn(() => () => {}),
}));

import { obtenerResumenTablero } from "../../tablero/services/tablero";

describe("inicio de almacén", () => {
  afterEach(() => localStorage.removeItem("user"));

  it("solo ofrece módulos permitidos para el usuario", () => {
    localStorage.setItem("user", JSON.stringify({ permisos: ["VIEW_WAREHOUSE_RECEIPTS"] }));
    render(<MemoryRouter><AlmacenInicioPage /></MemoryRouter>);

    const accesos = screen.getByRole("navigation", { name: "Módulos de almacén" });
    expect(within(accesos).getAllByRole("link")).toHaveLength(1);
    expect(within(accesos).getByRole("link", { name: /Entradas/ })).toHaveAttribute("href", "/almacen/entradas");
    expect(within(accesos).queryByRole("link", { name: /Insumos/ })).not.toBeInTheDocument();
  });

  it("muestra widgets de almacén con datos del tablero y rutas operativas", async () => {
    localStorage.setItem("user", JSON.stringify({ roles: ["JEFE_ALMACEN"], permisos: ["VIEW_DASHBOARD", "VIEW_INVENTORY", "VIEW_WAREHOUSE_RECEIPTS", "VIEW_WAREHOUSE_REQUISITIONS", "VIEW_INVENTORY_OUTPUTS"] }));
    obtenerResumenTablero.mockResolvedValue({
      desde: "2026-11-01", hasta: "2026-11-09",
      indicadoresOperativos: { insumosStockBajo: 11, comprasPendientesRecepcion: 2, requisicionesPendientes: 3, salidasPeriodo: 4 },
      indicadoresInventario: { valorTotalInventario: 75376, consumoMensual: 1200, rotacionMensual: 0.02 },
      alertas: [{ tipo: "STOCK_BAJO", titulo: "Insumos con stock bajo", descripcion: "Revisar existencias" }],
    });

    render(<MemoryRouter><AlmacenInicioPage /></MemoryRouter>);

    expect(await screen.findByText("Dashboard de Almacén")).toBeInTheDocument();
    const widgets = await screen.findByLabelText("Indicadores operativos de almacén");
    expect(within(widgets).getByText("11")).toBeInTheDocument();
    expect(within(widgets).getByRole("link", { name: /Compras por recibir/ })).toHaveAttribute("href", "/almacen/entradas");
    expect(within(widgets).getByRole("link", { name: /Requisiciones por atender/ })).toHaveAttribute("href", "/almacen/requisiciones");
    expect(screen.getByText(/75,376/)).toBeInTheDocument();
    await waitFor(() => expect(obtenerResumenTablero).toHaveBeenCalledWith("MES"));
  });

  it("abre el dashboard de Almacén desde el tablero principal para Jefe de Almacén", async () => {
    localStorage.setItem("user", JSON.stringify({ roles: ["JEFE_ALMACEN"], permisos: ["VIEW_DASHBOARD", "VIEW_INVENTORY"] }));
    obtenerResumenTablero.mockResolvedValue({
      desde: "2026-11-01", hasta: "2026-11-09",
      indicadoresOperativos: { insumosStockBajo: 1 },
      indicadoresInventario: { valorTotalInventario: 100, consumoMensual: 0, rotacionMensual: 0 },
      alertas: [],
    });

    render(<MemoryRouter><Tablero /></MemoryRouter>);

    expect(await screen.findByText("Dashboard de Almacén")).toBeInTheDocument();
    expect(screen.queryByText("Tablero principal")).not.toBeInTheDocument();
    expect(await screen.findByText("Stock bajo")).toBeInTheDocument();
  });
});
