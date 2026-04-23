// src/services/lineasProducto.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// LÍNEAS DE PRODUCTO
// ========================================

export function obtenerLineasProducto() {
  return request(API_PATHS.LINEAS);
}

export function obtenerLineaProductoPorId(id) {
  return request(`${API_PATHS.LINEAS}/${id}`);
}

export function crearLineaProducto(data) {
  return request(API_PATHS.LINEAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarLineaProducto(id, data) {
  return request(`${API_PATHS.LINEAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarLineaProducto(id) {
  return request(`${API_PATHS.LINEAS}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerLineasActivas() {
  return request(`${API_PATHS.LINEAS}/activos`);
}

export function buscarLineasPorNombre(nombre) {
  return request(`${API_PATHS.LINEAS}/buscar?nombre=${encodeURIComponent(nombre)}`);
}