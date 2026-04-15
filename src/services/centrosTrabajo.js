import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// CENTROS DE TRABAJO
// ========================================

export function obtenerCentrosTrabajo() {
  console.log("🌐 GET Centros Trabajo - URL:", API_PATHS.CENTRO_TRABAJO);
  return request(API_PATHS.CENTRO_TRABAJO);
}

export function obtenerCentroTrabajoPorId(id) {
  const url = `${API_PATHS.CENTRO_TRABAJO}/${id}`;
  console.log("🌐 GET Centro Trabajo by ID - URL:", url);
  return request(url);
}

export function obtenerCentroTrabajoPorCodigo(codigo) {
  const url = `${API_PATHS.CENTRO_TRABAJO}/codigo/${codigo}`;
  console.log("🌐 GET Centro Trabajo by Codigo - URL:", url);
  return request(url);
}

export function crearCentroTrabajo(data) {
  console.log("🌐 POST Centro Trabajo - URL:", API_PATHS.CENTRO_TRABAJO, "Data:", data);
  return request(API_PATHS.CENTRO_TRABAJO, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCentroTrabajo(id, data) {
  const url = `${API_PATHS.CENTRO_TRABAJO}/${id}`;
  console.log("🌐 PUT Centro Trabajo - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarCentroTrabajo(id) {
  const url = `${API_PATHS.CENTRO_TRABAJO}/${id}`;
  console.log("🌐 DELETE Centro Trabajo - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerCentrosTrabajoActivos() {
  const url = `${API_PATHS.CENTRO_TRABAJO}/activos`;
  console.log("🌐 GET Centros Trabajo Activos - URL:", url);
  return request(url);
}

export function buscarCentrosTrabajo(nombre) {
  const url = `${API_PATHS.CENTRO_TRABAJO}/buscar?nombre=${encodeURIComponent(nombre)}`;
  console.log("🌐 GET Buscar Centros Trabajo - URL:", url);
  return request(url);
}