import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export const obtenerResumenTablero = (periodo = "MES") =>
  request(`${API_PATHS.TABLERO}/resumen?periodo=${encodeURIComponent(periodo)}`);
