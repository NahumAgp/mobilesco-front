import request from "./api";
import { API_PATHS } from "../config/apiPaths";

// ========================================
// OBTENER TODAS LAS UNIDADES DE MEDIDA (GET)
// ========================================
export function obtenerUnidadesMedida() {
    return request(API_PATHS.UNIDADES_MEDIDA);
}

// ========================================
// OBTENER UNIDAD POR ID (GET)
// ========================================
export function obtenerUnidadMedidaPorId(id) {
    return request(`${API_PATHS.UNIDADES_MEDIDA}/${id}`);
}

// ========================================
// CREAR UNIDAD DE MEDIDA (POST)
// ========================================
export function crearUnidadMedida(data) {
    return request(API_PATHS.UNIDADES_MEDIDA, {
        method: "POST",
        body: JSON.stringify(data)
    });
}

// ========================================
// ACTUALIZAR UNIDAD DE MEDIDA (PUT)
// ========================================
export function actualizarUnidadMedida(id, data) {
    return request(`${API_PATHS.UNIDADES_MEDIDA}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

// ========================================
// ELIMINAR UNIDAD DE MEDIDA (DELETE)
// ========================================
export function eliminarUnidadMedida(id) {
    return request(`${API_PATHS.UNIDADES_MEDIDA}/${id}`, {
        method: "DELETE"
    });
}