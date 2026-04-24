// ============================================
// RUTA: src/services/variantes.js
// ============================================
import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// VARIANTES
// ========================================

// Obtener todas las variantes
export function obtenerVariantes() {
  return request(API_PATHS.VARIANTES);
}

// Obtener variantes activas
export function obtenerVariantesActivas() {
  return request(`${API_PATHS.VARIANTES}/activos`);
}

// Obtener variante por ID
export function obtenerVariantePorId(id) {
  return request(`${API_PATHS.VARIANTES}/${id}`);
}

// Obtener variante por SKU
export function obtenerVariantePorSku(sku) {
  return request(`${API_PATHS.VARIANTES}/sku/${sku}`);
}

// Obtener variante completa por ID (con imágenes)
export function obtenerVarianteCompleta(id) {
  return request(`${API_PATHS.VARIANTES}/${id}/completo`);
}

// Obtener variante completa por SKU (con imágenes)
export function obtenerVarianteCompletaPorSku(sku) {
  return request(`${API_PATHS.VARIANTES}/sku/${sku}/completo`);
}

// Obtener variantes por producto base
export function obtenerVariantesPorProductoBase(productoBaseId) {
  return request(`${API_PATHS.VARIANTES}/por-producto-base/${productoBaseId}`);
}

// Obtener variantes activas por producto base
export function obtenerVariantesActivasPorProductoBase(productoBaseId) {
  return request(`${API_PATHS.VARIANTES}/por-producto-base/${productoBaseId}/activos?activo=true`);
}

// Buscar variantes con filtros
export function buscarVariantes(filtros) {
  const params = new URLSearchParams(filtros).toString();
  return request(`${API_PATHS.VARIANTES}/buscar?${params}`);
}

// Crear variante
export function crearVariante(data) {
  return request(API_PATHS.VARIANTES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Actualizar variante
export function actualizarVariante(id, data) {
  return request(`${API_PATHS.VARIANTES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Eliminar variante
export function eliminarVariante(id) {
  return request(`${API_PATHS.VARIANTES}/${id}`, {
    method: "DELETE",
  });
}