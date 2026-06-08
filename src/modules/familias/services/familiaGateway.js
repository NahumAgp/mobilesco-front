import {
  obtenerFamilias,
  obtenerFamiliaPorId,
  obtenerCodigoSugerido,
  crearFamilia,
  actualizarFamilia,
  activarFamilia,
  desactivarFamilia,
  eliminarFamilia,
  obtenerFamiliasActivas,
  exportarFamiliasExcel,
} from "./familias.js";

export function createHttpFamiliaGateway() {
  return {
    obtenerFamilias,
    obtenerFamiliaPorId,
    obtenerCodigoSugerido,
    crearFamilia,
    actualizarFamilia,
    activarFamilia,
    desactivarFamilia,
    eliminarFamilia,
    obtenerFamiliasActivas,
    exportarFamiliasExcel,
  };
}

export const familiaGateway = createHttpFamiliaGateway();
