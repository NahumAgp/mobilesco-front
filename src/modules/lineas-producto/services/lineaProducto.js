// src/services/lineasProducto.js
import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// LÍNEAS DE PRODUCTO
// ========================================

export function obtenerLineasProducto(params = {}) {
  const page = typeof params === "number" ? params : params.page;
  const size = typeof params === "object" ? params.size : undefined;
  const sortBy = typeof params === "object" ? params.sortBy : undefined;
  const direction = typeof params === "object" ? params.direction : undefined;
  const busqueda = typeof params === "object" ? params.busqueda : undefined;
  const activo = typeof params === "object" ? params.activo : undefined;

  const searchParams = new URLSearchParams();

  if (page !== undefined && page !== null) {
    searchParams.set("page", page);
  }

  if (size !== undefined && size !== null) {
    searchParams.set("size", size);
  }

  if (sortBy) {
    searchParams.set("sortBy", sortBy);
  }

  if (direction) {
    searchParams.set("direction", direction);
  }

  if (busqueda) {
    searchParams.set("busqueda", busqueda);
  }

  if (activo !== undefined && activo !== null && activo !== "") {
    searchParams.set("activo", String(activo));
  }

  const queryString = searchParams.toString();

  return request(queryString ? `${API_PATHS.LINEAS}?${queryString}` : API_PATHS.LINEAS);
}

export function obtenerLineaProductoPorId(id) {
  return request(`${API_PATHS.LINEAS}/${id}`);
}

export function obtenerCodigoSugerido(nombre) {
  return request(`${API_PATHS.LINEAS}/codigo-sugerido?nombre=${encodeURIComponent(nombre)}`);
}

export function crearLineaProducto(data) {
  return request(API_PATHS.LINEAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarLineaProducto(id, data) {
  return request(`${API_PATHS.LINEAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarLineaProducto(id) {
  return request(`${API_PATHS.LINEAS}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarLineaProducto(id) {
  return request(`${API_PATHS.LINEAS}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarLineaProducto(id) {
  return request(`${API_PATHS.LINEAS}/${id}`, {
    method: "DELETE",
  });
}

export function exportarLineasProductoExcel(filtros = {}) {
  const searchParams = new URLSearchParams();

  if (filtros.activo !== undefined && filtros.activo !== null) {
    searchParams.set("activo", filtros.activo);
  }

  if (filtros.busqueda) {
    searchParams.set("busqueda", filtros.busqueda);
  }

  if (filtros.sortBy) {
    searchParams.set("sortBy", filtros.sortBy);
  }

  if (filtros.direction) {
    searchParams.set("direction", filtros.direction);
  }

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `${API_PATHS.LINEAS}/reporte/excel?${queryString}`
    : `${API_PATHS.LINEAS}/reporte/excel`;

  return request(endpoint, {
    method: "GET",
    responseType: "blob"
  });
}

export function obtenerLineasActivas() {
  return request(`${API_PATHS.LINEAS}/activos`);
}

export function buscarLineasPorNombre(nombre) {
  return request(`${API_PATHS.LINEAS}/buscar?nombre=${encodeURIComponent(nombre)}`);
}
