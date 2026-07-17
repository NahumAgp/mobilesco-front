import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// COMPRAS
// ========================================

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function obtenerCompras(params = {}) {
  const query = buildQuery(params);
  const url = `${API_PATHS.COMPRAS}${query}`;
  console.log("🌐 GET Compras - URL:", API_PATHS.COMPRAS);
  return request(url);
}

export function obtenerCompraPorId(id) {
  const url = `${API_PATHS.COMPRAS}/${id}`;
  console.log("🌐 GET Compra by ID - URL:", url);
  return request(url);
}

export function obtenerCuentasPorPagar(params = {}) {
  const filtros = typeof params === "string" ? { estado: params } : params;
  const query = buildQuery(filtros);
  return request(`${API_PATHS.CUENTAS_POR_PAGAR}${query}`);
}

export function obtenerCuentaPorPagarPorId(id) {
  return request(`${API_PATHS.CUENTAS_POR_PAGAR}/${id}`);
}

export function registrarPagoCuentaPorPagar(id, data) {
  return request(`${API_PATHS.CUENTAS_POR_PAGAR}/${id}/pagos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function exportarCuentasPorPagarExcel(params = {}) {
  const query = buildQuery(params);
  return request(`${API_PATHS.CUENTAS_POR_PAGAR}/reporte/excel${query}`, {
    responseType: "blob"
  });
}

export function crearCompra(data) {
  console.log("🌐 POST Compra - URL:", API_PATHS.COMPRAS, "Data:", data);
  return request(API_PATHS.COMPRAS, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCompra(id, data) {
  const url = `${API_PATHS.COMPRAS}/${id}`;
  console.log("🌐 PUT Compra - URL:", url, "Data:", data);
  return request(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarCompra(id) {
  const url = `${API_PATHS.COMPRAS}/${id}`;
  console.log("🌐 DELETE Compra - URL:", url);
  return request(url, {
    method: "DELETE",
  });
}

export function recibirCompra(id) {
  const url = `${API_PATHS.COMPRAS}/${id}/recibir`;
  console.log("🌐 POST Recibir Compra - URL:", url);
  return request(url, {
    method: "POST",
  });
}

export function cancelarCompra(id, motivo) {
  const url = `${API_PATHS.COMPRAS}/${id}/cancelar?motivo=${encodeURIComponent(motivo)}`;
  console.log("🌐 POST Cancelar Compra - URL:", url);
  return request(url, {
    method: "POST",
  });
}

export function obtenerComprasPorProveedor(proveedorId) {
  const url = `${API_PATHS.COMPRAS}/proveedor/${proveedorId}`;
  console.log("🌐 GET Compras por Proveedor - URL:", url);
  return request(url);
}

export function obtenerComprasPorEstado(estado) {
  const url = `${API_PATHS.COMPRAS}/estado/${estado}`;
  console.log("🌐 GET Compras por Estado - URL:", url);
  return request(url);
}

export function obtenerComprasPorRangoFechas(fechaInicio, fechaFin) {
  const url = `${API_PATHS.COMPRAS}/rango-fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  console.log("🌐 GET Compras por Rango Fechas - URL:", url);
  return request(url);
}

export function buscarComprasPorFolio(folio) {
  const url = `${API_PATHS.COMPRAS}/buscar?folio=${encodeURIComponent(folio)}`;
  console.log("🌐 GET Buscar Compras - URL:", url);
  return request(url);
}
