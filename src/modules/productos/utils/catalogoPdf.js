import { organizarFamiliasCatalogo } from "./catalogoFamilias.js";
import { getColorRgb, listarColoresModelo } from "./catalogoColores.js";
import { obtenerIdentidadPublica } from "../../configuracion/services/configuracionSistema.js";
import { API_BASE_URL } from "../../../config/apiConfig.js";

const VERDE = [36, 70, 63];
const VERDE_CLARO = [85, 122, 108];
const NARANJA = [211, 128, 63];
const BEIGE = [239, 229, 223];
const TINTA = [43, 73, 67];
const GRIS = [91, 99, 97];
const ANCHO = 215.9;
const ALTO = 279.4;
const PRODUCTOS_POR_PAGINA = 4;

const texto = (valor, alternativa = "") => String(valor ?? "").trim() || alternativa;

export function prepararPaginasCatalogo(productos) {
  return organizarFamiliasCatalogo(productos.filter((producto) => producto.activo && producto.id))
    .flatMap(({ titulo, productos: items }) => {
      const grupos = new Map();
      items.forEach((producto) => {
        const modeloKey = texto(producto.modeloId) || texto(producto.modelo) || `producto-${producto.id}`;
        if (!grupos.has(modeloKey)) grupos.set(modeloKey, []);
        grupos.get(modeloKey).push(producto);
      });
      const ordenados = [...grupos.values()]
        .map((variantes) => ({
          nombre: texto(variantes[0].modelo) || texto(variantes[0].nombre, "Modelo Mobilesco"),
          descripcion: variantes.find((variante) => variante.descripcion)?.descripcion || "",
          imagenUrl: variantes.find((variante) => variante.modeloImagenUrl)?.modeloImagenUrl
            || variantes.find((variante) => variante.imagenUrl)?.imagenUrl || "",
          colores: listarColoresModelo(variantes),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }));
      const paginas = [];
      for (let inicio = 0; inicio < ordenados.length; inicio += PRODUCTOS_POR_PAGINA) {
        paginas.push({ linea: titulo, productos: ordenados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA) });
      }
      return paginas;
    });
}

async function cargarImagen(url, fondoBlanco = true) {
  if (!url) return null;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`No se pudo cargar la imagen (${response.status})`);
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const imagen = new Image();
    imagen.src = objectUrl;
    await imagen.decode();
    const escala = Math.min(1, 1000 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const contexto = canvas.getContext("2d");
    if (fondoBlanco) {
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, canvas.width, canvas.height);
    }
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL(fondoBlanco ? "image/jpeg" : "image/png", fondoBlanco ? 0.78 : undefined),
      tipo: fondoBlanco ? "JPEG" : "PNG",
      ancho: canvas.width,
      alto: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function dibujarImagenContenida(pdf, imagen, x, y, ancho, alto) {
  const escala = Math.min(ancho / imagen.ancho, alto / imagen.alto);
  const imagenAncho = imagen.ancho * escala;
  const imagenAlto = imagen.alto * escala;
  pdf.addImage(imagen.data, imagen.tipo, x + (ancho - imagenAncho) / 2,
    y + (alto - imagenAlto) / 2, imagenAncho, imagenAlto);
}

function lineasLimitadas(pdf, contenido, ancho, maximo) {
  const lineas = pdf.splitTextToSize(texto(contenido), ancho);
  if (lineas.length <= maximo) return lineas;
  const visibles = lineas.slice(0, maximo);
  visibles[maximo - 1] = `${visibles[maximo - 1].replace(/[.,;: ]+$/, "")}...`;
  return visibles;
}

