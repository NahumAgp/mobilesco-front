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

export function obtenerSalidasInsumos(params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.SALIDAS_INSUMOS}?${query}` : API_PATHS.SALIDAS_INSUMOS);
}

export function obtenerSalidaInsumoPorId(id) {
  return request(`${API_PATHS.SALIDAS_INSUMOS}/${id}`);
}

export function crearSalidaInsumo(data) {
  return request(API_PATHS.SALIDAS_INSUMOS, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function eliminarSalidaInsumo(id) {
  return request(`${API_PATHS.SALIDAS_INSUMOS}/${id}`, {
    method: "DELETE"
  });
}
