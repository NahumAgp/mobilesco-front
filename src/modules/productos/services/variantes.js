// ============================================
// RUTA: src/services/variantes.js
// ============================================
import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const PRODUCTOS_PATH = API_PATHS.PRODUCTOS;

const buildQueryString = (filtros = {}) => {
  if (!filtros || typeof filtros !== "object") return "";
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

// ========================================
// PRODUCTOS
// ========================================

export function obtenerProductos() {
  return request(PRODUCTOS_PATH);
}

export function obtenerProductosActivos() {
  return request(`${PRODUCTOS_PATH}/buscar${buildQueryString({ activo: true })}`);
}

export function obtenerProductoPorId(id) {
  return request(`${PRODUCTOS_PATH}/${id}`);
}

export function obtenerProductoPorSku(sku) {
  return request(`${PRODUCTOS_PATH}/sku/${sku}`);
}

export function obtenerProductoCompleto(id) {
  return request(`${PRODUCTOS_PATH}/${id}`);
}

export function obtenerProductoCompletoPorSku(sku) {
  return request(`${PRODUCTOS_PATH}/sku/${sku}`);
}

export function obtenerProductosPorProductoBase(productoBaseId) {
  return request(`${PRODUCTOS_PATH}/por-producto-base/${productoBaseId}`);
}

export function obtenerProductosActivosPorProductoBase(productoBaseId) {
  return request(
    `${PRODUCTOS_PATH}/buscar${buildQueryString({
      id_producto_base: productoBaseId,
      activo: true
    })}`
  );
}

export function buscarProductos(filtros) {
  return request(`${PRODUCTOS_PATH}/buscar${buildQueryString(filtros)}`);
}

export function crearProducto(data) {
  return request(PRODUCTOS_PATH, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function actualizarProducto(id, data) {
  return request(`${PRODUCTOS_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function eliminarProducto(id) {
  return request(`${PRODUCTOS_PATH}/${id}`, {
    method: "DELETE"
  });
}

// ========================================
// ALIAS LEGADOS
// ========================================

export const obtenerVariantes = obtenerProductos;
export const obtenerVariantesActivas = obtenerProductosActivos;
export const obtenerVariantePorId = obtenerProductoPorId;
export const obtenerVariantePorSku = obtenerProductoPorSku;
export const obtenerVarianteCompleta = obtenerProductoCompleto;
export const obtenerVarianteCompletaPorSku = obtenerProductoCompletoPorSku;
export const obtenerVariantesPorProductoBase = obtenerProductosPorProductoBase;
export const obtenerVariantesActivasPorProductoBase = obtenerProductosActivosPorProductoBase;
export const buscarVariantes = buscarProductos;
export const crearVariante = crearProducto;
export const actualizarVariante = actualizarProducto;
export const eliminarVariante = eliminarProducto;
