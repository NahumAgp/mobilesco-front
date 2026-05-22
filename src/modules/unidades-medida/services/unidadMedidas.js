import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

// ========================================
// OBTENER TODAS LAS UNIDADES DE MEDIDA (GET)
// ========================================
export function obtenerUnidadesMedida(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    });

    const query = searchParams.toString();
    return request(query ? `${API_PATHS.UNIDADES_MEDIDA}?${query}` : API_PATHS.UNIDADES_MEDIDA);
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

export function exportarUnidadesMedidaExcel(filtros = {}) {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });

    const query = params.toString();
    const endpoint = query
        ? `${API_PATHS.UNIDADES_MEDIDA}/reporte/excel?${query}`
        : `${API_PATHS.UNIDADES_MEDIDA}/reporte/excel`;

    return request(endpoint, { responseType: "blob" });
}
