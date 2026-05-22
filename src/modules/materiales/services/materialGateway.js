import {
  obtenerMateriales,
  obtenerMaterialPorId,
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
