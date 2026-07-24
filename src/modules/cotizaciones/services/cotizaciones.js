import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const query = (params = {}) => {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) => {
    if (item !== undefined && item !== null && item !== "") value.set(key, item);
  });
  return value.toString();
};

export const listarCotizaciones = (params = {}) =>
  request(`${API_PATHS.COTIZACIONES}?${query(params)}`);

export const obtenerCotizacion = (id) =>
  request(`${API_PATHS.COTIZACIONES}/${id}`);

export const buscarProductosCotizables = (busqueda, tipo) =>
  request(`${API_PATHS.COTIZACIONES}/productos?${query({ busqueda, tipo })}`);

export const crearCotizacion = (data) =>
  request(API_PATHS.COTIZACIONES, { method: "POST", body: JSON.stringify(data) });

export const cambiarEstadoCotizacion = (id, estado) =>
  request(`${API_PATHS.COTIZACIONES}/${id}/estado?estado=${estado}`, { method: "PATCH" });
