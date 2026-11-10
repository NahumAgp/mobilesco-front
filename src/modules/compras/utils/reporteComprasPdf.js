import { formatMoney } from "./money.js";
import { obtenerLogoDocumentoPng } from "../../../utils/documentLogo.js";

const COLUMNAS = [
  { titulo: "ID", ancho: 13, valor: (fila) => String(fila.id ?? "") },
  { titulo: "Folio", ancho: 28, valor: (fila) => fila.folio || "" },
  { titulo: "Fecha", ancho: 23, valor: (fila) => formatearFecha(fila.fechaCompra) },
  { titulo: "Proveedor", ancho: 65, valor: (fila) => fila.proveedorRazonSocial || "" },
  { titulo: "Método de pago", ancho: 45, valor: (fila) => fila.metodoPago || "" },
  { titulo: "Total", ancho: 33, valor: (fila) => formatMoney(fila.total) },
  { titulo: "Estado", ancho: 30, valor: (fila) => fila.estado || "" }
];

function formatearFecha(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function limitarLineas(pdf, value, width) {
  const lines = pdf.splitTextToSize(String(value), width - 3);
  if (lines.length <= 2) return lines;
  const second = lines[1];
  let shortened = second;
  while (shortened.length && pdf.getTextWidth(`${shortened}…`) > width - 3) {
    shortened = shortened.slice(0, -1);
  }
  return [lines[0], `${shortened}…`];
}

export async function crearPdfReporteCompras(filas) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 12;
  const tableWidth = COLUMNAS.reduce((total, column) => total + column.ancho, 0);
  const logo = await obtenerLogoDocumentoPng();
  let y = 0;

  function drawPageHeader() {
    if (logo) pdf.addImage(logo, "PNG", left, 5, 42, 14);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Reporte global de compras", logo ? left + 47 : left, 17);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`${filas.length} compras`, pageWidth - left, 17, { align: "right" });
    pdf.setFillColor(28, 87, 66);
    pdf.rect(left, 23, tableWidth, 10, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    let x = left;
    for (const column of COLUMNAS) {
      pdf.text(column.titulo, x + 1.5, 29.5);
      x += column.ancho;
    }
    pdf.setTextColor(25, 30, 35);
    pdf.setFont("helvetica", "normal");
    y = 33;
  }

  drawPageHeader();
  for (let index = 0; index < filas.length; index++) {
    const fila = filas[index];
    pdf.setFontSize(7.5);
    const cells = COLUMNAS.map((column) => limitarLineas(pdf, column.valor(fila), column.ancho));
    const rowHeight = cells.some((lines) => lines.length > 1) ? 11 : 8;
    if (y + rowHeight > pageHeight - 17) {
      pdf.addPage();
      drawPageHeader();
    }
    if (index % 2 === 1) {
      pdf.setFillColor(244, 247, 245);
      pdf.rect(left, y, tableWidth, rowHeight, "F");
    }
    let x = left;
    cells.forEach((lines, cellIndex) => {
      lines.forEach((line, lineIndex) => pdf.text(line, x + 1.5, y + 5.5 + lineIndex * 3.5));
      x += COLUMNAS[cellIndex].ancho;
    });
    y += rowHeight;
  }

  if (!filas.length) {
    pdf.setFontSize(10);
    pdf.text("No hay compras para los filtros seleccionados.", left + 2, 43);
  }
  const pages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Página ${page} de ${pages}`, pageWidth - left, pageHeight - 8, { align: "right" });
  }
  return pdf.output("blob");
}
