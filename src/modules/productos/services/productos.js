import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export function obtenerProductos(params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.PRODUCTOS}?${query}` : API_PATHS.PRODUCTOS);
}

export function obtenerProductoPorId(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}`);
}

export function obtenerProductoPorSku(sku) {
  return request(`${API_PATHS.PRODUCTOS}/sku/${sku}`);
}

export function obtenerProductosPorModelo(modeloId) {
  return request(`${API_PATHS.PRODUCTOS}/por-modelo/${modeloId}`);
}

export function crearProducto(data) {
  return request(API_PATHS.PRODUCTOS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarProducto(id, data) {
  return request(`${API_PATHS.PRODUCTOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function desactivarProducto(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}`, {
    method: "DELETE",
  });
}

export function crearProductoCompleto(data) {
  return request(`${API_PATHS.PRODUCTOS}/creacion-completa`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function eliminarProducto(id) {
  return desactivarProducto(id);
}

export function activarProducto(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}/activar`, {
    method: "PATCH",
  });
}

export function eliminarProductoDefinitivo(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}/definitivo`, {
    method: "DELETE",
  });
}

export function obtenerProductosActivos() {
  return request(`${API_PATHS.PRODUCTOS}/activos`);
}

export function buscarProductos(nombre) {
  return request(`${API_PATHS.PRODUCTOS}/buscar?nombre=${encodeURIComponent(nombre)}`);
}

export function obtenerInsumosDeProducto(productoId, params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.PRODUCTOS}/${productoId}/insumos?${query}` : `${API_PATHS.PRODUCTOS}/${productoId}/insumos`);
}

export function agregarInsumoAProducto(productoId, data) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/insumos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function agregarInsumosMasivo(productoId, insumos) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/insumos/masivo`, {
    method: "POST",
    body: JSON.stringify(insumos),
  });
}

export function eliminarInsumoDeProducto(productoId, insumoId) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/insumos/${insumoId}`, {
    method: "DELETE",
  });
}

export function actualizarInsumoDeProducto(productoId, insumoId, data) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/insumos/${insumoId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function obtenerOperacionesDeProducto(productoId, params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.PRODUCTOS}/${productoId}/operaciones?${query}` : `${API_PATHS.PRODUCTOS}/${productoId}/operaciones`);
}

export function agregarOperacionesMasivo(productoId, operaciones) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/operaciones/masivo`, {
    method: "POST",
    body: JSON.stringify(operaciones),
  });
}

export function eliminarOperacionDeProducto(productoId, operacionId) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/operaciones/${operacionId}`, {
    method: "DELETE",
  });
}

export function reordenarOperaciones(productoId, operacionesIds) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/operaciones/reordenar`, {
    method: "PUT",
    body: JSON.stringify(operacionesIds),
  });
}

export function calcularCostoOperaciones(productoId) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/costo-operaciones`);
}

export function calcularCostoProducto(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}/costo`);
}

export function calcularCostoConDesperdicio(id) {
  return request(`${API_PATHS.PRODUCTOS}/${id}/costo-con-desperdicio`);
}

export function obtenerEstructuraCostos(productoId) {
  return request(`${API_PATHS.PRODUCTOS}/${productoId}/estructura-costos`);
}

export function exportarProductosExcel(filtros = {}) {
  const query = buildQuery(filtros);
  return request(query ? `${API_PATHS.PRODUCTOS}/reporte/excel?${query}` : `${API_PATHS.PRODUCTOS}/reporte/excel`, {
    responseType: "blob"
  });
}
