import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const proveedores = vi.hoisted(() => ({
  obtenerProveedorPorId: vi.fn(),
  crearProveedor: vi.fn(),
  actualizarProveedor: vi.fn(),
  actualizarCalificacionProveedor: vi.fn(),
  eliminarProveedor: vi.fn()
}));

const tiposInsumo = vi.hoisted(() => ({
  crearTipoInsumo: vi.fn(),
  obtenerPreviewTipoInsumo: vi.fn(),
  obtenerTiposInsumo: vi.fn()
}));

vi.mock("../services/proveedores.js", () => proveedores);
vi.mock("../../insumos/services/tiposInsumo.js", () => tiposInsumo);
vi.mock("../../auth/services/authService", () => ({
  getUser: vi.fn(() => ({ permisos: [] })),
  hasPermission: vi.fn(() => false)
}));

import ProveedorForm from "./ProveedorForm.jsx";

const proveedorExistente = {
  id: 8,
  razonSocial: "Proveedor Verde SA",
  rfc: "PVE010101AA1",
  nombre: "Alma",
  apellidoPaterno: "Torres",
  apellidoMaterno: "Ruiz",
  tipoInsumo: "M",
  estado: "Jalisco",
  ciudad: "Guadalajara",
  colonia: "Centro",
  calle: "Roble",
  numeroExterior: "10",
  numeroInterior: "",
  codigoPostal: "44100",
  telefono: "3312345678",
  correo: "alma@example.com",
  calificacionProveedor: 82.75,
  activo: true
};

function renderForm(props = {}) {
  return render(
    <MemoryRouter initialEntries={["/proveedores/8"]}>
      <ProveedorForm {...props} />
    </MemoryRouter>
  );
}

describe("ProveedorForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tiposInsumo.obtenerTiposInsumo.mockResolvedValue([
      { id: 1, codigo: "M", nombre: "Madera", activo: true }
    ]);
    proveedores.actualizarProveedor.mockResolvedValue(proveedorExistente);
    proveedores.actualizarCalificacionProveedor.mockResolvedValue(proveedorExistente);
  });

  it("carga una calificacion existente sin reenviarla si no cambio", async () => {
    const onSave = vi.fn();
    renderForm({ proveedor: proveedorExistente, onSave });

    const input = await screen.findByLabelText("Calificación del proveedor");
    expect(input).toHaveValue(82.75);

    await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => {
      expect(proveedores.actualizarProveedor).toHaveBeenCalledWith(
        8,
        expect.not.objectContaining({ calificacionProveedor: expect.anything() })
      );
    });
    expect(proveedores.actualizarCalificacionProveedor).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(proveedorExistente);
  });

  it("actualiza una calificacion modificada mediante el endpoint dedicado", async () => {
    const respuesta = { ...proveedorExistente, calificacionProveedor: 88.5 };
    proveedores.actualizarCalificacionProveedor.mockResolvedValue(respuesta);
    const onSave = vi.fn();
    renderForm({ proveedor: proveedorExistente, onSave });

    const input = await screen.findByLabelText("Calificación del proveedor");
    await userEvent.clear(input);
    await userEvent.type(input, "88.5");
    await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => {
      expect(proveedores.actualizarCalificacionProveedor).toHaveBeenCalledWith(8, 88.5);
    });
    expect(onSave).toHaveBeenCalledWith(respuesta);
  });

  it("permite quitar una calificacion y volver a sin calificar", async () => {
    const respuesta = { ...proveedorExistente, calificacionProveedor: null };
    proveedores.actualizarCalificacionProveedor.mockResolvedValue(respuesta);
    renderForm({ proveedor: proveedorExistente, onSave: vi.fn() });

    const input = await screen.findByLabelText("Calificación del proveedor");
    await userEvent.clear(input);
    await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => {
      expect(proveedores.actualizarCalificacionProveedor).toHaveBeenCalledWith(8, null);
    });
  });

  it("rechaza una calificacion mayor a 100 antes de llamar al servicio", async () => {
    renderForm({ proveedor: proveedorExistente, onSave: vi.fn() });

    const input = await screen.findByLabelText("Calificación del proveedor");
    await userEvent.clear(input);
    await userEvent.type(input, "100.01");
    await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    expect(await screen.findByText("La calificación debe estar entre 0 y 100")).toBeInTheDocument();
    expect(proveedores.actualizarProveedor).not.toHaveBeenCalled();
  });

  it("rechaza una calificacion con mas de dos decimales", async () => {
    renderForm({ proveedor: proveedorExistente, onSave: vi.fn() });

    const input = await screen.findByLabelText("Calificación del proveedor");
    await userEvent.clear(input);
    await userEvent.type(input, "74.999");
    await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    expect(await screen.findByText("La calificación admite máximo 2 decimales")).toBeInTheDocument();
    expect(proveedores.actualizarProveedor).not.toHaveBeenCalled();
  });

  it("muestra y recalcula la prioridad al instante sin guardar", async () => {
    renderForm({ proveedor: proveedorExistente, onSave: vi.fn() });

    const input = await screen.findByLabelText("Calificación del proveedor");
    expect(screen.getByText("Prioridad alta")).toBeInTheDocument();

    await userEvent.clear(input);
    expect(screen.getByText("Sin evaluar")).toBeInTheDocument();

    await userEvent.type(input, "49.99");
    expect(screen.getByText("Prioridad baja")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "50");
    expect(screen.getByText("Prioridad media")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "75");
    expect(screen.getByText("Prioridad alta")).toBeInTheDocument();

    expect(proveedores.actualizarCalificacionProveedor).not.toHaveBeenCalled();
  });
});
