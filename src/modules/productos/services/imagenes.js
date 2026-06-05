import request, { API_BASE_URL } from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const normalizarProductoId = (data = {}) => data.productoId ?? null;

const normalizarImagen = (imagen) => {
  if (!imagen || typeof imagen !== "object") return imagen;
  if (imagen.productoId !== undefined) {
    return imagen;
  }

  return imagen;
};

const normalizarRespuestaImagen = (respuesta) => {
  if (Array.isArray(respuesta)) {
    return respuesta.map(normalizarImagen);
  }

  return normalizarImagen(respuesta);
};

export function subirImagenArchivo({ archivo, productoId, esPrincipal, orden, altTexto }) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const idProducto = normalizarProductoId({ productoId });
  if (!idProducto) {
    throw new Error("productoId es requerido para subir una imagen");
  }
  formData.append("productoId", String(idProducto));

  if (typeof esPrincipal === "boolean") {
    formData.append("esPrincipal", String(esPrincipal));
  }
  if (typeof orden === "number") {
    formData.append("orden", String(orden));
  }
  if (altTexto) {
    formData.append("altTexto", altTexto);
  }

  return request(`${API_PATHS.IMAGENES}/upload`, {
    method: "POST",
    body: formData
  }).then(normalizarRespuestaImagen);
}

export function subirImagenProducto(productoId, archivo, { esPrincipal = false, orden = 0, altTexto = "" } = {}) {
  return subirImagenArchivo({
    archivo,
    productoId,
    esPrincipal,
    orden,
    altTexto
  });
}

export function crearImagen(data) {
  const payload = { ...data };
  if (payload.productoId === undefined || payload.productoId === null || payload.productoId === "") {
    throw new Error("productoId es requerido para crear una imagen");
  }

  return request(API_PATHS.IMAGENES, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(normalizarRespuestaImagen);
}

export function obtenerImagenesPorProducto(productoId) {
  return request(`${API_PATHS.IMAGENES}/producto/${productoId}`).then(normalizarRespuestaImagen);
}

export function obtenerImagenPrincipalPorProducto(productoId) {
  return request(`${API_PATHS.IMAGENES}/producto/${productoId}/principal`).then(normalizarRespuestaImagen);
}

export function obtenerImagenPorId(id) {
  return request(`${API_PATHS.IMAGENES}/${id}`).then(normalizarRespuestaImagen);
}

export function actualizarImagen(id, data) {
  return request(`${API_PATHS.IMAGENES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }).then(normalizarRespuestaImagen);
}

export function eliminarImagen(id) {
  return request(`${API_PATHS.IMAGENES}/${id}`, {
    method: "DELETE"
  });
}

export function eliminarImagenesPorProducto(productoId) {
  return request(`${API_PATHS.IMAGENES}/producto/${productoId}`, {
    method: "DELETE"
  });
}

// Aliases legados para módulos que todavía usan el nombre viejo.
export function construirUrlImagen(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${API_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}
