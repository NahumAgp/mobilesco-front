import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPurchase, permissions } = vi.hoisted(() => ({
  getPurchase: vi.fn(),
  permissions: new Set(),
}));

vi.mock("../services/compras.js", () => ({ obtenerCompraPorId: getPurchase }));
vi.mock("../../auth/services/authService.js", () => ({
  getUser: vi.fn(() => ({ id: 1 })),
  hasPermission: vi.fn((user, permission) => permissions.has(permission)),
}));

import CompraDetallePage from "./CompraDetallePage.jsx";

describe("CompraDetallePage para borradores", () => {
  beforeEach(() => {
    getPurchase.mockReset();
    permissions.clear();
  });

  it("ofrece editar con su permiso y mantiene oculta la recepción", async () => {
    permissions.add("ACTION_PURCHASES_EDIT");
    permissions.add("ACTION_PURCHASES_RECEIVE");
    getPurchase.mockResolvedValue({
      id: 10,
      folio: "BOR-0010",
      estado: "BORRADOR",
      total: 0,
      subtotal: 0,
      impuesto: 0,
      fechaCompra: "2026-08-17",
      proveedorRazonSocial: "Textiles Norte",
      detalles: [],
    });

    render(
      <MemoryRouter initialEntries={["/compras/10/ver"]}>
        <Routes>
          <Route path="/compras/:id/ver" element={<CompraDetallePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ir a Entradas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir recepción" })).not.toBeInTheDocument();
  });

  it("muestra el nombre del comprador junto a su correo en el detalle", async () => {
    getPurchase.mockResolvedValue({
      id: 11, folio: "COMP-11", estado: "RECIBIDA", total: 500, subtotal: 500, impuesto: 0,
      fechaCompra: "2026-11-09", proveedorRazonSocial: "Proveedor Uno", detalles: [],
      realizadoPor: "ana@example.com", realizadoPorNombre: "Ana María López Ruiz",
    });

    render(<MemoryRouter initialEntries={["/compras/11/ver"]}><Routes>
      <Route path="/compras/:id/ver" element={<CompraDetallePage />} />
    </Routes></MemoryRouter>);

    expect(await screen.findByText("Ana María López Ruiz")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });
});
