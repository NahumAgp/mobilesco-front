// Usar variable de entorno para flexibilidad
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// O si usas process.env (React sin Vite):
// export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
