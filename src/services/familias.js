import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// FAMILIAS
// ========================================

export function obtenerFamilias() {
  return request(API_PATHS.FAMILIAS);
}

export function obtenerFamiliaPorId(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}`);
}

export function crearFamilia(data) {
  return request(API_PATHS.FAMILIAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarFamilia(id, data) {
  return request(`${API_PATHS.FAMILIAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarFamilia(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerFamiliasActivas() {
  return request(`${API_PATHS.FAMILIAS}/activas`);
}