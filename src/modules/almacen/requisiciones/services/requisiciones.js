import request from "../../../../services/api";
import { API_PATHS } from "../../../../config/apiPaths";

const base = API_PATHS.REQUISICIONES_ALMACEN;

const query = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

export function obtenerRequisiciones(params = {}) {
  const paramsString = query(params);
  return request(paramsString ? `${base}?${paramsString}` : base);
}

export function obtenerRequisicion(id) {
  return request(`${base}/${id}`);
}

export function crearRequisicion(data) {
  return request(base, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function cambiarEstadoRequisicion(id, estado, comentario = "") {
  return request(`${base}/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado, comentario }),
  });
}

export function obtenerSugerenciasRequisicion() {
  return request(`${base}/sugerencias`);
}

export function buscarInsumosRequisicion(busqueda) {
  return request(`${base}/insumos?${query({ busqueda })}`);
}
