import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarCotizaciones, eliminarCotizacion, cambiarEstadoCotizacion, asociarClienteParaPedido, crearPedidoDesdeCotizacion } = vi.hoisted(() => ({
  listarCotizaciones: vi.fn(), eliminarCotizacion: vi.fn(), cambiarEstadoCotizacion: vi.fn(),
  asociarClienteParaPedido: vi.fn(), crearPedidoDesdeCotizacion: vi.fn(),
}));
vi.mock("../services/cotizaciones", () => ({
  listarCotizaciones, eliminarCotizacion, cambiarEstadoCotizacion,
  obtenerCotizacion: vi.fn(), asociarClienteParaPedido, exportarExcelCotizaciones: vi.fn(),
}));
vi.mock("../../auth/services/authService", () => ({ getUser: () => ({}), hasPermission: () => true }));
vi.mock("../../pedidos-venta/services/pedidosVenta", () => ({ crearPedidoDesdeCotizacion }));
vi.mock("../utils/cotizacionPdf", () => ({ descargarPdfCotizacion: vi.fn(), enviarCotizacionWhatsApp: vi.fn() }));
vi.mock("../utils/reporteCotizaciones", () => ({ descargarReporteCotizaciones: vi.fn(), descargarExcelCotizaciones: vi.fn() }));

import Cotizaciones from "./Cotizaciones.jsx";

function Destino() {
  const location = useLocation();
  return <div>Destino: {location.pathname}{location.search}</div>;
}

const fecha = (dias) => {
  const date = new Date();
  date.setDate(date.getDate() + dias);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const cotizacion = (estado = "BORRADOR") => ({
  id: 7, folio: "COT-2026-00007", clienteNombre: "Colegio Norte", fechaEmision: fecha(-1),
  fechaVencimiento: fecha(2), estado, total: 1500,
});

describe("tabla de cotizaciones", () => {
  beforeEach(() => {
    sessionStorage.clear();
    listarCotizaciones.mockReset().mockResolvedValue({ content: [cotizacion()], totalPages: 1 });
    eliminarCotizacion.mockReset().mockResolvedValue(null);
    cambiarEstadoCotizacion.mockReset();
    asociarClienteParaPedido.mockReset();
    crearPedidoDesdeCotizacion.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("pide dos confirmaciones antes de eliminar un borrador", async () => {
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MemoryRouter><Cotizaciones /></MemoryRouter>);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Eliminar COT-2026-00007" }));

    await waitFor(() => expect(eliminarCotizacion).toHaveBeenCalledWith(7));
    expect(confirmar).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: "Eliminar COT-2026-00007" })).not.toBeInTheDocument();
  });

  it("impide volver a borrador y permite actualizar el estado desde la fila", async () => {
    listarCotizaciones.mockResolvedValue({ content: [cotizacion("PENDIENTE")], totalPages: 1 });
    cambiarEstadoCotizacion.mockResolvedValue(cotizacion("ENVIADA"));
    render(<MemoryRouter><Cotizaciones /></MemoryRouter>);
    const user = userEvent.setup();
    const selector = await screen.findByRole("combobox", { name: "Estado de COT-2026-00007" });

    expect(within(selector).queryByRole("option", { name: "Borrador" })).not.toBeInTheDocument();
    await user.selectOptions(selector, "ENVIADA");

    await waitFor(() => expect(cambiarEstadoCotizacion).toHaveBeenCalledWith(7, "ENVIADA"));
    expect(selector).toHaveValue("ENVIADA");
    expect(screen.getByText("Por vencer")).toBeInTheDocument();
  });

  it("retoma la cotización al registrar el cliente y crea el pedido", async () => {
    asociarClienteParaPedido.mockResolvedValue({ ...cotizacion("ACEPTADA"), clienteId: 81, detalles: [] });
    crearPedidoDesdeCotizacion.mockResolvedValue({ id: 93 });
    render(<MemoryRouter initialEntries={["/cotizaciones?cotizacion=7&clienteCreado=81"]}>
      <Routes><Route path="/cotizaciones" element={<Cotizaciones />} /><Route path="/pedidos-venta" element={<Destino />} /></Routes>
    </MemoryRouter>);

    expect(await screen.findByText("Destino: /pedidos-venta?pedido=93")).toBeInTheDocument();
    expect(asociarClienteParaPedido).toHaveBeenCalledWith("7", "81");
    expect(crearPedidoDesdeCotizacion).toHaveBeenCalledWith("7", {});
  });
});
