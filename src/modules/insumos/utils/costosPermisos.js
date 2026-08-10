import { hasPermission } from "../../auth/services/authService";

export function puedeGestionarCostosInsumos(user) {
  return hasPermission(user, "ACTION_INSUMOS_COSTS");
}

export function puedeGestionarCatalogoInsumos(user) {
  return hasPermission(user, "ACTION_INVENTORY_CREATE")
    || hasPermission(user, "ACTION_INVENTORY_EDIT")
    || hasPermission(user, "ACTION_INVENTORY_STATUS");
}

export function puedeAjustarStockManual(user) {
  return hasPermission(user, "ACTION_STOCK_ADJUSTMENTS");
}
