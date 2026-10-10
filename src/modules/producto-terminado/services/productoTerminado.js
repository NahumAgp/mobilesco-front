import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export const listarProductoTerminado = (params = {}) => {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") values.set(key, String(value));
  });
  const query = values.toString();
  return request(`${API_PATHS.INVENTARIO_PRODUCTOS_TERMINADOS}${query ? `?${query}` : ""}`);
};
