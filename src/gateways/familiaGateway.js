import {
  obtenerFamilias,
  obtenerFamiliaPorId,
  crearFamilia,
  actualizarFamilia,
  activarFamilia,
  desactivarFamilia,
  eliminarFamilia,
  obtenerFamiliasActivas,
  exportarFamiliasExcel,
} from "../services/familias.js";

export function createHttpFamiliaGateway() {
  return {
    obtenerFamilias,
    obtenerFamiliaPorId,
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
