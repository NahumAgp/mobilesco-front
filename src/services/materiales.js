import request from "./api";
import { API_PATHS } from "../config/apiPaths";
// ========================================
// MATERIALES
// ========================================



export function obtenerMateriales() {
  return request(API_PATHS.MATERIALES);
}

export function obtenerMaterialPorId(id) {
  return request(`${API_PATHS.MATERIALES}/${id}`);
}

export function crearMaterial(data) {
  return request(API_PATHS.MATERIALES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarMaterial(id, data) {
    return request(`${API_PATHS.MATERIALES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarMaterial(id) {
  return request(`${API_PATHS.MATERIALES}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerMaterialesActivos() {
  return request(`${API_PATHS.MATERIALES}/activos`);
}

export function buscarMaterialesPorNombre(nombre) {
  return request(`${API_PATHS.MATERIALES}/buscar?nombre=${encodeURIComponent(nombre)}`);
}