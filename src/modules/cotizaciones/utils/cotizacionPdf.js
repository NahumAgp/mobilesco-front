import { obtenerLogoDocumentoPng } from "../../../utils/documentLogo.js";

const moneda = (valor) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor || 0));

export async function crearPdfCotizacion(cotizacion) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "letter" });
  const verde = [21, 79, 67];
  const logo = await obtenerLogoDocumentoPng();
  if (logo) pdf.addImage(logo, "PNG", 14, 10, 54, 18);
  else {
    pdf.setFontSize(18);
    pdf.setTextColor(...verde);
    pdf.text("MOBILESCO", 14, 20);
  }

  pdf.setFillColor(...verde);
  pdf.rect(145, 0, 71, 36, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text("COTIZACIÓN", 154, 17);
  pdf.setFontSize(10);
  pdf.text(cotizacion.folio, 154, 25);
  pdf.setTextColor(35, 35, 35);
  pdf.setFontSize(10);
  pdf.text(`Cliente: ${cotizacion.clienteNombre}`, 14, 44);
  pdf.text(`Emisión: ${cotizacion.fechaEmision}`, 14, 50);
  pdf.text(`Vigencia: ${cotizacion.fechaVencimiento}`, 88, 50);

  let y = 61;
  const encabezado = () => {
    pdf.setFillColor(238, 244, 241);
    pdf.rect(14, y, 188, 8, "F");
    pdf.setFont(undefined, "bold");
    pdf.text("Cantidad", 16, y + 5.5);
    pdf.text("Producto", 39, y + 5.5);
    pdf.setFontSize(9);
    pdf.text("Precio unitario", 174, y + 5.5, { align: "right" });
    pdf.text("Importe", 200, y + 5.5, { align: "right" });
    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    y += 10;
  };
  encabezado();

  cotizacion.detalles.forEach((item) => {
    if (y > 238) {
      pdf.addPage();
      if (logo) pdf.addImage(logo, "PNG", 14, 8, 42, 14);
      y = 29;
      encabezado();
    }
    const nombre = `${item.sku} · ${item.nombre}`;
    const lineas = pdf.splitTextToSize(nombre, 102);
    pdf.text(String(item.cantidad), 25, y + 4, { align: "center" });
    pdf.text(lineas, 39, y + 4);
    pdf.text(moneda(item.precioUnitario), 174, y + 4, { align: "right" });
    pdf.text(moneda(item.importe), 200, y + 4, { align: "right" });
    y += Math.max(9, lineas.length * 5 + 3);
    pdf.setDrawColor(225, 225, 225);
    pdf.line(14, y, 202, y);
  });

  y = Math.max(y + 8, 170);
  if (y > 226) {
    pdf.addPage();
    if (logo) pdf.addImage(logo, "PNG", 14, 8, 42, 14);
    y = 29;
  }
  const total = (label, valor, bold = false) => {
    pdf.setFont(undefined, bold ? "bold" : "normal");
    pdf.text(label, 145, y);
    pdf.text(moneda(valor), 200, y, { align: "right" });
    y += 7;
  };
  total("Subtotal", cotizacion.subtotalVenta);
  if (Number(cotizacion.montoDescuento) > 0) total("Descuento", -cotizacion.montoDescuento);
  if (Number(cotizacion.flete) > 0) total("Flete", cotizacion.flete);
  total(`IVA (${cotizacion.ivaPorcentaje}%)`, cotizacion.montoIva);
  pdf.setDrawColor(...verde);
  pdf.line(144, y - 4, 202, y - 4);
  pdf.setTextColor(...verde);
  pdf.setFontSize(14);
  total("TOTAL", cotizacion.total, true);
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  if (cotizacion.condiciones) pdf.text(pdf.splitTextToSize(`Condiciones: ${cotizacion.condiciones}`, 120), 14, y + 4);
  pdf.text("Precios expresados en moneda nacional. Gracias por su preferencia.", 14, 268);
  return pdf.output("blob");
}

export async function descargarPdfCotizacion(cotizacion) {
  const blob = await crearPdfCotizacion(cotizacion);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${cotizacion.folio}.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function compartirCotizacionWhatsApp(cotizacion) {
  const blob = await crearPdfCotizacion(cotizacion);
  const file = new File([blob], `${cotizacion.folio}.pdf`, { type: "application/pdf" });
  const text = `Hola ${cotizacion.clienteNombre}, compartimos la cotización ${cotizacion.folio} por ${moneda(cotizacion.total)}.`;
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: cotizacion.folio, text, files: [file] });
    return "COMPARTIDO";
  }
  await descargarPdfCotizacion(cotizacion);
  const telefono = String(cotizacion.clienteWhatsapp || "").replace(/\D/g, "");
  window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(`${text}\nEl PDF se descargó para adjuntarlo.`)}`, "_blank", "noopener");
  return "DESCARGADO";
}
