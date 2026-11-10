import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPurchase,
  createPurchase,
  updatePurchase,
  getProviders,
  getUnits,
  searchInputs,
  getPreviousPrices,
  uploadReceipt,
} = vi.hoisted(() => ({
  getPurchase: vi.fn(),
  createPurchase: vi.fn(),
  updatePurchase: vi.fn(),
  getProviders: vi.fn(),
  getUnits: vi.fn(),
  searchInputs: vi.fn(),
  getPreviousPrices: vi.fn(),
  uploadReceipt: vi.fn(),
}));

vi.mock("../services/compras.js", () => ({
  obtenerCompraPorId: getPurchase,
  crearCompra: createPurchase,
  actualizarCompra: updatePurchase,
  obtenerPreciosAnterioresCompra: getPreviousPrices,
  subirComprobanteCompra: uploadReceipt,
}));

vi.mock("../../proveedores/services/proveedores.js", () => ({
  obtenerProveedores: getProviders,
}));

vi.mock("../../unidades-medida/services/unidadMedidas.js", () => ({
  obtenerUnidadesMedida: getUnits,
}));

vi.mock("../../insumos/services/insumos.js", () => ({
  buscarInsumos: searchInputs,
}));

vi.mock("../../proveedores/pages/ProveedorModal.jsx", () => ({ default: () => null }));
vi.mock("../../insumos/pages/InsumoForm.jsx", () => ({ default: () => null }));

