import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export function obtenerNiveles(modeloId) {
  return modeloId
    ? request(`${API_PATHS.NIVELES}/por-modelo/${modeloId}`)
    : request(API_PATHS.NIVELES);
}

export function obtenerNivelesActivosPorModelo(modeloId) {
  return request(`${API_PATHS.NIVELES}/por-modelo/${modeloId}?soloActivos=true`);
}

export function obtenerNivelPorId(id) {
  return request(`${API_PATHS.NIVELES}/${id}`);
}

export function crearNivel(data) {
  return request(API_PATHS.NIVELES, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      modelo_id: data.modelo_id ?? data.modeloId
    }),
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
