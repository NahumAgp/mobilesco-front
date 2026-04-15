import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// PRODUCTOS - CRUD BÁSICO
// ========================================

export function obtenerProductos() {
  console.log("🌐 GET Productos - URL:", API_PATHS.PRODUCTOS);
  return request(API_PATHS.PRODUCTOS);
}

export function obtenerProductoPorId(id) {
  const url = `${API_PATHS.PRODUCTOS}/${id}`;
  console.log("🌐 GET Producto by ID - URL:", url);
  return request(url);
}

export function obtenerProductoPorSku(sku) {
  const url = `${API_PATHS.PRODUCTOS}/sku/${sku}`;
  console.log("🌐 GET Producto by SKU - URL:", url);
  return request(url);
}

export function crearProducto(data) {
  console.log("🌐 POST Producto - URL:", API_PATHS.PRODUCTOS, "Data:", data);
  return request(API_PATHS.PRODUCTOS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarProducto(id, data) {
  const url = `${API_PATHS.PRODUCTOS}/${id}`;
  console.log("🌐 PUT Producto - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarProducto(id) {
  const url = `${API_PATHS.PRODUCTOS}/${id}`;
  console.log("🌐 DELETE Producto - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerProductosActivos() {
  const url = `${API_PATHS.PRODUCTOS}/activos`;
  console.log("🌐 GET Productos Activos - URL:", url);
  return request(url);
}

export function buscarProductos(nombre) {
  const url = `${API_PATHS.PRODUCTOS}/buscar?nombre=${encodeURIComponent(nombre)}`;
  console.log("🌐 GET Buscar Productos - URL:", url);
  return request(url);
}

// ========================================
// INSUMOS DE PRODUCTO (BOM)
// ========================================

export function obtenerInsumosDeProducto(productoId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/insumos`;
  console.log("🌐 GET Insumos de Producto - URL:", url);
  return request(url);
}

export function agregarInsumoAProducto(productoId, data) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/insumos`;
  console.log("🌐 POST Agregar Insumo - URL:", url, "Data:", data);
  return request(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function agregarInsumosMasivo(productoId, insumos) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/insumos/masivo`;
  console.log("🌐 POST Agregar Insumos Masivo - URL:", url, "Data:", insumos);
  return request(url, {
    method: "POST",
    body: JSON.stringify(insumos),
  });
}

export function eliminarInsumoDeProducto(productoId, insumoId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/insumos/${insumoId}`;
  console.log("🌐 DELETE Insumo de Producto - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function actualizarInsumoDeProducto(productoId, insumoId, data) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/insumos/${insumoId}`;
  console.log("🌐 PUT Insumo de Producto - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ========================================
// OPERACIONES DE PRODUCTO (BOM)
// ========================================

export function obtenerOperacionesDeProducto(productoId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/operaciones`;
  console.log("🌐 GET Operaciones de Producto - URL:", url);
  return request(url);
}

export function agregarOperacionesMasivo(productoId, operaciones) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/operaciones/masivo`;
  console.log("🌐 POST Agregar Operaciones Masivo - URL:", url, "Data:", operaciones);
  return request(url, {
    method: "POST",
    body: JSON.stringify(operaciones),
  });
}

export function eliminarOperacionDeProducto(productoId, operacionId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/operaciones/${operacionId}`;
  console.log("🌐 DELETE Operación de Producto - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function reordenarOperaciones(productoId, operacionesIds) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/operaciones/reordenar`;
  console.log("🌐 PUT Reordenar Operaciones - URL:", url, "Data:", operacionesIds);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(operacionesIds),
  });
}

export function calcularCostoOperaciones(productoId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/costo-operaciones`;
  console.log("🌐 GET Calcular Costo Operaciones - URL:", url);
  return request(url);
}

// ========================================
// CÁLCULOS Y ESTRUCTURA DE COSTOS
// ========================================

export function calcularCostoProducto(id) {
  const url = `${API_PATHS.PRODUCTOS}/${id}/costo`;
  console.log("🌐 GET Calcular Costo - URL:", url);
  return request(url);
}

export function calcularCostoConDesperdicio(id) {
  const url = `${API_PATHS.PRODUCTOS}/${id}/costo-con-desperdicio`;
  console.log("🌐 GET Calcular Costo con Desperdicio - URL:", url);
  return request(url);
}

export function obtenerEstructuraCostos(productoId) {
  const url = `${API_PATHS.PRODUCTOS}/${productoId}/estructura-costos`;
  console.log("🌐 GET Estructura Costos - URL:", url);
  return request(url);
}