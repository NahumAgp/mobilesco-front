import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../../services/api", () => ({ default: request }));

import {
  generarComprasBorrador,
  obtenerSugerenciasAbastecimiento,
} from "./abastecimiento.js";

describe("servicio de abastecimiento asistido", () => {
  beforeEach(() => request.mockReset());

  it("consulta las sugerencias calculadas", async () => {
    request.mockResolvedValue([]);

    await obtenerSugerenciasAbastecimiento();

    expect(request).toHaveBeenCalledWith("/api/v1/abastecimiento/sugerencias");
  });

  it("genera compras en borrador con el contrato esperado", async () => {
    request.mockResolvedValue({ cantidadCompras: 1 });
    const suggestions = [{ insumoId: 8, cantidad: 12.5, proveedorId: 4 }];

    await generarComprasBorrador(suggestions);

    expect(request).toHaveBeenCalledWith("/api/v1/abastecimiento/compras-borrador", {
      method: "POST",
      body: JSON.stringify({ sugerencias: suggestions }),
    });
  });
});
