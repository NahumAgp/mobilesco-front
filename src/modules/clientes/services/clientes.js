import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const queryString = (filtros = {}) => {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
};

export function obtenerClientes(filtros = {}) {
  const query = queryString(filtros);
  return request(query ? `${API_PATHS.CLIENTES}?${query}` : API_PATHS.CLIENTES);
}

export function obtenerClientesActivos() {
  return request(`${API_PATHS.CLIENTES}/activos`);
}

export function obtenerClasificacionesCliente() {
  return request(`${API_PATHS.CLIENTES}/clasificaciones`);
}

export function obtenerCliente(id) {
  return request(`${API_PATHS.CLIENTES}/${id}`);
}

export function crearCliente(data) {
  return request(API_PATHS.CLIENTES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCliente(id, data) {
  return request(`${API_PATHS.CLIENTES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function cambiarEstatusCliente(id, activo) {
  return request(`${API_PATHS.CLIENTES}/${id}/estatus?activo=${activo}`, {
    method: "PATCH",
  });
}

export function eliminarCliente(id) {
  return request(`${API_PATHS.CLIENTES}/${id}`, { method: "DELETE" });
}
