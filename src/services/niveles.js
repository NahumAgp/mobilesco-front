import request from "./api";
import { API_PATHS } from "../config/apiPaths";

export function obtenerNiveles() {
  return request(API_PATHS.NIVELES);
}

export function obtenerNivelPorId(id) {
  return request(`${API_PATHS.NIVELES}/${id}`);
}

export function crearNivel(data) {
  return request(API_PATHS.NIVELES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarNivel(id, data) {
  return request(`${API_PATHS.NIVELES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarNivel(id) {
  return request(`${API_PATHS.NIVELES}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerNivelesActivos() {
  return request(`${API_PATHS.NIVELES}/activos`);
}

export function buscarNivelesPorNombre(nombre) {
  return request(`${API_PATHS.NIVELES}/nombre/${encodeURIComponent(nombre)}`);
}
