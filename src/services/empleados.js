import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// OBTENER TODOS LOS EMPLEADOS (GET)
// ========================================
export function obtenerEmpleados() {
  return request(API_PATHS.EMPLEADOS);
}

// ========================================
// OBTENER EMPLEADO POR ID (GET)
// ========================================
export function obtenerEmpleadoPorId(id) {
  return request(`${API_PATHS.EMPLEADOS}/${id}`);
}

// ========================================
// CREAR EMPLEADO (POST)
// ========================================
export function crearEmpleado(data) {
  return request(API_PATHS.EMPLEADOS, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// ========================================
// ACTUALIZAR EMPLEADO (PUT)
// ========================================
export function actualizarEmpleado(id, data) {
  return request(`${API_PATHS.EMPLEADOS}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

// ========================================
// ELIMINAR EMPLEADO (DELETE)
// ========================================
export function eliminarEmpleado(id) {
  return request(`${API_PATHS.EMPLEADOS}/${id}`, {
    method: "DELETE"
  });
}

// ========================================
// SUBIR FOTO
// ========================================

export function subirFotoPerfil(file) {

  const formData = new FormData();

  // ⚠️ clave correcta según tu backend
  formData.append("archivo", file);

  return request(API_PATHS.EMPLEADOS_ME_FOTO, {
    method: "POST",
    body: formData
  });
}