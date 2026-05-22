import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";
// ========================================
// MATERIALES
// ========================================

export function obtenerMateriales(params = {}) {
  const page = typeof params === "number" ? params : params.page;
  const size = typeof params === "object" ? params.size : undefined;
  const sortBy = typeof params === "object" ? params.sortBy : undefined;
  const direction = typeof params === "object" ? params.direction : undefined;

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

  const queryString = searchParams.toString();

  return request(queryString ? `${API_PATHS.MATERIALES}?${queryString}` : API_PATHS.MATERIALES);
}

export function obtenerMaterialPorId(id) {
  return request(`${API_PATHS.MATERIALES}/${id}`);
}

export function crearMaterial(data) {
  return request(API_PATHS.MATERIALES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarMaterial(id, data) {
  return request(`${API_PATHS.MATERIALES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarMaterial(id) {
  return request(`${API_PATHS.MATERIALES}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarMaterial(id) {
  return request(`${API_PATHS.MATERIALES}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarMaterial(id) {
  return request(`${API_PATHS.MATERIALES}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerMaterialesActivos() {
  return request(`${API_PATHS.MATERIALES}/activos`);
}

export function buscarMaterialesPorNombre(nombre) {
  return request(`${API_PATHS.MATERIALES}/buscar?nombre=${encodeURIComponent(nombre)}`);
}

export function exportarMaterialesExcel(filtros = {}) {
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

  const query = searchParams.toString();
  const endpoint = query
    ? `${API_PATHS.MATERIALES}/reporte/excel?${query}`
    : `${API_PATHS.MATERIALES}/reporte/excel`;

  return request(endpoint, {
    method: "GET",
    responseType: "blob"
  });
}
