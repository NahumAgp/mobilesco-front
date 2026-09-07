import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export const obtenerConjuntos = () => request(`${API_PATHS.INSUMOS}/conjuntos`);
export const guardarConjunto = (conjunto) => request(
  `${API_PATHS.INSUMOS}/conjuntos${conjunto.id ? `/${conjunto.id}` : ""}`,
  { method: conjunto.id ? "PUT" : "POST", body: JSON.stringify(conjunto) }
);

export const conjuntoComoInsumo = (conjunto) => ({
  ...conjunto,
  conjunto: true,
  costoCotizacionOriginal: conjunto.costoCotizacion,
});
