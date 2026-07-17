import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

const COLUMNAS_ORDENABLES = {
  id: "ID",
  codigo: "Codigo",
  nombre: "Nombre",
  activo: "Estado",
  createdAt: "Registro"
};

function obtenerIconoOrden(sortField, sortDirection, field) {
  if (sortField !== field) return "bi bi-arrow-down-up text-secondary";
  return sortDirection === "asc"
    ? "bi bi-sort-down-alt text-primary"
    : "bi bi-sort-up text-primary";
}

export default function SubfamiliasTable({
  data,
  onEditar,
  onCambiarEstado,
  sortField = "nombre",
  sortDirection = "asc",
  onSort
}) {
  const formatearFecha = (valor) => {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const renderHeader = (field, label) => {
    const esOrdenable = Boolean(onSort) && Object.prototype.hasOwnProperty.call(COLUMNAS_ORDENABLES, field);
    return (
      <th aria-sort={sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
        {esOrdenable ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none catalog-sort-button familias-sort-button"
            onClick={() => onSort(field)}
          >
            <span>{label}</span>
            <i className={`${obtenerIconoOrden(sortField, sortDirection, field)} ms-2`}></i>
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  return (
    <div className="card shadow-sm border-0 catalog-table-card familias-table-card">
      <div className="table-responsive catalog-table-scroll familias-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head familias-table-head">
            <tr>
              {renderHeader("id", "ID")}
              {renderHeader("codigo", "Codigo")}
              {renderHeader("nombre", "Nombre")}
              <th>Descripcion</th>
              <th>Linea / Familia</th>
              {renderHeader("createdAt", "Registro")}
              {renderHeader("activo", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data?.length ? (
              data.map((subfamilia) => (
                <tr
                  key={subfamilia.id}
                  className="catalog-table-row familias-table-row"
                  onClick={() => onEditar(subfamilia)}
                  role="button"
                >
                  <td>{subfamilia.id}</td>
                  <td>
                    <span className="badge text-bg-light border catalog-code-badge familias-code-badge">
                      {subfamilia.codigo || "-"}
                    </span>
                  </td>
                  <td><div className="fw-semibold">{subfamilia.nombre || "-"}</div></td>
                  <td>
                    <div className="catalog-description familias-description text-muted">
                      {subfamilia.descripcion || "-"}
                    </div>
                  </td>
                  <td>{[subfamilia.lineaNombre, subfamilia.familiaNombre].filter(Boolean).join(" / ") || "-"}</td>
                  <td>{formatearFecha(subfamilia.createdAt)}</td>
                  <td><CatalogStatusBadge active={subfamilia.activo} /></td>
                  <td className="catalog-actions familias-actions">
                    <CatalogRowActions
                      item={subfamilia}
                      active={subfamilia.activo}
                      onEdit={onEditar}
                      onToggle={onCambiarEstado}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-diagram-2 fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5 d-block">No hay subfamilias registradas</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
