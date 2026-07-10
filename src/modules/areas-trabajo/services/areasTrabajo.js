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

export function obtenerAreasTrabajo(params = {}) {
  const query = buildQuery(params);
  const suffix = query ? `?${query}` : "";
  return request(`${API_PATHS.AREAS_TRABAJO}${suffix}`);
}

export function obtenerAreaTrabajoPorId(id) {
  return request(`${API_PATHS.AREAS_TRABAJO}/${id}`);
}

export function obtenerCodigoSugeridoAreaTrabajo(nombre) {
  return request(`${API_PATHS.AREAS_TRABAJO}/codigo-sugerido?nombre=${encodeURIComponent(nombre)}`);
}

export function crearAreaTrabajo(data) {
  return request(API_PATHS.AREAS_TRABAJO, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function actualizarAreaTrabajo(id, data) {
  return request(`${API_PATHS.AREAS_TRABAJO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function activarAreaTrabajo(id) {
  return request(`${API_PATHS.AREAS_TRABAJO}/${id}/activar`, {
    method: "PATCH"
  });
}

export function desactivarAreaTrabajo(id) {
  return request(`${API_PATHS.AREAS_TRABAJO}/${id}/desactivar`, {
    method: "PATCH"
  });
}
