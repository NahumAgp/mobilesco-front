import { describe, expect, it } from "vitest";
import { agruparPaginasCatalogo, organizarFamiliasCatalogo } from "./catalogoFamilias";

describe("páginas por familia", () => {
  it("pone las familias destacadas primero y ordena las demás por nombre", () => {
    const paginas = organizarFamiliasCatalogo([
      { id: 1, linea: "ESCOLAR", familia: "PUPITRE" },
      { id: 2, linea: "MIXTA", familia: "Bancos" },
      { id: 3, linea: "ESCOLAR", familia: "SILLAS" },
    ], { incluirVacias: true });

    expect(paginas.map((pagina) => pagina.titulo)).toEqual([
      "Sillas escolares", "Mesas escolares", "Mesas mixtas",
      "Pupitres escolares", "Sillas de oficina", "Mesas de oficina", "Bancos mixtos",
    ]);
    expect(paginas.find((pagina) => pagina.slug === "mesas-oficina")?.productos).toEqual([]);
    expect(paginas.find((pagina) => pagina.slug === "sillas-escolares")?.productos).toHaveLength(1);
  });

  it("agrupa las variantes de mesas y sillas bajo una sola categoría", () => {
    const paginas = organizarFamiliasCatalogo([], { incluirVacias: true, familiasActivas: [
      { nombre: "SILLAS", lineaNombre: "ESCOLAR" },
      { nombre: "MESAS", lineaNombre: "ESCOLAR" },
      { nombre: "MESAS", lineaNombre: "MIXTA" },
    ] });

    expect(agruparPaginasCatalogo(paginas).map((grupo) => [grupo.titulo, grupo.paginas.map((pagina) => pagina.titulo)])).toEqual([
      ["Sillas", ["Sillas escolares"]],
      ["Mesas", ["Mesas escolares", "Mesas mixtas"]],
    ]);
  });
});
