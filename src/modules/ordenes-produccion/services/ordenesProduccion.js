import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const query = (params = {}) => {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") values.set(key, String(value));
  });
  const text = values.toString();
  return text ? `?${text}` : "";
};

export const listarOrdenesProduccion = (params) => request(`${API_PATHS.ORDENES_PRODUCCION}${query(params)}`);
export const obtenerOrdenProduccion = (id) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}`);
export const crearOrdenProduccion = (data) => request(API_PATHS.ORDENES_PRODUCCION, { method: "POST", body: JSON.stringify(data) });
export const actualizarOrdenProduccion = (id, data) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const convertirCotizacion = (cotizacionId, data = {}) => request(`${API_PATHS.ORDENES_PRODUCCION}/desde-cotizacion/${cotizacionId}`, { method: "POST", body: JSON.stringify(data) });
export const liberarOrdenProduccion = (id) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}/liberar`, { method: "POST" });
export const cancelarOrdenProduccion = (id, motivo) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}/cancelar`, { method: "POST", body: JSON.stringify({ motivo }) });
export const surtirOrdenProduccion = (id, data) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}/surtidos`, { method: "POST", body: JSON.stringify(data) });
export const cambiarOperacionProduccion = (id, operacionId, estado) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}/operaciones/${operacionId}`, { method: "PATCH", body: JSON.stringify({ estado }) });
export const registrarAvanceProduccion = (id, partidaId, data) => request(`${API_PATHS.ORDENES_PRODUCCION}/${id}/partidas/${partidaId}/avances`, { method: "POST", body: JSON.stringify(data) });
