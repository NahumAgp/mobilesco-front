import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

const CATEGORIAS_GLOBAL_PATH = API_PATHS.CATEGORIA_REAL;

export function obtenerCategoriasGlobalesActivas() {
  return request(`${CATEGORIAS_GLOBAL_PATH}/activos`);
}

export function crearCategoriaGlobal(data) {
  return request(CATEGORIAS_GLOBAL_PATH, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function buscarCategoriasGlobales(nombre) {
  return request(`${CATEGORIAS_GLOBAL_PATH}/buscar?nombre=${encodeURIComponent(nombre)}`);
}
