import { describe, expect, it } from "vitest";

import { agruparModelosPorSubfamilia } from "./agruparModelosPorSubfamilia.js";

describe("agruparModelosPorSubfamilia", () => {
  it("incluye subfamilias vacias y agrupa sus modelos", () => {
    const subfamilias = [
      { id: 2, codigo: "B", nombre: "Binarios" },
      { id: 1, codigo: "A", nombre: "Apilables" }
    ];
    const modelos = [
      { id: 12, codigo: "M2", subfamiliaId: 2 },
      { id: 11, codigo: "M1", subfamilia: { id: 2 } }
    ];

    const resultado = agruparModelosPorSubfamilia(subfamilias, modelos);

    expect(resultado.grupos.map((grupo) => grupo.subfamilia.id)).toEqual([1, 2]);
    expect(resultado.grupos[0].modelos).toEqual([]);
    expect(resultado.grupos[1].modelos.map((modelo) => modelo.id)).toEqual([11, 12]);
  });

  it("separa modelos sin subfamilia o con una referencia no disponible", () => {
    const resultado = agruparModelosPorSubfamilia(
      [{ id: 1, codigo: "A" }],
      [
        { id: 1, codigo: "LIBRE", subfamiliaId: null },
        { id: 2, codigo: "HUERFANO", subfamiliaId: 99 }
      ]
    );

    expect(resultado.sinSubfamilia.map((modelo) => modelo.id)).toEqual([2, 1]);
  });
});