function dibujarPortada(pdf, cantidad, fecha) {
  pdf.setFillColor(...VERDE);
  pdf.rect(0, 0, ANCHO, ALTO, "F");
  pdf.setDrawColor(...VERDE_CLARO);
  pdf.setLineWidth(4);
  pdf.line(-10, 52, 42, 0);
  pdf.line(4, 63, 55, 0);
  pdf.line(ANCHO - 64, ALTO, ANCHO, ALTO - 62);
  pdf.line(ANCHO - 45, ALTO, ANCHO, ALTO - 44);
  pdf.setFillColor(...NARANJA);
  pdf.circle(29, 45, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(25);
  pdf.text("Mobilesco", 23, 58);
  pdf.setFontSize(44);
  pdf.text("Catálogo", 23, 135);
  pdf.text("visual", 23, 153);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text("Mobiliario para aprender, trabajar y crear.", 24, 169);
  pdf.setDrawColor(...NARANJA);
  pdf.setLineWidth(1.5);
  pdf.line(24, 181, 87, 181);
  pdf.setFontSize(9);
  pdf.text(`${cantidad} modelos  |  ${fecha}`, 24, 192);
  pdf.text("Edición digital del catálogo Mobilesco", 24, 258);
}

function dibujarBaseInterior(pdf, linea, numeroPagina, logo) {
  pdf.setFillColor(...BEIGE);
  pdf.rect(0, 0, ANCHO, ALTO, "F");
  pdf.setFillColor(...VERDE_CLARO);
  pdf.circle(ANCHO + 3, -7, 28, "F");
  pdf.setFillColor(...VERDE);
  pdf.circle(-6, ALTO + 5, 25, "F");
  pdf.setFillColor(...NARANJA);
  pdf.circle(ANCHO + 4, ALTO + 7, 25, "F");
  pdf.setDrawColor(250, 246, 243);
  pdf.setLineWidth(2);
  pdf.line(13, 18, 37, 42);
  pdf.line(22, 10, 48, 36);
  if (logo) dibujarImagenContenida(pdf, logo, 166, 7, 39, 15);
  else {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...VERDE);
    pdf.setFontSize(15);
    pdf.text("Mobilesco", 166, 18);
  }
  pdf.setTextColor(...NARANJA);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("CATÁLOGO MOBILESCO", 15, 32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(linea.length > 20 ? 27 : 36);
  pdf.text(lineasLimitadas(pdf, linea, 185, 1), 15, 55);
  pdf.setTextColor(...TINTA);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`Catálogo Mobilesco  -  ${numeroPagina}`, 15, ALTO - 9);
}

function dibujarColores(pdf, colores, x, y, ancho) {
  pdf.setTextColor(...GRIS);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text("COLORES", x, y);
  const visibles = colores.slice(0, Math.floor((ancho - 5) / 7));
  visibles.forEach((color, indice) => {
    pdf.setFillColor(...getColorRgb({ colorHex: color.hex }));
    pdf.setDrawColor(174, 183, 179);
    pdf.setLineWidth(0.25);
    pdf.circle(x + 2.6 + indice * 7, y + 7, 2.6, "FD");
  });
  if (colores.length > visibles.length) {
    pdf.setTextColor(...GRIS);
    pdf.setFont("helvetica", "normal");
    pdf.text(`+${colores.length - visibles.length}`, x + visibles.length * 7 + 1, y + 8);
  }
}

function dibujarTarjeta(pdf, producto, imagen, x, y) {
  const ancho = 90;
  const alto = 88;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, ancho, alto, 8, 8, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...NARANJA);
  pdf.setFontSize(7.5);
  pdf.text("MODELO MOBILESCO", x + 7, y + 9);
  if (imagen) dibujarImagenContenida(pdf, imagen, x + 8, y + 13, ancho - 16, 38);
  else {
    pdf.setFillColor(246, 241, 238);
    pdf.roundedRect(x + 8, y + 14, ancho - 16, 38, 3, 3, "F");
    pdf.setTextColor(136, 145, 141);
    pdf.setFontSize(8);
    pdf.text("Imagen no disponible", x + ancho / 2, y + 36, { align: "center" });
  }
  pdf.setTextColor(...TINTA);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(lineasLimitadas(pdf, producto.nombre, ancho - 14, 2), x + 7, y + 61);
  dibujarColores(pdf, producto.colores, x + 7, y + 73, ancho - 14);
}

function dibujarTarjetaHorizontal(pdf, producto, imagen, x, y, alto) {
  const ancho = 186;
  const imagenAncho = alto > 100 ? 111 : 99;
  const textoX = x + imagenAncho + 17;
  const textoAncho = ancho - imagenAncho - 26;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, ancho, alto, 8, 8, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...NARANJA);
  pdf.setFontSize(8);
  pdf.text("MODELO MOBILESCO", x + 8, y + 10);
  if (imagen) dibujarImagenContenida(pdf, imagen, x + 8, y + 15, imagenAncho - 8, alto - 22);
  else {
    pdf.setFillColor(246, 241, 238);
    pdf.roundedRect(x + 8, y + 15, imagenAncho - 8, alto - 22, 3, 3, "F");
    pdf.setTextColor(136, 145, 141);
    pdf.setFontSize(8);
    pdf.text("Imagen no disponible", x + imagenAncho / 2, y + alto / 2, { align: "center" });
  }
  pdf.setTextColor(...TINTA);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(alto > 100 ? 16 : 12);
  pdf.text(lineasLimitadas(pdf, producto.nombre, textoAncho, 3), textoX,
    y + (alto > 100 ? 45 : 31));
  pdf.setTextColor(...GRIS);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(alto > 100 ? 9 : 8);
  pdf.text(lineasLimitadas(pdf, producto.descripcion, textoAncho, alto > 100 ? 5 : 2),
    textoX, y + (alto > 100 ? 85 : 52));
  dibujarColores(pdf, producto.colores, textoX, y + (alto > 100 ? 119 : 67), textoAncho);
}

