import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InsumoForm from "./InsumoForm.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("../services/insumos.js", () => ({
  obtenerInsumoPorId: vi.fn(),
  crearInsumo: vi.fn().mockResolvedValue({
    id: 77,
    nombre: "Tornillo nuevo",
    unidadMedidaId: 1,
    unidadMedidaNombre: "Pieza",
    unidadMedidaSimbolo: "pz"
  }),
  actualizarInsumo: vi.fn(),
  eliminarInsumo: vi.fn(),
  ajustarStock: vi.fn()
}));

vi.mock("../services/tiposInsumo.js", () => ({
  obtenerTiposInsumo: vi.fn().mockResolvedValue([])
}));

vi.mock("../../unidades-medida/services/unidadMedidas.js", () => ({
  obtenerUnidadesMedida: vi.fn().mockResolvedValue([
    { id: 1, nombre: "Pieza", simbolo: "pz" }
  ]),
  crearUnidadMedida: vi.fn()
}));

vi.mock("../../auth/services/authService.js", () => ({
  getUser: () => ({ permisos: ["ACTION_INVENTORY_CREATE"] })
}));

vi.mock("../utils/costosPermisos.js", () => ({
  puedeAjustarStockManual: () => true,
  puedeGestionarCatalogoInsumos: () => true,
  puedeGestionarCostosInsumos: () => true
}));

vi.mock("../components/barcode/Ean13Barcode.jsx", () => ({
  Ean13BarcodeSvg: () => <svg aria-label="barcode" />
}));

vi.mock("../components/barcode/ean13Utils.js", () => ({
  obtenerBitsEan13: vi.fn()
}));

describe("InsumoForm en modal", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("guarda sin disparar el submit del formulario padre", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onParentSubmit = vi.fn((event) => event.preventDefault());

    const { container } = render(
      <div onSubmit={onParentSubmit}>
        <InsumoForm onSave={onSave} onCancel={vi.fn()} />
      </div>
    );

    await user.type(screen.getByPlaceholderText(/Tornillos, Tubo, Tela/i), "Tornillo nuevo");
    await waitFor(() => {
      expect(container.querySelector('select[name="unidadMedidaId"] option[value="1"]')).toBeInTheDocument();
    });
    await user.selectOptions(container.querySelector('select[name="unidadMedidaId"]'), "1");
    await user.click(screen.getByRole("button", { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
    });

    expect(onParentSubmit).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
