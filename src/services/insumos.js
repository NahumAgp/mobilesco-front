import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// INSUMOS
// ========================================

export function obtenerInsumos() {
  console.log("🌐 GET Insumos - URL:", API_PATHS.INSUMOS);
  return request(API_PATHS.INSUMOS).then(response => {
    // Transformar para crear el objeto unidadMedida
    if (Array.isArray(response)) {
      return response.map(item => transformarInsumo(item));
    }
    if (response.content) {
      return {
        ...response,
        content: response.content.map(item => transformarInsumo(item))
      };
    }
    return transformarInsumo(response);
  });
}

export function obtenerInsumoPorId(id) {
  const url = `${API_PATHS.INSUMOS}/${id}`;
  console.log("🌐 GET Insumo by ID - URL:", url);
  return request(url).then(data => transformarInsumo(data));
}

// Función auxiliar para transformar la respuesta plana a objeto anidado
function transformarInsumo(item) {
  if (!item) return item;
  
  return {
    ...item,
    unidadMedida: item.unidadMedidaId ? {
      id: item.unidadMedidaId,
      nombre: item.unidadMedidaNombre,
      simbolo: item.unidadMedidaSimbolo
    } : null
  };
}

// Para crear/actualizar, necesitas enviar unidadMedidaId
export function crearInsumo(data) {
  // data viene con unidadMedidaId del formulario
  console.log("🌐 POST Insumo - URL:", API_PATHS.INSUMOS, "Data:", data);
  return request(API_PATHS.INSUMOS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarInsumo(id, data) {
  const url = `${API_PATHS.INSUMOS}/${id}`;
  console.log("🌐 PUT Insumo - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// El resto de funciones igual...
export function eliminarInsumo(id) {
  const url = `${API_PATHS.INSUMOS}/${id}`;
  console.log("🌐 DELETE Insumo - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function obtenerInsumosActivos() {
  const url = `${API_PATHS.INSUMOS}/activos`;
  console.log("🌐 GET Insumos Activos - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarInsumo(item));
    }
    return response;
  });
}

export function buscarInsumos(nombre) {
  const url = `${API_PATHS.INSUMOS}/buscar?nombre=${encodeURIComponent(nombre)}`;
  console.log("🌐 GET Buscar Insumos - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarInsumo(item));
    }
    return response;
  });
}

export function obtenerInsumosPorUnidadMedida(unidadMedidaId) {
  const url = `${API_PATHS.INSUMOS}/unidad-medida/${unidadMedidaId}`;
  console.log("🌐 GET Insumos por Unidad Medida - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarInsumo(item));
    }
    return response;
  });
}

export function obtenerInsumosStockBajo() {
  const url = `${API_PATHS.INSUMOS}/stock-bajo`;
  console.log("🌐 GET Insumos Stock Bajo - URL:", url);
  return request(url).then(response => {
    if (Array.isArray(response)) {
      return response.map(item => transformarInsumo(item));
    }
    return response;
  });
}

export function ajustarStock(id, cantidad, tipo, motivo) {
  const url = `${API_PATHS.INSUMOS}/${id}/ajustar-stock?cantidad=${cantidad}&tipo=${tipo}${motivo ? `&motivo=${encodeURIComponent(motivo)}` : ''}`;
  console.log("🌐 POST Ajustar Stock - URL:", url);
  return request(url, {
    method: "POST",
  });
}