import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CargaMasivaProveedoresDialog from "./CargaMasivaProveedoresDialog.jsx";
import { procesarImportacionProveedores } from "../services/proveedores.js";

vi.mock("../services/proveedores.js", () => ({
  descargarPlantillaProveedores: vi.fn(),
  procesarImportacionProveedores: vi.fn(),
}));

describe("carga masiva de proveedores", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra errores por fila e importa solo tras la confirmación", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    procesarImportacionProveedores
      .mockResolvedValueOnce({ validas: 1, errores: 1, importadas: 0, filas: [
        { numero: 2, razonSocial: "Correcto", rfc: "COR010101AAA", errores: [] },
        { numero: 3, razonSocial: "Repetido", rfc: "REP010101AAA", errores: ["RFC duplicado"] },
      ] })
      .mockResolvedValueOnce({ validas: 1, errores: 1, importadas: 1, filas: [
        { numero: 2, razonSocial: "Correcto", rfc: "COR010101AAA", errores: [] },
        { numero: 3, razonSocial: "Repetido", rfc: "REP010101AAA", errores: ["RFC duplicado"] },
      ] });
    render(<CargaMasivaProveedoresDialog onClose={vi.fn()} onImport={onImport} />);
    await user.upload(screen.getByLabelText("Archivo .xlsx"),
      new File(["contenido"], "proveedores.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    await user.click(screen.getByRole("button", { name: "Validar archivo" }));
    expect(await screen.findByText("1 fila válida · 1 con errores")).toBeInTheDocument();
    expect(screen.getByText("RFC duplicado")).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Importar 1 válido" }));
    expect(await screen.findByText("1 importado · 1 rechazado")).toBeInTheDocument();
    expect(onImport).toHaveBeenCalledOnce();
    expect(procesarImportacionProveedores).toHaveBeenNthCalledWith(1, expect.any(File), false);
    expect(procesarImportacionProveedores).toHaveBeenNthCalledWith(2, expect.any(File), true);
  });
});
