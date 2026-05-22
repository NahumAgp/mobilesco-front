import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export function obtenerSalidasInsumos() {
  return request(API_PATHS.SALIDAS_INSUMOS);
}

export function obtenerSalidaInsumoPorId(id) {
  return request(`${API_PATHS.SALIDAS_INSUMOS}/${id}`);
}

export function crearSalidaInsumo(data) {
  return request(API_PATHS.SALIDAS_INSUMOS, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
