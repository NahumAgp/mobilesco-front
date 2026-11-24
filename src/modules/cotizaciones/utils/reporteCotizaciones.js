const columnas = ["Folio", "Cliente", "Emisión", "Vencimiento", "Estado", "Total (MXN)"];
const filas = (cotizaciones) => cotizaciones.map((item) => [
  item.folio, item.clienteNombre, item.fechaEmision, item.fechaVencimiento,
  item.estado, Number(item.total || 0),
]);

export function descargarExcelCotizaciones(blob) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `cotizaciones-${new Date().toISOString().slice(0, 10)}.xlsx`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function crearReportePdfCotizaciones(cotizaciones) {
  const fecha = new Date().toISOString().slice(0, 10);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const dibujarEncabezado = () => {
    pdf.setFontSize(16);
    pdf.text("Reporte de cotizaciones", 14, 18);
    pdf.setFontSize(9);
    pdf.text(`Generado: ${fecha} · ${cotizaciones.length} registros`, 14, 25);
    pdf.setFillColor(238, 244, 241);
    pdf.rect(14, 31, 251, 9, "F");
    const x = [16, 53, 125, 159, 196, 263];
    columnas.forEach((titulo, i) => pdf.text(titulo, x[i], 37, i === 5 ? { align: "right" } : undefined));
  };
  dibujarEncabezado();
  let y = 47;
  for (const row of filas(cotizaciones)) {
    if (y > 198) { pdf.addPage(); dibujarEncabezado(); y = 47; }
    const x = [16, 53, 125, 159, 196, 263];
    row.forEach((value, i) => {
      const label = i === 5 ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
        : String(value ?? "");
      pdf.text(i === 1 ? pdf.splitTextToSize(label, 68)[0] : label, x[i], y, i === 5 ? { align: "right" } : undefined);
    });
    pdf.setDrawColor(230, 235, 232);
    pdf.line(14, y + 3, 265, y + 3);
    y += 10;
  }
  return pdf;
}

export async function descargarReporteCotizaciones(cotizaciones) {
  const pdf = await crearReportePdfCotizaciones(cotizaciones);
  pdf.save(`cotizaciones-${new Date().toISOString().slice(0, 10)}.pdf`);
}
