import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ComprasTable from "./ComprasTable.jsx";

describe("ComprasTable", () => {
  it("identifica un borrador y permite confirmarlo sin abrir el detalle", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    const onVer = vi.fn();
    const draft = {
      id: 42,
      folio: "BOR-0042",
      fechaCompra: "2026-08-17",
      proveedorRazonSocial: "Proveedor Uno",
      proveedorRfc: "PUO010101AA1",
      metodoPago: null,
      total: 1200,
      estado: "BORRADOR",
    };

    render(
      <MemoryRouter>
        <ComprasTable
          data={[draft]}
          onVer={onVer}
          onConfirmar={onConfirmar}
          puedeConfirmar
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Borrador")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirmar).toHaveBeenCalledWith(draft);
    expect(onVer).not.toHaveBeenCalled();
  });

  it("no ofrece confirmar un borrador sin el permiso de creación", () => {
    render(
      <MemoryRouter>
        <ComprasTable
          data={[{
            id: 43,
            folio: "BOR-0043",
            fechaCompra: "2026-08-17",
            proveedorRazonSocial: "Proveedor Dos",
            total: 300,
            estado: "BORRADOR",
          }]}
          onVer={vi.fn()}
          onConfirmar={vi.fn()}
          puedeConfirmar={false}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });

  it("permite eliminar un borrador con el permiso correspondiente", async () => {
    const user = userEvent.setup();
    const onEliminar = vi.fn();
    const draft = {
      id: 44,
      folio: "BOR-0044",
      fechaCompra: "2026-08-17",
      proveedorRazonSocial: "Proveedor Tres",
      total: 700,
      estado: "BORRADOR",
    };

    render(
      <MemoryRouter>
        <ComprasTable
          data={[draft]}
          onVer={vi.fn()}
          onEliminar={onEliminar}
          puedeEliminar
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onEliminar).toHaveBeenCalledWith(draft);
  });
});
