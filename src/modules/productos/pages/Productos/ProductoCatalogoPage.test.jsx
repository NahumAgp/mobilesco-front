import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerProductos, obtenerFamiliasActivasCatalogo, obtenerModelosCatalogoPublico, obtenerFichaCatalogoPublico } = vi.hoisted(() => ({
  obtenerProductos: vi.fn(),
  obtenerFamiliasActivasCatalogo: vi.fn(),
  obtenerModelosCatalogoPublico: vi.fn(),
  obtenerFichaCatalogoPublico: vi.fn(),
}));
vi.mock("../../services/productos", () => ({
  obtenerProductos, obtenerFamiliasActivasCatalogo, obtenerModelosCatalogoPublico, obtenerFichaCatalogoPublico,
}));
const { obtenerProductoCotizable } = vi.hoisted(() => ({ obtenerProductoCotizable: vi.fn() }));
vi.mock("../../../cotizaciones/services/cotizaciones.js", () => ({ obtenerProductoCotizable }));

import ProductoCatalogoPage from "./ProductoCatalogoPage";

describe("catálogo visual", () => {
  beforeEach(() => {
    obtenerProductos.mockReset();
    obtenerFamiliasActivasCatalogo.mockReset();
    obtenerFamiliasActivasCatalogo.mockResolvedValue([]);
    obtenerModelosCatalogoPublico.mockReset();
    obtenerFichaCatalogoPublico.mockReset();
    obtenerProductoCotizable.mockReset();
    obtenerProductoCotizable.mockResolvedValue({ cotizable: true, costoTotal: 100 });
    sessionStorage.clear();
    localStorage.setItem("user", JSON.stringify({
      permisos: ["VIEW_PRODUCT_CATALOG", "VIEW_QUOTES", "ACTION_QUOTES_CREATE"],
    }));
  });

  it("abre el selector de cotización con la variante seleccionada", async () => {
    obtenerFamiliasActivasCatalogo.mockResolvedValue([
      { id: 2, nombre: "Escolares", lineaNombre: "Sillas" },
    ]);
    obtenerProductos.mockResolvedValue({
      content: [{
        id: 41, sku: "SILLA-ROJA", nombre: "Silla roja", activo: true,
        lineaNombre: "Sillas", familiaId: 2, familiaNombre: "Escolares",
        subfamiliaId: 3, subfamiliaNombre: "Concha",
        modeloId: 4, modeloNombre: "Silla escolar",
        modeloUrlImagen: "/uploads/modelo.jpg", imagenPrincipalUrl: "/uploads/variante-roja.jpg",
        materialId: 5, materialNombre: "Madera",
        nivelId: 6, nivelNombre: "Primaria",
        colorId: 7, colorNombre: "Rojo",
      }],
      totalPages: 1,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/productos/catalogo/41"]}>
        <Routes>
          <Route path="/productos/catalogo/:id" element={<ProductoCatalogoPage />} />
        </Routes>
      </MemoryRouter>
    );

    const cotizar = await screen.findByRole("button", { name: "Agregar a mi cotización" });
    const galeria = screen.getByRole("region", { name: "Galeria del producto" });
    expect(within(galeria).getAllByRole("img").every((imagen) => imagen.getAttribute("src").includes("/uploads/modelo.jpg"))).toBe(true);
    await user.click(cotizar);
    const selector = await screen.findByRole("dialog");
    expect(within(selector).getByText("SILLA-ROJA")).toBeInTheDocument();
  });

  it("abre la familia activa y permite navegar a otra página", async () => {
    obtenerFamiliasActivasCatalogo.mockResolvedValue([
      { id: 2, nombre: "SILLAS", lineaNombre: "ESCOLAR" },
      { id: 3, nombre: "SILLAS", lineaNombre: "OFICINA" },
    ]);
    obtenerModelosCatalogoPublico.mockImplementation(({ familiaId }) =>
      Promise.resolve(familiaId === 2 ? [{ modeloId: 11 }] : []));
    obtenerFichaCatalogoPublico.mockResolvedValue({
      modeloId: 11, nombre: "Concha uno", familiaId: 2, familiaNombre: "SILLAS",
      subfamiliaNombre: "Concha", variantes: [{ productoId: 1, sku: "SILLA-CONCHA", activo: true }],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/productos/catalogo"]}>
        <Routes>
          <Route path="/productos/catalogo" element={<ProductoCatalogoPage />} />
          <Route path="/productos/catalogo/familias/:familiaSlug" element={<ProductoCatalogoPage />} />
          <Route path="/productos/catalogo/:id" element={<ProductoCatalogoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Concha uno" })).toBeInTheDocument();
    const selector = screen.getByRole("combobox", { name: "Ir a familia" });
    expect(within(selector).getAllByRole("option")).toHaveLength(2);
    expect(selector).toHaveValue("sillas-escolares");
    await user.selectOptions(selector, "sillas-oficina");
    expect(await screen.findByText("No hay modelos coincidentes en esta familia.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Ir a familia" })).toHaveValue("sillas-oficina");
  });
});
