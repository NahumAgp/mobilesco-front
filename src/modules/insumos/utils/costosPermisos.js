export const ROLES_GESTION_COSTOS = ["ADMIN", "SUPER_ADMIN", "SUBDIRECCION_ADMINISTRATIVA"];
export const ROLES_GESTION_INSUMOS = [
  "ADMIN",
  "SUPER_ADMIN",
  "JEFE_ALMACEN",
  "ALMACEN",
  "SUBDIRECCION_ADMINISTRATIVA"
];

export function puedeGestionarCostosInsumos(user) {
  return user?.roles?.some((rol) => ROLES_GESTION_COSTOS.includes(rol)) || false;
}

export function puedeGestionarCatalogoInsumos(user) {
  return user?.roles?.some((rol) => ROLES_GESTION_INSUMOS.includes(rol)) || false;
}
