// services/modelos.js
import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// MODELOS
// ========================================

export function obtenerModelos(params = {}) {
  const page = typeof params === "number" ? params : params.page;
  const size = typeof params === "object" ? params.size : undefined;
  const sortBy = typeof params === "object" ? params.sortBy : undefined;
  const direction = typeof params === "object" ? params.direction : undefined;
  const busqueda = typeof params === "object" ? params.busqueda : undefined;
  const activo = typeof params === "object" ? params.activo : undefined;
  const familiaId = typeof params === "object" ? params.familiaId : undefined;

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

  if (familiaId !== undefined && familiaId !== null && familiaId !== "") {
    searchParams.set("familiaId", String(familiaId));
  }

  const queryString = searchParams.toString();
  return request(queryString ? `${API_PATHS.MODELOS}?${queryString}` : API_PATHS.MODELOS);
}

export function obtenerModeloPorId(id) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url);
}

export function crearModelo(data) {
  return request(API_PATHS.MODELOS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarModelo(id, data) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function obtenerCodigoSugerido(nombre, familiaId, subfamiliaId) {
  const params = new URLSearchParams({ nombre });
  if (familiaId !== undefined && familiaId !== null && familiaId !== "") {
    params.set("familiaId", String(familiaId));
  }
  if (subfamiliaId !== undefined && subfamiliaId !== null && subfamiliaId !== "") {
    params.set("subfamiliaId", String(subfamiliaId));
  }
  return request(`${API_PATHS.MODELOS}/codigo-sugerido?${params.toString()}`);
}

export function subirImagenModelo(id, archivo) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return request(`${API_PATHS.MODELOS}/${id}/imagen`, {
    method: "POST",
    body: formData,
  });
}

export function eliminarImagenModelo(id) {
  return request(`${API_PATHS.MODELOS}/${id}/imagen`, {
    method: "DELETE",
  });
}

export function activarModelo(id) {
  const url = `${API_PATHS.MODELOS}/${id}/activar`;
  return request(url, {
    method: "PATCH",
  });
}

export function desactivarModelo(id) {
  const url = `${API_PATHS.MODELOS}/${id}/desactivar`;
  return request(url, {
    method: "PATCH",
  });
}

export function eliminarModelo(id) {
  const url = `${API_PATHS.MODELOS}/${id}`;
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerModelosActivos() {
  const url = `${API_PATHS.MODELOS}/activos`;
  return request(url);
}

export function obtenerModelosPorFamilia(familiaId) {
  const url = `${API_PATHS.MODELOS}/por-familia/${familiaId}`;
  return request(url);
}

export function buscarModelos(nombre) {
  const url = `${API_PATHS.MODELOS}/buscar?nombre=${encodeURIComponent(nombre)}`;
  return request(url);
}

export function exportarModelosExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.MODELOS}/reporte/excel?${query}`
    : `${API_PATHS.MODELOS}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}
