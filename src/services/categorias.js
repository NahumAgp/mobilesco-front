// src/services/categorias.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// CATEGORÍAS
// ========================================

export function obtenerCategorias() {
  return request(API_PATHS.CATEGORIAS);
}

export function obtenerCategoriaPorId(id) {
  return request(`${API_PATHS.CATEGORIAS}/${id}`);
}

export function crearCategoria(data) {
  return request(API_PATHS.CATEGORIAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCategoria(id, data) {
  return request(`${API_PATHS.CATEGORIAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarCategoria(id) {
  return request(`${API_PATHS.CATEGORIAS}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarCategoria(id) {
  return request(`${API_PATHS.CATEGORIAS}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarCategoria(id) {
  return request(`${API_PATHS.CATEGORIAS}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerCategoriasActivas() {
  return request(`${API_PATHS.CATEGORIAS}/activos`);
}

export function buscarCategoriasPorNombre(nombre) {
  return request(`${API_PATHS.CATEGORIAS}/buscar?nombre=${encodeURIComponent(nombre)}`);
}

export function exportarCategoriasExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.CATEGORIAS}/reporte/excel?${query}`
    : `${API_PATHS.CATEGORIAS}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}
