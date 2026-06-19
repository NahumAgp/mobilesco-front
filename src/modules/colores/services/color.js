import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export function obtenerColores() {
  return request(API_PATHS.COLORES);
}

export function obtenerColorPorId(id) {
  return request(`${API_PATHS.COLORES}/${id}`);
}

export function obtenerCodigoSugerido(nombre) {
  return request(`${API_PATHS.COLORES}/codigo-sugerido?nombre=${encodeURIComponent(nombre)}`);
}

export function crearColor(data) {
  return request(API_PATHS.COLORES, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function actualizarColor(id, data) {
  return request(`${API_PATHS.COLORES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function activarColor(id) {
  return request(`${API_PATHS.COLORES}/${id}/activar`, {
    method: "PATCH"
  });
}

export function desactivarColor(id) {
  return request(`${API_PATHS.COLORES}/${id}/desactivar`, {
    method: "PATCH"
  });
}

export function eliminarColor(id) {
  return request(`${API_PATHS.COLORES}/${id}`, {
    method: "DELETE"
  });
}
