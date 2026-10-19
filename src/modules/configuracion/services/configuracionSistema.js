import request from "../../../services/api.js";
import { API_PATHS } from "../../../config/apiPaths.js";

export function obtenerConfiguracionSistema() {
  return request(API_PATHS.CONFIGURACION_SISTEMA);
}

export function obtenerIdentidadPublica() {
  return request(API_PATHS.CONFIGURACION_PUBLICA);
}

export function actualizarConfiguracionSistema(payload) {
  return request(API_PATHS.CONFIGURACION_SISTEMA, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function subirLogoEmpresa(variante, archivo) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return request(`${API_PATHS.CONFIGURACION_SISTEMA}/logo/${variante}`, {
    method: "POST",
    body: formData,
  });
}
