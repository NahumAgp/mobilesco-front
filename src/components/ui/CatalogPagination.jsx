function buildPageRange(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages = [0];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  if (start > 1) pages.push("...");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 2) pages.push("...");
  pages.push(totalPages - 1);

  return pages;
}

export default function CatalogPagination({
  currentPage = 0,
  totalPages = 0,
  totalElements = 0,
  pageSize = 10,
  currentCount = 0,
  itemLabel = "registros",
  summary,
  ariaLabel = "Paginación",
  onPageChange,
  className = ""
}) {
  if (!totalElements || totalElements <= 0) return null;

  const safeTotalPages = Math.max(totalPages || 0, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 0), safeTotalPages - 1);
  const pages = buildPageRange(safeTotalPages, safeCurrentPage);
  const firstItem = safeCurrentPage * pageSize + 1;
  const lastItem = safeCurrentPage * pageSize + currentCount;
  const resolvedSummary =
    summary || `Mostrando ${firstItem} a ${lastItem} de ${totalElements} ${itemLabel}`;
  const isFirst = safeCurrentPage <= 0;
  const isLast = safeCurrentPage >= safeTotalPages - 1;

  const goToPage = (page) => {
    if (!onPageChange) return;
    if (page < 0 || page >= safeTotalPages || page === safeCurrentPage) return;
    onPageChange(page);
  };

  return (
    <div className={["catalog-pagination-panel", className].filter(Boolean).join(" ")}>
      <div className="catalog-pagination-summary">{resolvedSummary}</div>

      <nav aria-label={ariaLabel}>
        <ul className="pagination mb-0 flex-wrap">
          <li className={`page-item ${isFirst ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => goToPage(0)}
              disabled={isFirst}
            >
              Primera
            </button>
          </li>

          <li className={`page-item ${isFirst ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={isFirst}
            >
              Anterior
            </button>
          </li>

          {pages.map((page, index) =>
            page === "..." ? (
              <li key={`dots-${index}`} className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            ) : (
              <li key={`page-${page}`} className={`page-item ${safeCurrentPage === page ? "active" : ""}`}>
                <button type="button" className="page-link" onClick={() => goToPage(page)}>
                  {page + 1}
                </button>
              </li>
            )
          )}

          <li className={`page-item ${isLast ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={isLast}
            >
              Siguiente
            </button>
          </li>

          <li className={`page-item ${isLast ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => goToPage(safeTotalPages - 1)}
              disabled={isLast}
            >
              Última
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
