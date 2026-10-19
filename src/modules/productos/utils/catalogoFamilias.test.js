import { describe, expect, it } from "vitest";
import { organizarFamiliasCatalogo } from "./catalogoFamilias";

describe("páginas por familia", () => {
  it("pone las cinco familias solicitadas primero y ordena las demás por nombre", () => {
    const paginas = organizarFamiliasCatalogo([
      { id: 1, linea: "ESCOLAR", familia: "PUPITRE" },
      { id: 2, linea: "MIXTA", familia: "Bancos" },
      { id: 3, linea: "ESCOLAR", familia: "SILLAS" },
    ], { incluirVacias: true });

    expect(paginas.map((pagina) => pagina.titulo)).toEqual([
      "Sillas escolares", "Sillas de oficina", "Mesas escolares",
      "Mesas de oficina", "Mesas mixtas", "Bancos mixtos", "Pupitres escolares",
    ]);
    expect(paginas.find((pagina) => pagina.slug === "mesas-oficina")?.productos).toEqual([]);
    expect(paginas.find((pagina) => pagina.slug === "sillas-escolares")?.productos).toHaveLength(1);
  });
});
