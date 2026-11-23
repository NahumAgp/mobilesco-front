import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerClientesActivos, crearCotizacion, crearPedidoDesdeCatalogo } = vi.hoisted(() => ({
  obtenerClientesActivos: vi.fn(), crearCotizacion: vi.fn(), crearPedidoDesdeCatalogo: vi.fn(),
}));
vi.mock("../../clientes/services/clientes", () => ({ obtenerClientesActivos, crearCliente: vi.fn() }));
vi.mock("../services/cotizaciones", () => ({ crearCotizacion, obtenerCotizacion: vi.fn(), buscarProductosCotizables: vi.fn(), cotizarFlete: vi.fn() }));
vi.mock("../../pedidos-venta/services/pedidosVenta", () => ({ crearPedidoDesdeCatalogo }));
vi.mock("../components/FleteMapa", () => ({ default: () => <div>Mapa</div> }));

import NuevaCotizacion from "./NuevaCotizacion.jsx";

const carritoInicial = [{ id: 9, sku: "ESC-001", nombre: "Silla escolar", costoTotal: 100, cantidad: 2, utilidad: 35 }];

function Destino() {
  const location = useLocation();
  return <div>Destino: {location.pathname}{location.search}</div>;
}

function renderFormulario(flujoCatalogo) {
  return render(<MemoryRouter initialEntries={[{
    pathname: "/cotizaciones/formal",
    state: { carritoInicial, cotizacionRapida: true, origenCatalogo: true, flujoCatalogo },
  }]}>
    <Routes>
      <Route path="/cotizaciones/formal" element={<NuevaCotizacion />} />
      <Route path="/cotizaciones" element={<Destino />} />
      <Route path="/pedidos-venta" element={<Destino />} />
    </Routes>
  </MemoryRouter>);
}

describe("formulario del catálogo", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("catalogo:carrito-cotizacion", JSON.stringify(carritoInicial));
    obtenerClientesActivos.mockReset();
    obtenerClientesActivos.mockResolvedValue([{ id: 2, codigo: "C-2", nombreVisual: "Cliente Norte" }]);
    crearCotizacion.mockReset();
    crearPedidoDesdeCatalogo.mockReset();
  });

  it("genera pedido con cliente y abre el pedido creado", async () => {
    crearPedidoDesdeCatalogo.mockResolvedValue({ id: 15, folio: "PV-2026-00015" });
    const user = userEvent.setup();
    renderFormulario("pedido");

    expect(screen.getByRole("heading", { name: "Generar pedido" })).toBeInTheDocument();
    await user.selectOptions(await screen.findByRole("combobox"), "2");
    await user.click(screen.getAllByRole("button", { name: "Generar pedido" })[0]);

    expect(crearPedidoDesdeCatalogo).toHaveBeenCalledWith(expect.objectContaining({
      clienteId: 2, estado: "PENDIENTE", detalles: [{ productoId: 9, cantidad: 2, utilidadPorcentaje: 35 }],
    }));
    expect(await screen.findByText("Destino: /pedidos-venta?pedido=15")).toBeInTheDocument();
    expect(localStorage.getItem("catalogo:carrito-cotizacion")).toBeNull();
  });

  it("impide generar pedido sin cliente", async () => {
    const user = userEvent.setup();
    renderFormulario("pedido");
    await user.click(screen.getAllByRole("button", { name: "Generar pedido" })[0]);

    expect(screen.getByText("Selecciona un cliente para generar el pedido.")).toBeInTheDocument();
    expect(crearPedidoDesdeCatalogo).not.toHaveBeenCalled();
  });

  it("guarda cotización pendiente y abre su registro", async () => {
    crearCotizacion.mockResolvedValue({ id: 7, folio: "COT-2026-00007" });
    const user = userEvent.setup();
    renderFormulario("cotizacion");
    await user.click(screen.getAllByRole("button", { name: "Finalizar cotización" })[0]);

    expect(crearCotizacion).toHaveBeenCalledWith(expect.objectContaining({ estado: "PENDIENTE" }));
    expect(await screen.findByText("Destino: /cotizaciones?cotizacion=7")).toBeInTheDocument();
  });
});
