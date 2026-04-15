// src/services/lineasProducto.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// LÍNEAS DE PRODUCTO
// ========================================

export function obtenerLineasProducto() {
  return request(API_PATHS.LINEA_PRODUCTO);
}

export function obtenerLineaProductoPorId(id) {
  return request(`${API_PATHS.LINEA_PRODUCTO}/${id}`);
}

export function crearLineaProducto(data) {
  return request(API_PATHS.LINEA_PRODUCTO, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarLineaProducto(id, data) {
  return request(`${API_PATHS.LINEA_PRODUCTO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarLineaProducto(id) {
  return request(`${API_PATHS.LINEA_PRODUCTO}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerLineasActivas() {
  return request(`${API_PATHS.LINEA_PRODUCTO}/activos`);
}

export function buscarLineasPorNombre(nombre) {
  return request(`${API_PATHS.LINEA_PRODUCTO}/buscar?nombre=${encodeURIComponent(nombre)}`);
}