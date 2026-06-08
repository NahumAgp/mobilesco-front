import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  obtenerCodigoSugerido,
  crearCategoria,
  actualizarCategoria,
  activarCategoria,
  desactivarCategoria,
  eliminarCategoria,
  obtenerCategoriasActivas,
  buscarCategoriasPorNombre,
  exportarCategoriasExcel,
} from "./categorias.js";

export function createHttpCategoriaGateway() {
  return {
    obtenerCategorias,
    obtenerCategoriaPorId,
    obtenerCodigoSugerido,
    crearCategoria,
    actualizarCategoria,
    activarCategoria,
    desactivarCategoria,
    eliminarCategoria,
    obtenerCategoriasActivas,
    buscarCategoriasPorNombre,
    exportarCategoriasExcel,
  };
}

export const categoriaGateway = createHttpCategoriaGateway();
