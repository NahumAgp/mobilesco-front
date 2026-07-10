import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const BASE_URL = API_PATHS.KARDEX;

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function obtenerHistorialInsumo(insumoId, params = {}) {
  return request(`${BASE_URL}/insumo/${insumoId}${buildQuery(params)}`);
}

export function obtenerMovimientosPorPeriodo(fechaInicio, fechaFin, params = {}) {
  return request(`${BASE_URL}/periodo${buildQuery({
    fechaInicio,
    fechaFin,
    ...params
  })}`);
}

export function obtenerMovimientosPorCompra(compraId) {
  return request(`${BASE_URL}/compra/${compraId}`);
}

export function obtenerCostoPromedio(insumoId) {
  return request(`${BASE_URL}/insumo/${insumoId}/costo-promedio`);
}

export function obtenerConsumoEnPeriodo(insumoId, fechaInicio, fechaFin) {
  return request(`${BASE_URL}/insumo/${insumoId}/consumo${buildQuery({
    fechaInicio,
    fechaFin
  })}`);
}
