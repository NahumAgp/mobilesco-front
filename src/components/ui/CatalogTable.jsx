export function CatalogEmptyState({
  colSpan,
  icon = "bi-inbox",
  title = "No hay registros",
  description
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="catalog-empty-state" role="status">
          <span className="catalog-empty-icon" aria-hidden="true">
            <i className={`bi ${icon}`}></i>
          </span>
          <strong>{title}</strong>
          {description && <p>{description}</p>}
        </div>
      </td>
    </tr>
  );
}

export default function CatalogTable({
  children,
  className = "",
  scrollClassName = "",
  ariaLabel = "Tabla de datos. Desliza horizontalmente para ver todas las columnas."
}) {
  return (
    <div className={["card catalog-table-card", className].filter(Boolean).join(" ")}>
      <div
        className={["table-responsive catalog-table-scroll mobile-table-region", scrollClassName]
          .filter(Boolean)
          .join(" ")}
        role="region"
        aria-label={ariaLabel}
        tabIndex="0"
      >
        {children}
      </div>
    </div>
  );
}
