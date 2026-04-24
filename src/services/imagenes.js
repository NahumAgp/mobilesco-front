import request from "./api";
import { API_PATHS } from "../config/apiPaths";

export function subirImagenArchivo({ archivo, varianteId, esPrincipal, orden, altTexto }) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("varianteId", String(varianteId));

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
  });
}

export function crearImagen(data) {
  return request(API_PATHS.IMAGENES, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function obtenerImagenesPorVariante(varianteId) {
  return request(`${API_PATHS.IMAGENES}/variante/${varianteId}`);
}

export function obtenerImagenPrincipalPorVariante(varianteId) {
  return request(`${API_PATHS.IMAGENES}/variante/${varianteId}/principal`);
}

export function obtenerImagenPorId(id) {
  return request(`${API_PATHS.IMAGENES}/${id}`);
}

export function actualizarImagen(id, data) {
  return request(`${API_PATHS.IMAGENES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function eliminarImagen(id) {
  return request(`${API_PATHS.IMAGENES}/${id}`, {
    method: "DELETE"
  });
}

export function eliminarImagenesPorVariante(varianteId) {
  return request(`${API_PATHS.IMAGENES}/variante/${varianteId}`, {
    method: "DELETE"
  });
}
