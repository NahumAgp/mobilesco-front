import { describe, expect, it } from "vitest";
import { crearReportePdfCotizaciones } from "./reporteCotizaciones.js";

describe("reporte PDF de cotizaciones", () => {
  it("genera un PDF con todas las filas aunque ocupe varias páginas", async () => {
    const cotizaciones = Array.from({ length: 35 }, (_, i) => ({
      folio: `COT-2026-${String(i + 1).padStart(5, "0")}`,
      clienteNombre: "Colegio Norte", fechaEmision: "2026-11-23",
      fechaVencimiento: "2026-12-08", estado: "PENDIENTE", total: 1500.5,
    }));

    const pdf = await crearReportePdfCotizaciones(cotizaciones);
    const bytes = new Uint8Array(pdf.output("arraybuffer"));

    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  });
});
