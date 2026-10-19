const DESTACADAS = [
  { linea: "escolar", familia: "sillas", slug: "sillas-escolares", titulo: "Sillas escolares" },
  { linea: "oficina", familia: "sillas", slug: "sillas-oficina", titulo: "Sillas de oficina" },
  { linea: "escolar", familia: "mesas", slug: "mesas-escolares", titulo: "Mesas escolares" },
  { linea: "oficina", familia: "mesas", slug: "mesas-oficina", titulo: "Mesas de oficina" },
  { linea: "mixta", familia: "mesas", slug: "mesas-mixtas", titulo: "Mesas mixtas" },
];

const normalizar = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const slug = (valor) => normalizar(valor).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tituloCaso = (valor) => String(valor).toLocaleLowerCase("es-MX")
  .replace(/(^|\s)\p{L}/gu, (inicio) => inicio.toLocaleUpperCase("es-MX"));

function nombreFamilia(linea, familia) {
  const nombreLinea = normalizar(linea);
  const nombreFamilia = normalizar(familia);
  if (nombreLinea === "escolar" && nombreFamilia === "pupitre") return "Pupitres escolares";
  if (nombreLinea === "mixta" && nombreFamilia === "bancos") return "Bancos mixtos";
  return `${tituloCaso(familia)} · ${tituloCaso(linea)}`;
}

export function organizarFamiliasCatalogo(productos, { incluirVacias = false } = {}) {
  const grupos = new Map();

  productos.forEach((producto) => {
    const linea = String(producto.linea || "Sin línea").trim();
    const familia = String(producto.familia || "Sin familia").trim();
    const clave = `${normalizar(linea)}::${normalizar(familia)}`;
    if (!grupos.has(clave)) grupos.set(clave, { linea, familia, productos: [] });
    grupos.get(clave).productos.push(producto);
  });

  if (incluirVacias) {
    DESTACADAS.forEach(({ linea, familia }) => {
      const clave = `${linea}::${familia}`;
      if (!grupos.has(clave)) grupos.set(clave, { linea, familia, productos: [] });
    });
  }

  return [...grupos.values()]
    .map((grupo) => {
      const destacada = DESTACADAS.find((item) =>
        item.linea === normalizar(grupo.linea) && item.familia === normalizar(grupo.familia)
      );
      const titulo = destacada?.titulo || nombreFamilia(grupo.linea, grupo.familia);
      return {
        ...grupo,
        slug: destacada?.slug || `${slug(grupo.familia)}-${slug(grupo.linea)}`,
        titulo,
        orden: destacada ? DESTACADAS.indexOf(destacada) : DESTACADAS.length,
      };
    })
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" }));
}
