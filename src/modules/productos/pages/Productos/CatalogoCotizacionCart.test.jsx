import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerProductoCotizable } = vi.hoisted(() => ({ obtenerProductoCotizable: vi.fn() }));
vi.mock("../../../cotizaciones/services/cotizaciones.js", () => ({ obtenerProductoCotizable }));

import CatalogoCotizacionProvider from "./CatalogoCotizacionCart.jsx";

function Destino() {
  const { state, pathname } = useLocation();
  return <div>Ruta: {pathname}; Flujo: {state.flujoCatalogo}; Producto: {state.carritoInicial[0].sku}; Cliente: {state.borradorFormulario?.clienteId || ""}</div>;
}

const carrito = [{ id: 9, sku: "ESC-001", nombre: "Silla escolar", activo: true,
  costoTotal: 100, cantidad: 2, utilidad: 35 }];

function renderCarrito() {
  return render(<MemoryRouter initialEntries={["/productos/catalogo"]}>
    <Routes>
      <Route path="/productos/catalogo" element={<CatalogoCotizacionProvider enabled><div>Catálogo</div></CatalogoCotizacionProvider>} />
      <Route path="/cotizaciones/formal" element={<Destino />} />
      <Route path="/cotizaciones/:id/editar" element={<Destino />} />
    </Routes>
  </MemoryRouter>);
}

describe("selección del catálogo", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("user", JSON.stringify({ permisos: ["VIEW_SALES_ORDERS", "ACTION_SALES_ORDERS_CREATE"] }));
    localStorage.setItem("catalogo:carrito-cotizacion", JSON.stringify(carrito));
    obtenerProductoCotizable.mockReset();
    obtenerProductoCotizable.mockResolvedValue({ id: 9, sku: "ESC-001", nombre: "Silla escolar", cotizable: true, costoTotal: 100 });
  });

  it("envía pedido al formulario y conserva la selección hasta guardarlo", async () => {
    const user = userEvent.setup();
    renderCarrito();
    await user.click(screen.getByRole("button", { name: /Abrir selección/ }));
    await user.click(screen.getByRole("button", { name: "Pedido" }));
    expect(screen.getByRole("heading", { name: "Tu pedido" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Continuar a pedido/ }));

    expect(await screen.findByText("Ruta: /cotizaciones/formal; Flujo: pedido; Producto: ESC-001; Cliente:")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("catalogo:carrito-cotizacion"))).toHaveLength(1);
  });

  it("mantiene cotización como opción inicial", async () => {
    const user = userEvent.setup();
    renderCarrito();
    await user.click(screen.getByRole("button", { name: /Abrir selección/ }));
    expect(screen.getByRole("button", { name: "Cotización" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Continuar a cotizar/ }));

    expect(await screen.findByText("Ruta: /cotizaciones/formal; Flujo: cotizacion; Producto: ESC-001; Cliente:")).toBeInTheDocument();
  });

  it("regresa a la edición con el carrito y el cliente seleccionados", async () => {
    sessionStorage.setItem("cotizacion:regreso-catalogo", JSON.stringify({
      ruta: "/cotizaciones/7/editar", flujoCatalogo: "cotizacion", borradorFormulario: { clienteId: "81" },
    }));
    const user = userEvent.setup();
    renderCarrito();
    await user.click(screen.getByRole("button", { name: /Abrir selección/ }));
    await user.click(screen.getByRole("button", { name: /Continuar a cotizar/ }));

    expect(await screen.findByText("Ruta: /cotizaciones/7/editar; Flujo: cotizacion; Producto: ESC-001; Cliente: 81")).toBeInTheDocument();
    expect(sessionStorage.getItem("cotizacion:regreso-catalogo")).toBeNull();
  });
});
