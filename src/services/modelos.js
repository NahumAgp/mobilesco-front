// services/modelos.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// MODELOS
// ========================================

export function obtenerModelos() {
  return request(API_PATHS.MODELOS);
}

export function obtenerModeloPorId(id) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url);
}

export function crearModelo(data) {
  return request(API_PATHS.MODELOS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarModelo(id, data) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarModelo(id) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerModelosActivos() {
  const url = `${API_PATHS.MODELOS}/activos`;
  return request(url);
}

export function obtenerModelosPorFamilia(familiaId) {
  const url = `${API_PATHS.MODELOS}/familia/${familiaId}`;
  return request(url);
}

export function buscarModelos(nombre) {
  const url = `${API_PATHS.MODELOS}/buscar?nombre=${encodeURIComponent(nombre)}`;
  return request(url);
}