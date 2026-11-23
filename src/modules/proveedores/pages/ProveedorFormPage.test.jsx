import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProveedorFormPage from "./ProveedorFormPage.jsx";
import { obtenerProveedorPorId } from "../services/proveedores.js";
import { obtenerComprasPorProveedor } from "../../compras/services/compras.js";
import { hasPermission } from "../../auth/services/authService.js";

vi.mock("../components/ProveedorForm.jsx", () => ({ default: () => <div>Formulario de edición</div> }));
vi.mock("../services/proveedores.js", () => ({ obtenerProveedorPorId: vi.fn() }));
vi.mock("../../compras/services/compras.js", () => ({ obtenerComprasPorProveedor: vi.fn() }));
vi.mock("../../auth/services/authService.js", () => ({
  getUser: vi.fn(() => ({ id: 1 })),
  hasPermission: vi.fn(() => true),
}));

const mostrarPagina = () => render(<MemoryRouter initialEntries={["/proveedores/1"]}>
  <Routes><Route path="/proveedores/:id" element={<ProveedorFormPage />} /></Routes>
</MemoryRouter>);

beforeEach(() => {
  obtenerProveedorPorId.mockClear();
  obtenerComprasPorProveedor.mockClear();
  obtenerProveedorPorId.mockResolvedValue({ id: 1, razonSocial: "Proveedor Ejemplo" });
  obtenerComprasPorProveedor.mockResolvedValue([]);
  hasPermission.mockReturnValue(true);
});
afterEach(cleanup);

describe("ficha del proveedor", () => {
  it("presenta historial y gráficas antes del formulario de edición, incluso sin compras", async () => {
    mostrarPagina();
    expect(await screen.findByText("Aún no hay compras registradas para este proveedor.")).toBeInTheDocument();
    const historial = screen.getByRole("heading", { name: "Historial de compras" });
    const datos = screen.getByRole("heading", { name: "Datos del proveedor" });
    expect(historial.compareDocumentPosition(datos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Importe por mes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estado de las compras" })).toBeInTheDocument();
    expect(obtenerComprasPorProveedor).toHaveBeenCalledWith("1");
  });

  it("mantiene la edición disponible sin acceso a compras", async () => {
    hasPermission.mockImplementation((_, codigo) => codigo !== "VIEW_PURCHASES");
    mostrarPagina();
    expect(await screen.findByText("Formulario de edición")).toBeInTheDocument();
    expect(screen.getByText(/no tiene permiso para consultar compras/)).toBeInTheDocument();
    expect(obtenerComprasPorProveedor).not.toHaveBeenCalled();
  });

  it("muestra importes y compras reales en el historial", async () => {
    obtenerComprasPorProveedor.mockResolvedValue([
      { id: 10, folio: "C-10", fechaCompra: "2026-11-15", total: 250, estado: "RECIBIDA" },
      { id: 9, folio: "C-09", fechaCompra: "2026-10-01", total: 100, estado: "CANCELADA" },
    ]);
    mostrarPagina();
    expect(await screen.findByText("C-10")).toBeInTheDocument();
    expect(within(screen.getByRole("img", { name: /Importe mensual/ })).queryByText(/nov 26/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Importe mensual/ })).toHaveAttribute("aria-label", expect.stringContaining("$250.00"));
    expect(screen.getByText("Monto no cancelado").parentElement).toHaveTextContent("$250.00");
    expect(screen.getByText("C-09")).toBeInTheDocument();
  });
});
