import { API_BASE_URL } from "../config/apiConfig.js";
import { obtenerIdentidadPublica } from "../modules/configuracion/services/configuracionSistema.js";

const LOGO_BASE = "/logo-mobilesco-firmeza.svg";

export async function obtenerLogoDocumentoUrl() {
  try {
    const identidad = await obtenerIdentidadPublica();
    const ruta = identidad?.logoDocumentosUrl;
    if (ruta) return /^https?:\/\//i.test(ruta) ? ruta : `${API_BASE_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
  } catch { /* Se utiliza la marca incluida en el ERP. */ }
  return LOGO_BASE;
}

async function convertirImagen(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("Logo no disponible");
  const temporal = URL.createObjectURL(await respuesta.blob());
  try {
    const imagen = new Image();
    imagen.src = temporal;
    await imagen.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = Math.max(100, Math.round(900 * imagen.height / imagen.width));
    canvas.getContext("2d").drawImage(imagen, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally { URL.revokeObjectURL(temporal); }
}

export async function obtenerLogoDocumentoPng() {
  const elegido = await obtenerLogoDocumentoUrl();
  try { return await convertirImagen(elegido); }
  catch {
    if (elegido === LOGO_BASE) return null;
    try { return await convertirImagen(LOGO_BASE); }
    catch { return null; }
  }
}
