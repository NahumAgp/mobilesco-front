const compararCatalogo = (a, b) =>
  String(a?.codigo || a?.nombre || "").localeCompare(
    String(b?.codigo || b?.nombre || ""),
    "es",
    { numeric: true, sensitivity: "base" }
  );

export function agruparModelosPorSubfamilia(subfamilias = [], modelos = []) {
  const modelosPorSubfamilia = new Map();
  const idsConocidos = new Set(subfamilias.map((subfamilia) => String(subfamilia.id)));
  const sinSubfamilia = [];

  modelos.forEach((modelo) => {
    const subfamiliaId = modelo.subfamiliaId ?? modelo.subfamilia?.id ?? null;
    const clave = subfamiliaId === null || subfamiliaId === "" ? null : String(subfamiliaId);

    if (!clave || !idsConocidos.has(clave)) {
      sinSubfamilia.push(modelo);
      return;
    }

    const modelosGrupo = modelosPorSubfamilia.get(clave) || [];
    modelosGrupo.push(modelo);
    modelosPorSubfamilia.set(clave, modelosGrupo);
  });

  const grupos = [...subfamilias]
    .sort(compararCatalogo)
    .map((subfamilia) => ({
      subfamilia,
      modelos: (modelosPorSubfamilia.get(String(subfamilia.id)) || []).sort(compararCatalogo)
    }));

  return {
    grupos,
    sinSubfamilia: sinSubfamilia.sort(compararCatalogo)
  };
}
