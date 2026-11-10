import { describe, expect, it, vi } from "vitest";
import { crearPdfReporteCompras } from "./reporteComprasPdf.js";

vi.mock("../../../utils/documentLogo.js", () => ({
  obtenerLogoDocumentoPng: vi.fn().mockResolvedValue(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC"
  ),
}));

describe("reporte global de compras en PDF", () => {
  it("genera varias páginas cuando el reporte excede una hoja", async () => {
    const filas = Array.from({ length: 90 }, (_, index) => ({
      id: index + 1,
      folio: `COMP-${index + 1}`,
      fechaCompra: "2026-11-08",
      proveedorRazonSocial: "Proveedor de ejemplo",
      metodoPago: "Transferencia",
      total: 1234.5,
      estado: "RECIBIDA"
    }));

    const pdf = await crearPdfReporteCompras(filas);
    const contenido = await pdf.text();

    expect(pdf.type).toBe("application/pdf");
    expect(contenido.startsWith("%PDF-")).toBe(true);
    expect(contenido.match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(1);
    expect(contenido).toContain("/Subtype /Image");
  });
});
