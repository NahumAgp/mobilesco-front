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