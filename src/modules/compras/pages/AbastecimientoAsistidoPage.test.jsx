import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSuggestions, generateDrafts } = vi.hoisted(() => ({
  getSuggestions: vi.fn(),
  generateDrafts: vi.fn(),
}));

vi.mock("../services/abastecimiento.js", () => ({
  obtenerSugerenciasAbastecimiento: getSuggestions,
  generarComprasBorrador: generateDrafts,
}));

vi.mock("../../auth/services/authService.js", () => ({
  getUser: vi.fn(() => ({ permisos: ["VIEW_PURCHASES", "ACTION_PURCHASES_CREATE"] })),
  hasPermission: vi.fn((user, permission) => user.permisos.includes(permission)),
}));

import AbastecimientoAsistidoPage from "./AbastecimientoAsistidoPage.jsx";

const suggestion = {
  insumoId: 8,
  codigo: "INS-008",
  nombre: "Tela exterior",
  unidadMedidaSimbolo: "m",
  clasificacionAbc: "A",
  consumoMensual: 30,
  stockDisponible: 4,
  stockMinimo: 10,
  puntoReorden: 12,
  cantidadSugerida: 18,
  prioridad: "ALTA",
  explicacion: "El inventario está debajo del punto de reorden.",
  proveedorSugerido: {
    id: 4,
    nombre: "Textiles Norte",
    costoUnitario: 55,
    unidadCompraSimbolo: "m",
    calificacion: 92,
  },
  proveedores: [
    {
      id: 5,
      nombre: "Telas del Centro",
      costoUnitario: 51,
      unidadCompraSimbolo: "m",
      calificacion: 85,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AbastecimientoAsistidoPage />
    </MemoryRouter>,
  );
}

describe("AbastecimientoAsistidoPage", () => {
  beforeEach(() => {
    getSuggestions.mockReset();
    generateDrafts.mockReset();
  });

  it("permite ajustar la sugerencia y genera borradores agrupados", async () => {
    const user = userEvent.setup();
    getSuggestions
      .mockResolvedValueOnce([suggestion])
      .mockResolvedValueOnce([]);
    generateDrafts.mockResolvedValue({
      cantidadCompras: 1,
      cantidadPartidas: 1,
      compras: [{
        compraId: 99,
        folio: "BOR-0099",
        proveedorNombre: "Telas del Centro",
        partidas: 1,
        subtotalEstimado: 765,
      }],
    });
    renderPage();

    expect(await screen.findByText("Tela exterior")).toBeInTheDocument();
    expect(screen.getByText("El inventario está debajo del punto de reorden.")).toBeInTheDocument();

    const quantity = screen.getByLabelText("Cantidad para INS-008");
    await user.clear(quantity);
    await user.type(quantity, "15");
    await user.selectOptions(screen.getByLabelText("Proveedor para INS-008"), "5");
    await user.click(screen.getByRole("button", { name: "Generar borradores (1)" }));
    await user.click(screen.getByRole("button", { name: "Generar borradores" }));

    await waitFor(() => {
      expect(generateDrafts).toHaveBeenCalledWith([
        { insumoId: 8, cantidad: 15, proveedorId: 5 },
      ]);
    });
    await waitFor(() => expect(getSuggestions).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Borradores generados")).toBeInTheDocument();
    expect(screen.getByText("BOR-0099")).toBeInTheDocument();
    expect(screen.getByText("El inventario está cubierto")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay necesidades de compra", async () => {
    getSuggestions.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("El inventario está cubierto")).toBeInTheDocument();
    expect(screen.getByText("No hay insumos que requieran una compra con los datos actuales.")).toBeInTheDocument();
  });

  it("conserva el éxito y evita reintentar la generación si falla la recarga", async () => {
    const user = userEvent.setup();
    getSuggestions
      .mockResolvedValueOnce([suggestion])
      .mockRejectedValueOnce(new Error("No se pudo recalcular"));
    generateDrafts.mockResolvedValue({
      cantidadCompras: 1,
      cantidadPartidas: 1,
      compras: [{ compraId: 100, folio: "BOR-0100", partidas: 1 }],
    });
    renderPage();

    expect(await screen.findByText("Tela exterior")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Generar borradores (1)" }));
    await user.click(screen.getByRole("button", { name: "Generar borradores" }));

    expect(await screen.findByText("Borradores generados")).toBeInTheDocument();
    expect(screen.getByText("Los borradores sí fueron generados.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actualizar sugerencias" })).toBeInTheDocument();
    expect(screen.queryByText("Tela exterior")).not.toBeInTheDocument();
    expect(generateDrafts).toHaveBeenCalledTimes(1);
  });

  it("ofrece reintentar cuando falla el cálculo", async () => {
    getSuggestions.mockRejectedValueOnce(new Error("Servicio no disponible"));
    renderPage();

    expect(await screen.findByText("No pudimos cargar las sugerencias")).toBeInTheDocument();
    expect(screen.getByText("Servicio no disponible")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeInTheDocument();
  });
});
