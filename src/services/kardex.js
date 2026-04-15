import request from "./api";

// ========================================
// KARDEX - SOLO CONSULTAS
// ========================================

const BASE_URL = "/api/kardex";

/**
 * Obtener historial completo de un insumo
 */
export function obtenerHistorialInsumo(insumoId) {
  const url = `${BASE_URL}/insumo/${insumoId}`;
  console.log("🌐 GET Historial Insumo - URL:", url);
  return request(url);
}

/**
 * Obtener movimientos por período de tiempo
 * @param {string} fechaInicio - ISO datetime (ej: 2024-01-01T00:00:00)
 * @param {string} fechaFin - ISO datetime (ej: 2024-12-31T23:59:59)
 */
export function obtenerMovimientosPorPeriodo(fechaInicio, fechaFin) {
  const url = `${BASE_URL}/periodo?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`;
  console.log("🌐 GET Movimientos por Periodo - URL:", url);
  return request(url);
}

/**
 * Obtener movimientos de una compra específica
 */
export function obtenerMovimientosPorCompra(compraId) {
  const url = `${BASE_URL}/compra/${compraId}`;
  console.log("🌐 GET Movimientos por Compra - URL:", url);
  return request(url);
}

/**
 * Obtener costo promedio de un insumo
 */
export function obtenerCostoPromedio(insumoId) {
  const url = `${BASE_URL}/insumo/${insumoId}/costo-promedio`;
  console.log("🌐 GET Costo Promedio - URL:", url);
  return request(url);
}

/**
 * Obtener consumo en un período específico
 */
export function obtenerConsumoEnPeriodo(insumoId, fechaInicio, fechaFin) {
  const url = `${BASE_URL}/insumo/${insumoId}/consumo?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`;
  console.log("🌐 GET Consumo en Periodo - URL:", url);
  return request(url);
}