import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export function obtenerColores() {
  return request(`${API_PATHS.COLORES}/activos`);
}

export function obtenerColorPorId(id) {
  return request(`${API_PATHS.COLORES}/${id}`);
}