function dibujarContraportada(pdf, fecha, urlCatalogo, logo) {
  pdf.setFillColor(...BEIGE);
  pdf.rect(0, 0, ANCHO, ALTO, "F");
  pdf.setFillColor(...VERDE);
  pdf.circle(ANCHO + 8, ALTO + 8, 62, "F");
  pdf.setFillColor(...NARANJA);
  pdf.circle(-7, -8, 37, "F");
  if (logo) dibujarImagenContenida(pdf, logo, 64, 34, 88, 38);
  else {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...VERDE);
    pdf.setFontSize(28);
    pdf.text("Mobilesco", ANCHO / 2, 57, { align: "center" });
  }
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...VERDE);
  pdf.setFontSize(28);
  pdf.text("Elige tu modelo.", ANCHO / 2, 128, { align: "center" });
  pdf.text("Cotiza en línea.", ANCHO / 2, 143, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text("Explora materiales, niveles y colores en el catálogo visual.", ANCHO / 2, 162, { align: "center" });
  if (urlCatalogo) {
    pdf.setTextColor(...NARANJA);
    pdf.setFontSize(10);
    pdf.text(urlCatalogo, ANCHO / 2, 186, { align: "center" });
    pdf.link(27, 177, ANCHO - 54, 16, { url: urlCatalogo });
  }
  pdf.setTextColor(...GRIS);
  pdf.setFontSize(8);
  pdf.text(`Generado el ${fecha}`, ANCHO / 2, 251, { align: "center" });
}

export async function crearPdfCatalogo(productos, { urlCatalogo = "", fecha = new Date() } = {}) {
  const paginas = prepararPaginasCatalogo(productos);
  if (!paginas.length) throw new Error("No hay productos activos para incluir en el catálogo.");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "letter", compress: true });
  let identidad = { nombreEmpresa: "Mobilesco", logoCatalogoUrl: "" };
  try { identidad = { ...identidad, ...await obtenerIdentidadPublica() }; } catch { /* El PDF conserva la marca base si no hay conexión. */ }
  pdf.setProperties({ title: `Catálogo visual ${identidad.nombreEmpresa}`, author: identidad.nombreEmpresa });
  const fechaTexto = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(fecha);
  const logoPersonalizado = identidad.logoCatalogoUrl || identidad.logoDocumentosUrl;
  const logoUrl = logoPersonalizado
    ? `${API_BASE_URL}${logoPersonalizado}`
    : "/logo-mobilesco-firmeza.svg";
  const logo = await cargarImagen(logoUrl, false).catch(() => null);
  const imagenes = new Map();
  let imagenesOmitidas = 0;

  dibujarPortada(pdf, paginas.reduce((total, pagina) => total + pagina.productos.length, 0), fechaTexto);
  for (let indice = 0; indice < paginas.length; indice += 1) {
    const pagina = paginas[indice];
    pdf.addPage();
    dibujarBaseInterior(pdf, pagina.linea, indice + 1, logo);
    const imagenesPagina = await Promise.all(pagina.productos.map(async (producto) => {
      if (!producto.imagenUrl) return null;
      if (!imagenes.has(producto.imagenUrl)) {
        imagenes.set(producto.imagenUrl, cargarImagen(producto.imagenUrl).catch(() => null));
      }
      return imagenes.get(producto.imagenUrl);
    }));
    pagina.productos.forEach((producto, posicion) => {
      const imagen = imagenesPagina[posicion];
      if (producto.imagenUrl && !imagen) imagenesOmitidas += 1;
      if (pagina.productos.length === 1) {
        dibujarTarjetaHorizontal(pdf, producto, imagen, 15, 72, 168);
      } else if (pagina.productos.length === 2) {
        dibujarTarjetaHorizontal(pdf, producto, imagen, 15, posicion === 0 ? 70 : 159, 83);
      } else if (pagina.productos.length === 3 && posicion === 0) {
        dibujarTarjetaHorizontal(pdf, producto, imagen, 15, 70, 83);
      } else {
        const posicionCuadricula = pagina.productos.length === 3 ? posicion - 1 : posicion;
        dibujarTarjeta(pdf, producto, imagen, posicionCuadricula % 2 === 0 ? 15 : 111,
          pagina.productos.length === 3 ? 161 : (posicionCuadricula < 2 ? 70 : 162));
      }
    });
  }
  pdf.addPage();
  dibujarContraportada(pdf, fechaTexto, urlCatalogo, logo);
  return { blob: pdf.output("blob"), paginas: paginas.length + 2, imagenesOmitidas };
}

export async function descargarPdfCatalogo(productos, opciones) {
  const resultado = await crearPdfCatalogo(productos, opciones);
  const url = URL.createObjectURL(resultado.blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "Catalogo_Mobilesco.pdf";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return resultado;
}

