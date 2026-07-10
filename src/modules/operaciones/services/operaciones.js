import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

function transformarOperacion(item) {
  if (!item) return item;
  return { ...item };
}

export function obtenerOperaciones(params = {}) {
  const query = buildQuery(params);
  const url = query ? `${API_PATHS.OPERACION}?${query}` : API_PATHS.OPERACION;
  return request(url).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarOperacion(item));
    }
    if (response?.content) {
      return {
        ...response,
        content: response.content.map((item) => transformarOperacion(item))
      };
    }
    return transformarOperacion(response);
  });
}

export function obtenerOperacionPorId(id) {
  return request(`${API_PATHS.OPERACION}/${id}`).then((data) => transformarOperacion(data));
}

export function obtenerOperacionPorCodigo(codigo) {
  return request(`${API_PATHS.OPERACION}/codigo/${codigo}`).then((data) => transformarOperacion(data));
}

export function crearOperacion(data) {
  return request(API_PATHS.OPERACION, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarOperacion(id, data) {
  return request(`${API_PATHS.OPERACION}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarOperacion(id) {
  return request(`${API_PATHS.OPERACION}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerOperacionesActivas() {
  return request(`${API_PATHS.OPERACION}/activos`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarOperacion(item));
    }
    return response;
  });
}

export function buscarOperaciones(nombre) {
  return request(`${API_PATHS.OPERACION}/buscar?nombre=${encodeURIComponent(nombre)}`).then((response) => {
    if (Array.isArray(response)) {
      return response.map((item) => transformarOperacion(item));
    }
    return response;
  });
}
