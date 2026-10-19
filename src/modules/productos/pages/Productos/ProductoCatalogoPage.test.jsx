import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerProductos } = vi.hoisted(() => ({ obtenerProductos: vi.fn() }));
vi.mock("../../services/productos", () => ({ obtenerProductos }));

import ProductoCatalogoPage from "./ProductoCatalogoPage";

function CotizacionDestino() {
  const { search } = useLocation();
  return <div>Producto para cotizar: {new URLSearchParams(search).get("productoId")}</div>;
}

describe("catálogo visual", () => {
  beforeEach(() => {
    obtenerProductos.mockReset();
    sessionStorage.clear();
    localStorage.setItem("user", JSON.stringify({
      permisos: ["VIEW_PRODUCT_CATALOG", "VIEW_QUOTES", "ACTION_QUOTES_CREATE"],
    }));
  });

  it("abre la cotización con la variante seleccionada", async () => {
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
          <Route path="/cotizaciones/nueva" element={<CotizacionDestino />} />
        </Routes>
      </MemoryRouter>
    );

    const cotizar = await screen.findByRole("button", { name: "Cotizar selección" }, { timeout: 5000 });
    const galeria = screen.getByRole("region", { name: "Galeria del producto" });
    expect(within(galeria).getAllByRole("img").every((imagen) => imagen.getAttribute("src").includes("/uploads/modelo.jpg"))).toBe(true);
    await user.click(cotizar);

    expect(screen.getByText("Producto para cotizar: 41")).toBeInTheDocument();
  });

  it("abre una página por familia y filtra sus subfamilias", async () => {
    obtenerProductos.mockResolvedValue({
      content: [
        { id: 1, nombre: "Silla concha", activo: true, lineaNombre: "ESCOLAR", familiaNombre: "SILLAS", subfamiliaNombre: "Concha", modeloId: 11, modeloNombre: "Concha uno" },
        { id: 4, nombre: "Silla concha azul", activo: true, lineaNombre: "ESCOLAR", familiaNombre: "SILLAS", subfamiliaNombre: "Concha", modeloId: 11, modeloNombre: "Concha uno", colorId: 4, colorNombre: "Azul", colorHex: "#123abc" },
        { id: 2, nombre: "Silla plegable", activo: true, lineaNombre: "ESCOLAR", familiaNombre: "SILLAS", subfamiliaNombre: "Plegables", modeloId: 12, modeloNombre: "Plegable dos" },
        { id: 3, nombre: "Silla ejecutiva", activo: true, lineaNombre: "OFICINA", familiaNombre: "SILLAS", subfamiliaNombre: "Ejecutivas", modeloId: 13, modeloNombre: "Ejecutiva tres" },
      ],
      totalPages: 1,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/productos/catalogo"]}>
        <Routes>
          <Route path="/productos/catalogo" element={<ProductoCatalogoPage />} />
          <Route path="/productos/catalogo/familias/:familiaSlug" element={<ProductoCatalogoPage />} />
          <Route path="/productos/catalogo/:id" element={<ProductoCatalogoPage />} />
          <Route path="/cotizaciones/nueva" element={<CotizacionDestino />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Índice del catálogo", {}, { timeout: 5000 })).toBeInTheDocument();
    const tarjetas = screen.getAllByRole("button", { name: /Ver familia/ });
    expect(tarjetas[0]).toHaveTextContent("Sillas escolares");
    expect(tarjetas[1]).toHaveTextContent("Sillas de oficina");
    expect(tarjetas[3]).toHaveTextContent("Mesas de oficina");

    await user.click(tarjetas[0]);
    expect(await screen.findByRole("heading", { name: "Modelos de Sillas escolares" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Concha uno" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plegable dos" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Concha" }));
    expect(screen.getByRole("heading", { name: "Concha uno" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Plegable dos" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Ver modelo y cotizar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver Concha uno en Azul" }));
    await user.click(await screen.findByRole("button", { name: "Cotizar selección" }, { timeout: 5000 }));
    expect(screen.getByText("Producto para cotizar: 4")).toBeInTheDocument();
  });
});
