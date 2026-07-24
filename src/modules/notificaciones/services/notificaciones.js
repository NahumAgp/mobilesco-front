import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const base = API_PATHS.NOTIFICACIONES;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

export function obtenerNotificaciones(params = {}) {
  const query = buildQuery(params);
  return request(query ? `${base}?${query}` : base);
}

export function contarNotificacionesNoLeidas() {
  return request(`${base}/no-leidas/conteo`);
}

export function marcarNotificacionLeida(id) {
  return request(`${base}/${id}/leida`, { method: "PATCH" });
}

export function marcarTodasNotificacionesLeidas() {
  return request(`${base}/leer-todas`, { method: "PATCH" });
}
