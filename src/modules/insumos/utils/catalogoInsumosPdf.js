import { obtenerBitsEan13 } from "../components/barcode/ean13Utils.js";

const COLUMNAS = 2;
const FILAS = 5;
const POR_PAGINA = COLUMNAS * FILAS;
const MARGEN = 12;
const SEPARACION = 7;
const ALTO_FICHA = 40;
const PASO_FILA = 42;
const INICIO_FICHAS = 44;
const ANCHO_MODULO = 0.69;

const limpiarTexto = (value) => String(value ?? "")
  .replace(/[\u0000-\u001f\u007f]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export function esEan13Valido(value) {
  const codigo = String(value ?? "");
  if (!/^\d{13}$/.test(codigo)) return false;
  const suma = codigo.slice(0, 12).split("").reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0
  );
  return (10 - (suma % 10)) % 10 === Number(codigo[12]);
}

export function agruparInsumosParaCatalogo(insumos, tipos = []) {
  const nombresTipo = new Map(tipos.map((tipo) => [
    limpiarTexto(tipo.codigo).toUpperCase(), limpiarTexto(tipo.nombre)
  ]));
  const grupos = new Map();
  for (const insumo of insumos || []) {
    if (!insumo || insumo.activo === false) continue;
    const tipo = limpiarTexto(insumo.tipoInsumo).toUpperCase();
    const clave = tipo || "SIN_TIPO";
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        codigo: clave,
        nombre: tipo ? (nombresTipo.get(tipo) || tipo.replaceAll("_", " ")) : "Sin tipo asignado",
        insumos: []
      });
    }
    grupos.get(clave).insumos.push(insumo);
  }

  const comparar = new Intl.Collator("es-MX", { sensitivity: "base", numeric: true });
  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      insumos: grupo.insumos.sort((a, b) =>
        comparar.compare(limpiarTexto(a.nombre), limpiarTexto(b.nombre))
        || comparar.compare(limpiarTexto(a.codigo), limpiarTexto(b.codigo)))
    }))
    .sort((a, b) => a.codigo === "SIN_TIPO" ? 1 : b.codigo === "SIN_TIPO" ? -1 : comparar.compare(a.nombre, b.nombre));
}

function textoAjustado(pdf, value, anchoMaximo) {
  let texto = limpiarTexto(value);
  if (pdf.getTextWidth(texto) <= anchoMaximo) return texto;
  while (texto.length > 0 && pdf.getTextWidth(`${texto}...`) > anchoMaximo) {
    texto = texto.slice(0, -1);
  }
  return `${texto.trimEnd()}...`;
}

function dibujarEncabezado(pdf, grupo, paginaSeccion, totalSeccion, totalCatalogo) {
  const ancho = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(35, 75, 68);
  pdf.rect(0, 0, ancho, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(35, 75, 68);
  pdf.text("MOBILESCO  /  INVENTARIO", MARGEN, 17);
  pdf.setFontSize(17);
  pdf.text(grupo.nombre, MARGEN, 27);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(82, 96, 95);
  pdf.text(`${grupo.insumos.length} insumos  |  ${totalCatalogo} en el catálogo  |  Sección ${paginaSeccion} de ${totalSeccion}`, MARGEN, 34);
  pdf.setDrawColor(203, 216, 213);
  pdf.line(MARGEN, 38, ancho - MARGEN, 38);
}

function dibujarFicha(pdf, insumo, x, y, ancho) {
  const codigoBarras = limpiarTexto(insumo.codigoBarras);
  const bits = obtenerBitsEan13(codigoBarras);
  pdf.setDrawColor(211, 222, 219);
  pdf.setLineWidth(0.18);
  pdf.roundedRect(x, y, ancho, ALTO_FICHA, 1.7, 1.7, "S");

  const nombre = limpiarTexto(insumo.nombre) || `Insumo ${insumo.id}`;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.2);
  pdf.setTextColor(28, 46, 43);
  const lineas = pdf.splitTextToSize(nombre, ancho - 10).slice(0, 2);
  if (lineas.length === 2) lineas[1] = textoAjustado(pdf, lineas[1], ancho - 10);
  pdf.text(lineas, x + 4.5, y + 5.3);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(91, 103, 101);
  const codigo = limpiarTexto(insumo.codigo) || `#${insumo.id}`;
  pdf.text(textoAjustado(pdf, `Código: ${codigo}`, ancho - 10), x + 4.5, y + 13.1);

  const anchoBarras = 95 * ANCHO_MODULO;
  const inicioBarras = x + (ancho - anchoBarras) / 2;
  pdf.setFillColor(15, 25, 24);
  for (let index = 0; index < bits.length; index += 1) {
    if (bits[index] !== "1") continue;
    const guarda = index < 3 || (index >= 45 && index < 50) || index >= 92;
    pdf.rect(inicioBarras + index * ANCHO_MODULO, y + 15.1,
      ANCHO_MODULO, guarda ? 19 : 17.5, "F");
  }
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8.8);
  pdf.setTextColor(20, 33, 31);
  pdf.text(codigoBarras, x + ancho / 2, y + 37.5, { align: "center" });
}

export async function crearCatalogoInsumosPdf(insumos, tipos = []) {
  const grupos = agruparInsumosParaCatalogo(insumos, tipos);
  const incluidos = grupos.flatMap((grupo) => grupo.insumos);
  if (incluidos.length === 0) throw new Error("No hay insumos activos para el catálogo.");
  const sinCodigo = incluidos.filter((insumo) => !esEan13Valido(insumo.codigoBarras));
  if (sinCodigo.length > 0) {
    throw new Error(`${sinCodigo.length} insumo(s) no tienen un código de barras EAN-13 válido.`);
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "letter", compress: true });
  pdf.setProperties({ title: "Catálogo de insumos con códigos de barras", subject: "Insumos activos por tipo" });
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const anchoFicha = (anchoPagina - 2 * MARGEN - SEPARACION) / COLUMNAS;
  let pagina = 0;
  for (const grupo of grupos) {
    const paginasSeccion = Math.ceil(grupo.insumos.length / POR_PAGINA);
    for (let paginaSeccion = 0; paginaSeccion < paginasSeccion; paginaSeccion += 1) {
      if (pagina > 0) pdf.addPage();
      pagina += 1;
      dibujarEncabezado(pdf, grupo, paginaSeccion + 1, paginasSeccion, incluidos.length);
      const items = grupo.insumos.slice(paginaSeccion * POR_PAGINA, (paginaSeccion + 1) * POR_PAGINA);
      items.forEach((insumo, index) => {
        const columna = index % COLUMNAS;
        const fila = Math.floor(index / COLUMNAS);
        dibujarFicha(pdf, insumo,
          MARGEN + columna * (anchoFicha + SEPARACION),
          INICIO_FICHAS + fila * PASO_FILA, anchoFicha);
      });
    }
  }

  const totalPaginas = pdf.getNumberOfPages();
  for (let numero = 1; numero <= totalPaginas; numero += 1) {
    pdf.setPage(numero);
    pdf.setDrawColor(203, 216, 213);
    pdf.line(MARGEN, 263, anchoPagina - MARGEN, 263);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(91, 103, 101);
    pdf.text("Imprimir al 100 % para conservar el tamaño del código de barras", MARGEN, 268);
    pdf.text(`${numero} / ${totalPaginas}`, anchoPagina - MARGEN, 268, { align: "right" });
  }
  return { pdf, totalInsumos: incluidos.length, totalSecciones: grupos.length, totalPaginas };
}
