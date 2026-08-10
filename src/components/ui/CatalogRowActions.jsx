import { useLocation } from "react-router-dom";
import { getUser, hasPermission } from "../../modules/auth/services/authService";

const permissionsByPath = [
  ["/empleados", "ACTION_EMPLOYEES_EDIT", "ACTION_EMPLOYEES_STATUS"],
  ["/proveedores", "ACTION_SUPPLIERS_EDIT", "ACTION_SUPPLIERS_DELETE"],
  ["/clientes", "ACTION_CUSTOMERS_EDIT", "ACTION_CUSTOMERS_DELETE"],
  ["/insumos", "ACTION_INVENTORY_EDIT", "ACTION_INVENTORY_STATUS"],
  ["/productos", "ACTION_PRODUCTS_EDIT", "ACTION_PRODUCTS_STATUS"],
  ["/lineas-producto", "ACTION_PRODUCT_LINES_EDIT", "ACTION_PRODUCT_LINES_STATUS"],
  ["/familias", "ACTION_FAMILIES_EDIT", "ACTION_FAMILIES_STATUS"],
  ["/subfamilias", "ACTION_SUBFAMILIES_EDIT", "ACTION_SUBFAMILIES_STATUS"],
  ["/modelos", "ACTION_MODELS_EDIT", "ACTION_MODELS_STATUS"],
  ["/materiales", "ACTION_MATERIALS_EDIT", "ACTION_MATERIALS_STATUS"],
  ["/colores", "ACTION_COLORS_EDIT", "ACTION_COLORS_STATUS"],
  ["/operaciones", "ACTION_OPERATIONS_EDIT", "ACTION_OPERATIONS_DELETE"]
];

export default function CatalogRowActions({
  item,
  active,
  onEdit,
  onToggle,
  editLabel = "Editar",
  toggleActiveLabel = "Desactivar",
  toggleInactiveLabel = "Activar",
  editTitle = "Editar",
  toggleTitle,
  editDisabled = false,
  toggleDisabled = false,
  group = true,
  className = ""
}) {
  const { pathname } = useLocation();
  const permissionRule = permissionsByPath.find(([prefix]) => pathname.startsWith(prefix));
  const user = getUser();
  const canEdit = !permissionRule || hasPermission(user, permissionRule[1]);
  const canToggle = !permissionRule || hasPermission(user, permissionRule[2]);
  const isActive = Boolean(active);
  const resolvedToggleTitle = toggleTitle || (isActive ? toggleActiveLabel : toggleInactiveLabel);
  const buttons = (
    <>
      {onEdit && canEdit && (
        <button
          type="button"
          className="btn catalog-brand-outline"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(item);
          }}
          disabled={editDisabled}
          title={editTitle}
        >
          <i className="bi bi-pencil me-1"></i>
          {editLabel}
        </button>
      )}

      {onToggle && canToggle && (
        <button
          type="button"
          className="btn catalog-brand-danger"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(item);
          }}
          disabled={toggleDisabled}
          title={resolvedToggleTitle}
        >
          <i className={`bi ${isActive ? "bi-toggle-on" : "bi-toggle-off"} me-1`}></i>
          {isActive ? toggleActiveLabel : toggleInactiveLabel}
        </button>
      )}
    </>
  );

  if (!group) return buttons;

  return (
    <div
      className={["btn-group btn-group-sm catalog-row-actions", className]
        .filter(Boolean)
        .join(" ")}
      role="group"
    >
      {buttons}
    </div>
  );
}
