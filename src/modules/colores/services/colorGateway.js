import {
  obtenerColores,
  obtenerColorPorId,
  obtenerCodigoSugerido,
  crearColor,
  actualizarColor,
  activarColor,
  desactivarColor,
  eliminarColor,
} from "./color.js";

export function createHttpColorGateway() {
  return {
    obtenerColores,
    obtenerColorPorId,
    obtenerCodigoSugerido,
    crearColor,
    actualizarColor,
    activarColor,
    desactivarColor,
    eliminarColor,
  };
}

export const colorGateway = createHttpColorGateway();
