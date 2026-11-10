// src/services/proveedoresService.js
import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// PROVEEDORES
// ========================================

export function obtenerProveedores(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.PROVEEDORES}?${query}`
    : API_PATHS.PROVEEDORES;

  return request(endpoint);
}

export function obtenerProveedorPorId(id) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`);
}

export function crearProveedor(data) {
  return request(API_PATHS.PROVEEDORES, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarProveedor(id, data) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function actualizarCalificacionProveedor(id, calificacionProveedor) {
  return request(`${API_PATHS.PROVEEDORES}/${id}/calificacion`, {
    method: "PATCH",
    body: JSON.stringify({ calificacionProveedor }),
  });
}

export function eliminarProveedor(id) {
  return request(`${API_PATHS.PROVEEDORES}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerTiposInsumo() {
  return request(`${API_PATHS.PROVEEDORES}/tipos-insumo`);
}

export function exportarProveedoresExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${API_PATHS.PROVEEDORES}/reporte/excel?${query}`
    : `${API_PATHS.PROVEEDORES}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}

export const descargarPlantillaProveedores = () =>
  request(`${API_PATHS.PROVEEDORES}/importacion/plantilla`, { responseType: "blob" });

export function procesarImportacionProveedores(archivo, confirmar = false) {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return request(`${API_PATHS.PROVEEDORES}/importacion${confirmar ? "" : "/vista-previa"}`, {
    method: "POST",
    body: datos,
  });
}
