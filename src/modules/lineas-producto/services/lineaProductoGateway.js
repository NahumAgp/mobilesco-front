import {
  obtenerLineasProducto,
  obtenerLineaProductoPorId,
  obtenerCodigoSugerido,
  crearLineaProducto,
  actualizarLineaProducto,
  activarLineaProducto,
  desactivarLineaProducto,
  eliminarLineaProducto,
  exportarLineasProductoExcel,
  obtenerLineasActivas,
  buscarLineasPorNombre,
} from "./lineaProducto.js";

export function createHttpLineaProductoGateway() {
  return {
    obtenerLineasProducto,
    obtenerLineaProductoPorId,
    obtenerCodigoSugerido,
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
