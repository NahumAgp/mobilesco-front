import {
  obtenerMateriales,
  obtenerMaterialPorId,
  obtenerCodigoSugerido,
  crearMaterial,
  actualizarMaterial,
  activarMaterial,
  desactivarMaterial,
  eliminarMaterial,
  obtenerMaterialesActivos,
  exportarMaterialesExcel,
} from "./materiales.js";

export function createHttpMaterialGateway() {
  return {
    obtenerMateriales,
    obtenerMaterialPorId,
    obtenerCodigoSugerido,
    crearMaterial,
    actualizarMaterial,
    activarMaterial,
    desactivarMaterial,
    eliminarMaterial,
    obtenerMaterialesActivos,
    exportarMaterialesExcel,
  };
}

export const materialGateway = createHttpMaterialGateway();
