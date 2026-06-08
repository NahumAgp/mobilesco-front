import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

function construirQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function obtenerTiposInsumo(params = {}) {
  return request(`${API_PATHS.TIPOS_INSUMO}${construirQuery(params)}`);
}

export function obtenerPreviewTipoInsumo(nombre) {
  return request(
    `${API_PATHS.TIPOS_INSUMO}/preview-codigo${construirQuery({ nombre })}`
  );
}

export function crearTipoInsumo(data) {
  return request(API_PATHS.TIPOS_INSUMO, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function actualizarTipoInsumo(id, data) {
  return request(`${API_PATHS.TIPOS_INSUMO}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function actualizarEstadoTipoInsumo(id, activo) {
  return request(`${API_PATHS.TIPOS_INSUMO}/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo })
  });
}
