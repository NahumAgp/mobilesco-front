import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export function obtenerSubfamilias(params = {}) {
  const query = buildQuery(params);
  return request(query ? `${API_PATHS.SUBFAMILIAS}?${query}` : API_PATHS.SUBFAMILIAS);
}

export function obtenerSubfamiliasActivas() {
  return request(`${API_PATHS.SUBFAMILIAS}/activas`);
}

export function obtenerSubfamiliasPorFamilia(familiaId, activo = true) {
  const suffix = activo === undefined || activo === null ? "" : `/activos?activo=${activo}`;
  return request(`${API_PATHS.SUBFAMILIAS}/por-familia/${familiaId}${suffix}`);
}

export function obtenerCodigoSubfamiliaSugerido(nombre, familiaId) {
  const params = new URLSearchParams({ nombre });
  if (familiaId !== undefined && familiaId !== null && familiaId !== "") {
    params.set("familiaId", String(familiaId));
  }
  return request(`${API_PATHS.SUBFAMILIAS}/codigo-sugerido?${params.toString()}`);
}

export function crearSubfamilia(data) {
  return request(API_PATHS.SUBFAMILIAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarSubfamilia(id, data) {
  return request(`${API_PATHS.SUBFAMILIAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarSubfamilia(id) {
  return request(`${API_PATHS.SUBFAMILIAS}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarSubfamilia(id) {
  return request(`${API_PATHS.SUBFAMILIAS}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarSubfamilia(id) {
  return request(`${API_PATHS.SUBFAMILIAS}/${id}`, {
    method: "DELETE",
  });
}
