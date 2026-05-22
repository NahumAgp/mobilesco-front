import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// FAMILIAS
// ========================================

export function obtenerFamilias(params = {}) {
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

  return request(queryString ? `${API_PATHS.FAMILIAS}?${queryString}` : API_PATHS.FAMILIAS);
}

export function obtenerFamiliaPorId(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}`);
}

export function crearFamilia(data) {
  return request(API_PATHS.FAMILIAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarFamilia(id, data) {
  return request(`${API_PATHS.FAMILIAS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarFamilia(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarFamilia(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarFamilia(id) {
  return request(`${API_PATHS.FAMILIAS}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerFamiliasActivas() {
  return request(`${API_PATHS.FAMILIAS}/activas`);
}

export function exportarFamiliasExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.FAMILIAS}/reporte/excel?${query}`
    : `${API_PATHS.FAMILIAS}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}