vi.mock("../../../components/ui/SearchableSelect.jsx", () => ({
  default: ({ label, value, options = [], onChange, onSearchChange, searchPlaceholder, getOptionValue, getOptionLabel }) => (
    <label>
      {label || (onSearchChange ? "Insumo" : "Proveedor")}
      {onSearchChange && <input placeholder={searchPlaceholder} onChange={(event) => onSearchChange(event.target.value)} />}
      <select
        aria-label={label || (onSearchChange ? "Insumo" : "Proveedor")}
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value, options.find((option) => String(getOptionValue(option)) === event.target.value))}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import CompraForm from "./CompraForm.jsx";

const draft = {
  id: 10,
  folio: "BOR-0010",
  fechaCompra: "2026-08-17",
  fechaRecepcion: null,
  proveedorId: 4,
  metodoPago: null,
  subtotal: 0,
  impuesto: 0,
  total: 0,
  observaciones: "Compra sugerida por inventario",
  estado: "BORRADOR",
  activo: true,
  comprobanteId: "comprobante-existente",
  comprobanteNombre: "factura.pdf",
  detalles: [{
    id: 101,
    compraId: 10,
    insumoId: 8,
    insumoNombre: "Tela exterior",
    insumoDescripcion: "Tela para sillón",
    unidadConsumoId: 2,
    unidadConsumoNombre: "Metro",
    unidadConsumoSimbolo: "m",
    unidadCompraId: 2,
    unidadCompraNombre: "Metro",
    unidadCompraSimbolo: "m",
    cantidad: 18,
    factorConversion: 1,
    cantidadRecibida: 0,
    cantidadEnUnidadConsumo: 0,
    cantidadPendiente: 18,
    precioUnitario: 0,
    costoPorUnidadConsumo: 0,
    subtotal: 0,
    observaciones: "",
    fechaRegistro: "2026-08-17T10:00:00",
  }],
};

describe("CompraForm en edición por compraId", () => {
  beforeEach(() => {
    getPurchase.mockReset();
    createPurchase.mockReset();
    updatePurchase.mockReset();
    getProviders.mockReset();
    getUnits.mockReset();
    searchInputs.mockReset();
    getPreviousPrices.mockReset();
    uploadReceipt.mockReset();
    getPreviousPrices.mockResolvedValue({});
    getProviders.mockResolvedValue([{ id: 4, razonSocial: "Textiles Norte" }]);
    getUnits.mockResolvedValue([{ id: 2, nombre: "Metro", simbolo: "m" }]);
    searchInputs.mockResolvedValue([]);
  });

  it("carga un BORRADOR editable, valida método y precio, y envía detalles limpios", async () => {
    const user = userEvent.setup();
    getPurchase.mockResolvedValue(draft);
    updatePurchase.mockResolvedValue({ ...draft, metodoPago: "EFECTIVO" });

    render(
      <MemoryRouter>
        <CompraForm compraId="10" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cargando compra…")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("BOR-0010")).toBeInTheDocument();
    expect(screen.queryByText(/no puede ser editada/i)).not.toBeInTheDocument();
    expect(screen.getByText("Tela exterior")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    expect(screen.getByText("Selecciona un metodo de pago")).toBeInTheDocument();
    expect(screen.getByText("Asigna un precio mayor a cero a Tela exterior")).toBeInTheDocument();
    expect(updatePurchase).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Metodo de pago *"), "EFECTIVO");
    await user.click(screen.getByRole("button", { name: "Editar detalle de Tela exterior" }));
    const priceInput = screen.getByLabelText("Precio unitario de Tela exterior");
    await user.clear(priceInput);
    await user.type(priceInput, "42.5");
    await user.click(screen.getByRole("button", { name: "Guardar detalle de Tela exterior" }));
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(updatePurchase).toHaveBeenCalledTimes(1));
    const [purchaseId, payload] = updatePurchase.mock.calls[0];
    expect(purchaseId).toBe("10");
    expect(payload).toEqual(expect.objectContaining({
      folio: "BOR-0010",
      estado: "BORRADOR",
      metodoPago: "EFECTIVO",
      subtotal: 765,
      total: 765,
      detalles: [{
        insumoId: 8,
        unidadCompraId: 2,
        cantidad: 18,
        factorConversion: 1,
        precioUnitario: 42.5,
        subtotal: 765,
        observaciones: "",
      }],
    }));
    expect(payload.detalles[0]).not.toHaveProperty("cantidadPendiente");
    expect(payload.detalles[0]).not.toHaveProperty("fechaRegistro");
    expect(createPurchase).not.toHaveBeenCalled();
  });

  it("edita una compra PENDIENTE enviando partidas e importes coherentes", async () => {
    const user = userEvent.setup();
    const pendiente = {
      ...draft,
      estado: "PENDIENTE",
      metodoPago: "EFECTIVO",
      subtotal: 180,
      total: 180,
      detalles: [{
        ...draft.detalles[0],
        cantidad: 4,
        precioUnitario: 45,
        subtotal: 180,
      }],
    };
    getPurchase.mockResolvedValue(pendiente);
    updatePurchase.mockResolvedValue(pendiente);

    render(
      <MemoryRouter>
        <CompraForm compraId="10" />
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue("BOR-0010")).toBeInTheDocument();
    expect(screen.queryByText(/no puede ser editada/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar Cambios" }));

    await waitFor(() => expect(updatePurchase).toHaveBeenCalledTimes(1));
    expect(updatePurchase).toHaveBeenCalledWith("10", expect.objectContaining({
      estado: "PENDIENTE",
      subtotal: 180,
      total: 180,
      detalles: [expect.objectContaining({
        insumoId: 8,
        cantidad: 4,
        precioUnitario: 45,
        subtotal: 180,
      })],
    }));
  });

  it("solicita confirmación antes de registrar un precio distinto y conserva el formulario al cancelar", async () => {
    const user = userEvent.setup();
    searchInputs.mockResolvedValue([{
      id: 8, nombre: "Tela exterior", unidadMedida: { id: 2, nombre: "Metro", simbolo: "m" },
    }]);
    getPreviousPrices.mockResolvedValue({
      8: { insumoId: 8, insumoNombre: "Tela exterior", precioUnitario: 40, factorConversion: 1, unidadCompraSimbolo: "m" },
    });
    createPurchase.mockResolvedValue({ id: 20 });
    uploadReceipt.mockResolvedValue({ id: "comprobante-nuevo", nombre: "factura.pdf" });

    render(<MemoryRouter><CompraForm /></MemoryRouter>);
    expect(screen.queryByPlaceholderText("Ej: COMP-001")).not.toBeInTheDocument();
    await user.upload(screen.getByLabelText("Imagen o PDF del comprobante *"),
      new File(["%PDF-1.4\n%%EOF"], "factura.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(uploadReceipt).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Comprobante cargado:/)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Ej: COMP-001"), "CMP-20");
    await user.selectOptions(screen.getByLabelText("Metodo de pago *"), "EFECTIVO");
    await user.type(screen.getByPlaceholderText("Escribe para consultar el catálogo"), "Tela");
    await waitFor(() => expect(searchInputs).toHaveBeenCalled());
    await user.selectOptions(screen.getByRole("combobox", { name: "Buscar insumo" }), "8");
    await user.type(screen.getByRole("textbox", { name: "Cantidad del nuevo detalle" }), "2");
    await user.type(screen.getByRole("textbox", { name: "Precio unitario del nuevo detalle" }), "42");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    const advertencia = (await screen.findByText(/El precio de Tela exterior cambió/)).closest('[role="alert"]');
    expect(advertencia).toHaveTextContent("El precio de Tela exterior cambió");
    expect(advertencia).toHaveTextContent("$40.00");
    expect(advertencia).toHaveTextContent("$42.00");
    expect(createPurchase).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Guardar Compra" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Confirmar cambio de precio" });
    expect(dialog).toHaveTextContent("Tela exterior");
    expect(dialog).toHaveTextContent("$40.00");
    expect(dialog).toHaveTextContent("$42.00");
    expect(createPurchase).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Corregir compra" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("CMP-20")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar Compra" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar y guardar" }));
    await waitFor(() => expect(createPurchase).toHaveBeenCalledTimes(1));
    expect(createPurchase).toHaveBeenCalledWith(expect.objectContaining({
      comprobanteId: "comprobante-nuevo",
      detalles: [expect.objectContaining({ insumoId: 8, precioUnitario: 42 })],
    }));
  });

  it("conserva la pantalla de carga si falla el comprobante y permite reintentar", async () => {
    const user = userEvent.setup();
    uploadReceipt.mockRejectedValueOnce(new Error("Carga fallida"))
      .mockResolvedValueOnce({ id: "comprobante-reintento", nombre: "factura.pdf" });
    render(<MemoryRouter><CompraForm /></MemoryRouter>);
    const selector = screen.getByLabelText("Imagen o PDF del comprobante *");
    await user.upload(selector, new File(["%PDF-1.4"], "factura.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("Carga fallida")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ej: COMP-001")).not.toBeInTheDocument();
    expect(createPurchase).not.toHaveBeenCalled();
    await user.upload(selector, new File(["%PDF-1.4"], "factura.pdf", { type: "application/pdf" }));
    expect(await screen.findByPlaceholderText("Ej: COMP-001")).toBeInTheDocument();
  });

  it("solicita comprobante para editar un borrador sin archivo", async () => {
    const user = userEvent.setup();
    getPurchase.mockResolvedValue({ ...draft, comprobanteId: null, comprobanteNombre: null });
    uploadReceipt.mockResolvedValue({ id: "comprobante-borrador", nombre: "factura.pdf" });
    render(<MemoryRouter><CompraForm compraId="10" /></MemoryRouter>);

    expect(await screen.findByLabelText("Imagen o PDF del comprobante *")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar Cambios" })).not.toBeInTheDocument();
    await user.upload(screen.getByLabelText("Imagen o PDF del comprobante *"),
      new File(["%PDF-1.4\n%%EOF"], "factura.pdf", { type: "application/pdf" }));
    expect(await screen.findByRole("button", { name: "Guardar Cambios" })).toBeInTheDocument();
  });
});
