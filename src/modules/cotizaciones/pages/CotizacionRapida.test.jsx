import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { buscarProductosCotizables, obtenerProductoCotizable, obtenerEstructuraCostos } = vi.hoisted(() => ({
  buscarProductosCotizables: vi.fn(),
  obtenerProductoCotizable: vi.fn(),
  obtenerEstructuraCostos: vi.fn(),
}));

vi.mock("../services/cotizaciones", () => ({ buscarProductosCotizables, obtenerProductoCotizable }));
vi.mock("../../productos/services/productos", () => ({ obtenerEstructuraCostos }));

import CotizacionRapida from "./CotizacionRapida";

function CotizacionFormalDestino() {
  const { state } = useLocation();
  return <div>Producto enviado: {state.carritoInicial[0].sku}</div>;
}

const renderCatalogoCotizacion = () => render(
  <MemoryRouter initialEntries={["/cotizaciones/nueva?productoId=9"]}>
    <Routes>
      <Route path="/cotizaciones/nueva" element={<CotizacionRapida />} />
      <Route path="/cotizaciones/formal" element={<CotizacionFormalDestino />} />
    </Routes>
  </MemoryRouter>
);

describe("cotizar desde el catálogo visual", () => {
  beforeEach(() => {
    buscarProductosCotizables.mockReset();
    obtenerProductoCotizable.mockReset();
    obtenerEstructuraCostos.mockReset();
  });

  it("preselecciona la variante exacta y la envía a la cotización formal", async () => {
    obtenerProductoCotizable.mockResolvedValue({ id: 9, sku: "ESC-001-ROJO", nombre: "Pupitre rojo", cotizable: true, costoTotal: 100 });
    obtenerEstructuraCostos.mockResolvedValue({ costoTotal: 100, costoInsumosConDesperdicio: 40, costoOperaciones: 50, costoCif: 10 });
    const user = userEvent.setup();
    renderCatalogoCotizacion();

    expect(await screen.findByRole("heading", { name: "Pupitre rojo" })).toBeInTheDocument();
    expect(obtenerProductoCotizable).toHaveBeenCalledWith("9");
    await user.click((await screen.findAllByRole("button", { name: "Agregar a borrador" }))[0]);
    await user.click(screen.getByRole("button", { name: /Mandar a cotización/ }));

    expect(screen.getByText("Producto enviado: ESC-001-ROJO")).toBeInTheDocument();
  });

  it("explica por qué una variante aún no se puede cotizar", async () => {
    obtenerProductoCotizable.mockResolvedValue({ id: 9, nombre: "Pupitre rojo", cotizable: false, faltantes: ["No cotizable: falta operaciones"] });
    renderCatalogoCotizacion();

    expect(await screen.findByText(/Pupitre rojo: No cotizable: falta operaciones/)).toBeInTheDocument();
    expect(obtenerEstructuraCostos).not.toHaveBeenCalled();
  });
});
