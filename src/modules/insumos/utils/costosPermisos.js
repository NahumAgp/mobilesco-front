export const ROLES_GESTION_COSTOS = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"];
export const ROLES_AJUSTE_MANUAL_STOCK = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"];
export const ROLES_GESTION_INSUMOS = [
  "ADMIN",
  "SUPER_ADMIN",
  "DIRECTOR_GENERAL",
  "JEFE_ALMACEN",
  "ALMACEN",
  "SUBDIRECCION_ADMINISTRATIVA"
];

export function puedeGestionarCostosInsumos(user) {
  return Boolean(
    user?.roles?.some((rol) => ROLES_GESTION_COSTOS.includes(rol)) ||
    user?.permisos?.includes("ACTION_INSUMOS_COSTS")
  );
}

export function puedeGestionarCatalogoInsumos(user) {
  return user?.roles?.some((rol) => ROLES_GESTION_INSUMOS.includes(rol)) || false;
}

export function puedeAjustarStockManual(user) {
  return user?.roles?.some((rol) => ROLES_AJUSTE_MANUAL_STOCK.includes(rol)) || false;
}
