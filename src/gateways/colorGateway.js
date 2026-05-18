import {
  obtenerColores,
  obtenerColorPorId,
  crearColor,
  actualizarColor,
  activarColor,
  desactivarColor,
  eliminarColor,
} from "../services/color.js";

export function createHttpColorGateway() {
  return {
    obtenerColores,
    obtenerColorPorId,
    crearColor,
    actualizarColor,
    activarColor,
    desactivarColor,
    eliminarColor,
  };
}

export const colorGateway = createHttpColorGateway();
