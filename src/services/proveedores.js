// src/services/proveedoresService.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// PROVEEDORES
// ========================================

export function obtenerProveedores() {
  return request(API_PATHS.PROVEEDORES);
}

export function obtenerProveedorPorId(id) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`);
}

export function crearProveedor(data) {
  return request(API_PATHS.PROVEEDORES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarProveedor(id, data) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarProveedor(id) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerTiposInsumo() {
  return request(`${API_PATHS.PROVEEDORES}/tipos-insumo`);
}