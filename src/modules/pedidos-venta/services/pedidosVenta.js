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

export const listarPedidosVenta = (params = {}) => request(`${API_PATHS.PEDIDOS_VENTA}${query(params)}`);
export const obtenerPedidoVenta = (id) => request(`${API_PATHS.PEDIDOS_VENTA}/${id}`);
export const crearPedidoDesdeCotizacion = (cotizacionId, data = {}) => request(`${API_PATHS.PEDIDOS_VENTA}/desde-cotizacion/${cotizacionId}`, { method: "POST", body: JSON.stringify(data) });
export const confirmarPedidoVenta = (id) => request(`${API_PATHS.PEDIDOS_VENTA}/${id}/confirmar`, { method: "PATCH" });
export const cancelarPedidoVenta = (id) => request(`${API_PATHS.PEDIDOS_VENTA}/${id}/cancelar`, { method: "PATCH" });
