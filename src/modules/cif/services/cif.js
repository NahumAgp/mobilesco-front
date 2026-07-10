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

export function obtenerConceptosCif(params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.CIF}/conceptos?${query}` : `${API_PATHS.CIF}/conceptos`);
}

export function obtenerConceptoCif(id) {
  return request(`${API_PATHS.CIF}/conceptos/${id}`);
}

export function crearConceptoCif(data) {
  return request(`${API_PATHS.CIF}/conceptos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarConceptoCif(id, data) {
  return request(`${API_PATHS.CIF}/conceptos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function cambiarEstadoConceptoCif(id, activo) {
  return request(`${API_PATHS.CIF}/conceptos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
}

export function obtenerConfiguracionCif() {
  return request(`${API_PATHS.CIF}/configuracion`);
}

export function actualizarConfiguracionCif(data) {
  return request(`${API_PATHS.CIF}/configuracion`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function obtenerResumenCif() {
  return request(`${API_PATHS.CIF}/resumen`);
}
