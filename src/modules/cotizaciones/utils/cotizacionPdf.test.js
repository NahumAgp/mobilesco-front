import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../../services/api", () => ({ default: request }));
vi.mock("../../../utils/documentLogo.js", () => ({ obtenerLogoDocumentoPng: vi.fn().mockResolvedValue(null) }));

import { enviarCotizacionWhatsApp } from "./cotizacionPdf.js";

const cotizacion = {
  id: 7, folio: "COT-2026-00007", clienteId: 81, clienteNombre: "Colegio Norte",
  clienteWhatsapp: "4491234567", fechaEmision: "2026-11-23", fechaVencimiento: "2026-12-08",
  detalles: [{ sku: "ESC-001", nombre: "Silla escolar", cantidad: 2, precioUnitario: 100, importe: 200 }],
  subtotalVenta: 200, montoDescuento: 0, flete: 0, ivaPorcentaje: 16, montoIva: 32, total: 232,
};

describe("envío de PDF por WhatsApp", () => {
  beforeEach(() => request.mockReset().mockResolvedValue({ messageId: "wamid-123" }));

  it("adjunta el PDF de la cotización al endpoint de envío", async () => {
    await enviarCotizacionWhatsApp(cotizacion);

    expect(request).toHaveBeenCalledTimes(1);
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("/api/v1/cotizaciones/7/whatsapp");
    expect(options.method).toBe("POST");
    const archivo = options.body.get("archivo");
    expect(archivo.name).toBe("COT-2026-00007.pdf");
    expect(archivo.type).toBe("application/pdf");
    expect(archivo.size).toBeGreaterThan(100);
  });

  it("no intenta enviar una cotización sin número del cliente", async () => {
    await expect(enviarCotizacionWhatsApp({ ...cotizacion, clienteWhatsapp: "" })).rejects.toThrow(/número de WhatsApp/);
    expect(request).not.toHaveBeenCalled();
  });
});
