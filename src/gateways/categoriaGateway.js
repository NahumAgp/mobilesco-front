import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  activarCategoria,
  desactivarCategoria,
  eliminarCategoria,
  obtenerCategoriasActivas,
  buscarCategoriasPorNombre,
  exportarCategoriasExcel,
} from "../services/categorias.js";

export function createHttpCategoriaGateway() {
  return {
    obtenerCategorias,
    obtenerCategoriaPorId,
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
