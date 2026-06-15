import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export function obtenerInsumos(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const endpoint = query ? `${API_PATHS.INSUMOS}?${query}` : API_PATHS.INSUMOS;

  return request(endpoint).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarInsumo(item));
    }

    if (response?.content) {
      return {
        ...response,
        content: response.content.map((item) => transformarInsumo(item))
      };
    }

    return transformarInsumo(response);
  });
}

export function obtenerCostosInsumos(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const endpoint = query ? `${API_PATHS.INSUMOS}/costos?${query}` : `${API_PATHS.INSUMOS}/costos`;

  return request(endpoint);
}

export function obtenerInsumoPorId(id) {
  const url = `${API_PATHS.INSUMOS}/${id}`;
  return request(url).then((data) => transformarInsumo(data));
}

export function obtenerTiposInsumo() {
  return request(`${API_PATHS.INSUMOS}/tipos-insumo`);
}

function transformarInsumo(item) {
  if (!item) return item;

  return {
    ...item,
    unidadMedida: item.unidadMedidaId
      ? {
          id: item.unidadMedidaId,
          nombre: item.unidadMedidaNombre,
          simbolo: item.unidadMedidaSimbolo
        }
      : null
  };
}

export function crearInsumo(data) {
  return request(API_PATHS.INSUMOS, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function actualizarInsumo(id, data) {
  return request(`${API_PATHS.INSUMOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function actualizarCostoCotizacion(id, costoCotizacion) {
  return request(`${API_PATHS.INSUMOS}/${id}/costo-cotizacion`, {
    method: "PATCH",
    body: JSON.stringify({ costoCotizacion })
  });
}

export function actualizarEstadoInsumo(id, activo) {
  return request(`${API_PATHS.INSUMOS}/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo })
  }).then((data) => transformarInsumo(data));
}

export function eliminarInsumo(id) {
  return request(`${API_PATHS.INSUMOS}/${id}`, {
    method: "DELETE"
  });
}

export function obtenerInsumosActivos() {
  return request(`${API_PATHS.INSUMOS}/activos`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarInsumo(item));
    }
    return response;
  });
}

export function buscarInsumos(nombre) {
  return request(`${API_PATHS.INSUMOS}/buscar?nombre=${encodeURIComponent(nombre)}`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarInsumo(item));
    }
    return response;
  });
}

export function obtenerInsumosPorUnidadMedida(unidadMedidaId) {
  return request(`${API_PATHS.INSUMOS}/unidad-medida/${unidadMedidaId}`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarInsumo(item));
    }
    return response;
  });
}

export function obtenerInsumosStockBajo() {
  return request(`${API_PATHS.INSUMOS}/stock-bajo`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarInsumo(item));
    }
    return response;
  });
}

export function ajustarStock(id, cantidad, tipo, motivo) {
  const params = new URLSearchParams({
    cantidad: String(cantidad),
    tipo
  });

  if (motivo) {
    params.set("motivo", motivo);
  }

  return request(`${API_PATHS.INSUMOS}/${id}/ajustar-stock?${params.toString()}`, {
    method: "POST"
  });
}

export function exportarInsumosExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.INSUMOS}/reporte/excel?${query}`
    : `${API_PATHS.INSUMOS}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}
