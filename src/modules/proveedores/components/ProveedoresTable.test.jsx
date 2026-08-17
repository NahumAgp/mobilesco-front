import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../auth/services/authService", () => ({
  getUser: vi.fn(() => ({ permisos: [] })),
  hasPermission: vi.fn(() => false)
}));

import ProveedoresTable from "./ProveedoresTable.jsx";

const proveedorBase = {
  razonSocial: "Proveedor de prueba",
  nombre: "Ana",
  apellidoPaterno: "Lopez",
  tipoInsumo: "M",
  tipoInsumoNombre: "Madera",
  correo: "ana@example.com",
  telefono: "3312345678",
  activo: true,
  fechaRegistro: null,
  fechaUltimoContacto: null
};

function renderTable(data) {
  return render(
    <MemoryRouter initialEntries={["/proveedores"]}>
      <ProveedoresTable
        data={data}
        onEditar={vi.fn()}
        onCambiarEstado={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe("ProveedoresTable", () => {
  it("muestra cero como una calificacion valida con dos decimales", () => {
    renderTable([{ ...proveedorBase, id: 1, calificacionProveedor: 0 }]);

    const row = screen.getByRole("button");
    expect(within(row).getByText("0.00 / 100")).toBeInTheDocument();
    expect(within(row).queryByText("Sin calificar")).not.toBeInTheDocument();
  });

  it("distingue una calificacion ausente de una calificacion de cero", () => {
    renderTable([{ ...proveedorBase, id: 2, calificacionProveedor: null }]);

    const row = screen.getByRole("button");
    expect(within(row).getByText("Sin calificar")).toBeInTheDocument();
    expect(within(row).queryByText("0.00 / 100")).not.toBeInTheDocument();
  });

  it("muestra junto a la calificacion la prioridad derivada", () => {
    const casos = [
      { id: 10, razonSocial: "Proveedor sin evaluar", calificacionProveedor: null, prioridad: "Sin evaluar" },
      { id: 11, razonSocial: "Proveedor baja", calificacionProveedor: 49.99, prioridad: "Prioridad baja" },
      { id: 12, razonSocial: "Proveedor media", calificacionProveedor: 50, prioridad: "Prioridad media" },
      { id: 13, razonSocial: "Proveedor alta", calificacionProveedor: 75, prioridad: "Prioridad alta" }
    ];

    renderTable(casos.map((caso) => ({ ...proveedorBase, ...caso })));

    casos.forEach(({ razonSocial, prioridad }) => {
      const row = screen.getByText(razonSocial).closest("tr");
      expect(row).not.toBeNull();
      expect(within(row).getByText(prioridad)).toBeInTheDocument();
    });
  });
});
