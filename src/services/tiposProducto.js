// services/tiposProducto.js
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// TIPOS DE PRODUCTO
// ========================================

export function obtenerTiposProducto() {
  return request(API_PATHS.TIPO_PRODUCTO);
}

export function obtenerTipoProductoPorId(id) {
  const url = `${API_PATHS.TIPO_PRODUCTO}/${id}`;
  return request(url);
}

export function crearTipoProducto(data) {
  return request(API_PATHS.TIPO_PRODUCTO, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarTipoProducto(id, data) {
  const url = `${API_PATHS.TIPO_PRODUCTO}/${id}`;
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarTipoProducto(id) {
  const url = `${API_PATHS.TIPO_PRODUCTO}/${id}`;
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerTiposProductoActivos() {
  const url = `${API_PATHS.TIPO_PRODUCTO}/activos`;
  return request(url);
}

export function obtenerTiposPorFamilia(familiaId) {
  const url = `${API_PATHS.TIPO_PRODUCTO}/familia/${familiaId}`;
  return request(url);
}

export function buscarTiposProducto(nombre) {
  const url = `${API_PATHS.TIPO_PRODUCTO}/buscar?nombre=${encodeURIComponent(nombre)}`;
  return request(url);
}