import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../../services/api", () => ({ default: request }));

import { actualizarCalificacionProveedor } from "./proveedores.js";

describe("servicio de proveedores", () => {
  beforeEach(() => request.mockReset());

  it("actualiza solo la calificacion mediante el endpoint dedicado", async () => {
    request.mockResolvedValue({ id: 12, calificacionProveedor: 87.5 });

    await actualizarCalificacionProveedor(12, 87.5);

    expect(request).toHaveBeenCalledWith("/api/v1/proveedores/12/calificacion", {
      method: "PATCH",
      body: JSON.stringify({ calificacionProveedor: 87.5 })
    });
  });

  it("permite enviar cero porque es una calificacion valida", async () => {
    request.mockResolvedValue({ id: 12, calificacionProveedor: 0 });

    await actualizarCalificacionProveedor(12, 0);

    expect(request).toHaveBeenCalledWith("/api/v1/proveedores/12/calificacion", {
      method: "PATCH",
      body: JSON.stringify({ calificacionProveedor: 0 })
    });
  });
});
