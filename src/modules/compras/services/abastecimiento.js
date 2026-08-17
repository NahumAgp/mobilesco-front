import { API_PATHS } from "../../../config/apiPaths";
import request from "../../../services/api";

export function obtenerSugerenciasAbastecimiento() {
  return request(`${API_PATHS.ABASTECIMIENTO}/sugerencias`);
}

export function generarComprasBorrador(sugerencias) {
  return request(`${API_PATHS.ABASTECIMIENTO}/compras-borrador`, {
    method: "POST",
    body: JSON.stringify({ sugerencias }),
  });
}
