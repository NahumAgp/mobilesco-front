import { describe, expect, it } from "vitest";
import { agruparInsumosParaCatalogo, crearCatalogoInsumosPdf, esEan13Valido } from "./catalogoInsumosPdf.js";

const codigoBarras = (id) => {
  const base = `750${String(id).padStart(9, "0")}`;
  const suma = [...base].reduce((total, digito, index) => total + Number(digito) * (index % 2 ? 3 : 1), 0);
  return `${base}${(10 - suma % 10) % 10}`;
};

describe("catálogo PDF de insumos", () => {
  it("agrupa los insumos activos por nombre de tipo y deja los sin tipo al final", () => {
    const grupos = agruparInsumosParaCatalogo([
      { id: 1, nombre: "Zinc", tipoInsumo: "HE", activo: true },
      { id: 2, nombre: "Bisagra", tipoInsumo: "HE", activo: true },
      { id: 3, nombre: "Tela", tipoInsumo: "", activo: true },
      { id: 4, nombre: "Inactivo", tipoInsumo: "HE", activo: false }
    ], [{ codigo: "HE", nombre: "Herrajes" }]);

    expect(grupos.map((grupo) => grupo.nombre)).toEqual(["Herrajes", "Sin tipo asignado"]);
    expect(grupos[0].insumos.map((insumo) => insumo.nombre)).toEqual(["Bisagra", "Zinc"]);
    expect(grupos.flatMap((grupo) => grupo.insumos)).toHaveLength(3);
  });

  it("genera páginas por sección con códigos EAN-13 válidos", async () => {
    const insumos = Array.from({ length: 11 }, (_, index) => ({
      id: index + 1,
      nombre: `Insumo ${index + 1}`,
      codigo: `INS-${index + 1}`,
      codigoBarras: codigoBarras(index + 1),
      tipoInsumo: "HE",
      activo: true
    }));
    insumos.push({ id: 14, nombre: "Tela", codigo: "TEL-1", codigoBarras: codigoBarras(14), tipoInsumo: "T", activo: true });
    const resultado = await crearCatalogoInsumosPdf(insumos, [
      { codigo: "HE", nombre: "Herrajes" }, { codigo: "T", nombre: "Tapicería" }
    ]);

    expect(resultado.totalInsumos).toBe(12);
    expect(resultado.totalSecciones).toBe(2);
    expect(resultado.totalPaginas).toBe(3);
    expect(resultado.pdf.output()).toMatch(/^%PDF-/);
    expect(esEan13Valido(codigoBarras(14))).toBe(true);
  });

  it("detiene la descarga si algún insumo carece de un código escaneable", async () => {
    await expect(crearCatalogoInsumosPdf([
      { id: 620, nombre: "Concha", codigoBarras: null, activo: true }
    ])).rejects.toThrow(/EAN-13 válido/);
    expect(esEan13Valido("7500000006200")).toBe(false);
  });
});
