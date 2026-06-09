import request from "../../../../services/api";
import { API_PATHS } from "../../../../config/apiPaths";
import { obtenerCompras, obtenerCompraPorId } from "../../../compras/services/compras.js";

export function obtenerEntradas() {
  return obtenerCompras();
}

export function obtenerEntradaPorId(id) {
  return obtenerCompraPorId(id);
}

export function recepcionarDetalleCompra(detalleId, { cantidadRecibida, entregadoPor, motivoNoRecepcion }) {
  const params = new URLSearchParams({
    cantidadRecibida: String(cantidadRecibida)
  });

  if (entregadoPor) {
    params.set("entregadoPor", entregadoPor);
  }

  if (motivoNoRecepcion) {
    params.set("motivoNoRecepcion", motivoNoRecepcion);
  }

  return request(`${API_PATHS.DETALLES_COMPRA}/${detalleId}/recibir?${params.toString()}`, {
    method: "PATCH"
  });
}
