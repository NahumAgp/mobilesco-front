import {
  obtenerLineasProducto,
  obtenerLineaProductoPorId,
  crearLineaProducto,
  actualizarLineaProducto,
  activarLineaProducto,
  desactivarLineaProducto,
  eliminarLineaProducto,
  exportarLineasProductoExcel,
  obtenerLineasActivas,
  buscarLineasPorNombre,
} from "../services/lineaProducto.js";

export function createHttpLineaProductoGateway() {
  return {
    obtenerLineasProducto,
    obtenerLineaProductoPorId,
    crearLineaProducto,
    actualizarLineaProducto,
    activarLineaProducto,
    desactivarLineaProducto,
    eliminarLineaProducto,
    exportarLineasProductoExcel,
    obtenerLineasActivas,
    buscarLineasPorNombre,
  };
}

export const lineaProductoGateway = createHttpLineaProductoGateway();
