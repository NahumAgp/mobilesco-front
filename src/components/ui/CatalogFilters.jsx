export default function CatalogFilters({
  children,
  title = "Filtros",
  description,
  onClear,
  clearDisabled = false,
  className = ""
}) {
  return (
    <section
      className={["card catalog-filters-card", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <div className="card-body">
        <div className="catalog-filters-heading">
          <div>
            <h2 className="catalog-filters-title">{title}</h2>
            {description && <p className="catalog-filters-description">{description}</p>}
          </div>

          {onClear && (
            <button
              type="button"
              className="btn btn-sm catalog-brand-outline"
              onClick={onClear}
              disabled={clearDisabled}
            >
              <i className="bi bi-eraser me-1" aria-hidden="true"></i>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="row g-3 align-items-end">{children}</div>
      </div>
    </section>
  );
}
