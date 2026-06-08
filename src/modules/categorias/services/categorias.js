import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// En productos, "Categoria" visualmente corresponde al catalogo backend de niveles.
const CATEGORIAS_PRODUCTO_PATH = API_PATHS.NIVELES;

export function obtenerCategorias(modeloId) {
  return modeloId
    ? request(`${CATEGORIAS_PRODUCTO_PATH}/por-modelo/${modeloId}`)
    : request(CATEGORIAS_PRODUCTO_PATH);
}

export function obtenerCategoriaPorId(id) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/${id}`);
}

export function obtenerCodigoSugerido(nombre, modeloId) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/codigo-sugerido?nombre=${encodeURIComponent(nombre)}&modeloId=${modeloId}`);
}

export function crearCategoria(data) {
  return request(CATEGORIAS_PRODUCTO_PATH, {
    method: "POST",
    body: JSON.stringify({
      nombre: data.nombre,
      descripcion: data.descripcion,
      modelo_id: data.modelo_id ?? data.modeloId
    }),
  });
}

export function actualizarCategoria(id, data) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function activarCategoria(id) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/${id}/activar`, {
    method: "PATCH",
  });
}

export function desactivarCategoria(id) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/${id}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarCategoria(id) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/${id}`, {
    method: "DELETE",
  });
}

export function obtenerCategoriasActivas() {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/activos`);
}

export function buscarCategoriasPorNombre(nombre) {
  return request(`${CATEGORIAS_PRODUCTO_PATH}/nombre/${encodeURIComponent(nombre)}`);
}

export function exportarCategoriasExcel(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query
    ? `${CATEGORIAS_PRODUCTO_PATH}/reporte/excel?${query}`
    : `${CATEGORIAS_PRODUCTO_PATH}/reporte/excel`;

  return request(endpoint, { responseType: "blob" });
}
