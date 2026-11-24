import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { crearCliente, obtenerClasificacionesCliente } = vi.hoisted(() => ({
  crearCliente: vi.fn(), obtenerClasificacionesCliente: vi.fn(),
}));
vi.mock("../services/clientes", () => ({
  crearCliente, obtenerClasificacionesCliente,
  actualizarCliente: vi.fn(), eliminarCliente: vi.fn(), obtenerCliente: vi.fn(),
}));

import ClienteFormPage from "./ClienteFormPage.jsx";

function Destino() {
  const location = useLocation();
  return <div>Destino: {location.pathname}{location.search}</div>;
}

describe("alta de cliente desde una cotización", () => {
  beforeEach(() => {
    crearCliente.mockReset().mockResolvedValue({ id: 81 });
    obtenerClasificacionesCliente.mockReset().mockResolvedValue([
      { codigo: "PROSPECTO", etiqueta: "Prospecto" },
    ]);
  });

  it("conserva el pedido pendiente tras recargar la ruta y valida la razón social", async () => {
    const user = userEvent.setup();
    const { container } = render(<MemoryRouter initialEntries={["/clientes/nuevo?cotizacionPedidoId=7"]}>
      <Routes>
        <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
        <Route path="/cotizaciones" element={<Destino />} />
      </Routes>
    </MemoryRouter>);

    expect(screen.getByText(/pedido de la cotización #7/)).toBeInTheDocument();
    const razonSocial = container.querySelector('input[name="razonSocial"]');
    expect(razonSocial).toBeRequired();
    await user.click(screen.getByRole("button", { name: "Guardar cliente" }));
    expect(crearCliente).not.toHaveBeenCalled();

    await user.type(razonSocial, "Colegio Norte");
    await user.click(screen.getByRole("button", { name: "Guardar cliente" }));

    await waitFor(() => expect(crearCliente).toHaveBeenCalledWith(expect.objectContaining({ razonSocial: "Colegio Norte" })));
    expect(await screen.findByText("Destino: /cotizaciones?cotizacion=7&clienteCreado=81")).toBeInTheDocument();
  });
});
