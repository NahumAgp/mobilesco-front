import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// OPERACIONES
// ========================================

export function obtenerOperaciones() {
  console.log("🌐 GET Operaciones - URL:", API_PATHS.OPERACION);
  return request(API_PATHS.OPERACION).then(response => {
    // Transformar la respuesta si es necesario
    if (Array.isArray(response)) {
      return response.map(item => transformarOperacion(item));
    }
    if (response.content) {
      return {
        ...response,
        content: response.content.map(item => transformarOperacion(item))
      };
    }
    return transformarOperacion(response);
  });
}

export function obtenerOperacionPorId(id) {
  const url = `${API_PATHS.OPERACION}/${id}`;
  console.log("🌐 GET Operacion by ID - URL:", url);
  return request(url).then(data => transformarOperacion(data));
}

export function obtenerOperacionPorCodigo(codigo) {
  const url = `${API_PATHS.OPERACION}/codigo/${codigo}`;
  console.log("🌐 GET Operacion by Codigo - URL:", url);
  return request(url).then(data => transformarOperacion(data));
}

// Función auxiliar para transformar la respuesta
function transformarOperacion(item) {
  if (!item) return item;
  
  return {
    ...item,
    // Si necesitas alguna transformación específica
  };
}

export function crearOperacion(data) {
  console.log("🌐 POST Operacion - URL:", API_PATHS.OPERACION, "Data:", data);
  return request(API_PATHS.OPERACION, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarOperacion(id, data) {
  const url = `${API_PATHS.OPERACION}/${id}`;
  console.log("🌐 PUT Operacion - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarOperacion(id) {
  const url = `${API_PATHS.OPERACION}/${id}`;
  console.log("🌐 DELETE Operacion - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerOperacionesActivas() {
  const url = `${API_PATHS.OPERACION}/activos`;
  console.log("🌐 GET Operaciones Activas - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarOperacion(item));
    }
    return response;
  });
}

export function buscarOperaciones(nombre) {
  const url = `${API_PATHS.OPERACION}/buscar?nombre=${encodeURIComponent(nombre)}`;
  console.log("🌐 GET Buscar Operaciones - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarOperacion(item));
    }
    return response;
  });
}