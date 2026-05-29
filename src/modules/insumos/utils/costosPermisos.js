export const ROLES_GESTION_COSTOS = ["ADMIN", "SUPER_ADMIN", "SUBDIRECCION_ADMINISTRATIVA"];

export function puedeGestionarCostosInsumos(user) {
  return user?.roles?.some((rol) => ROLES_GESTION_COSTOS.includes(rol)) || false;
}
