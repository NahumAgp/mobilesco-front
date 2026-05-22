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
  const isActive = Boolean(active);
  const resolvedToggleTitle = toggleTitle || (isActive ? toggleActiveLabel : toggleInactiveLabel);
  const buttons = (
    <>
      {onEdit && (
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

      {onToggle && (
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
