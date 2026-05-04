const COLUMNAS_ORDENABLES = {
  id: "ID",
  codigo: "Código",
  nombre: "Nombre",
  activo: "Estado",
  createdAt: "Creada"
};

function obtenerIconoOrden(sortField, sortDirection, field) {
  if (sortField !== field) {
    return "bi bi-arrow-down-up text-secondary";
  }

  return sortDirection === "asc"
    ? "bi bi-sort-down-alt text-primary"
    : "bi bi-sort-up text-primary";
}

export default function LineaProductoTable({
  data,
  onEditar,
  onEliminar,
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
    const ariaSort =
      sortField === field
        ? sortDirection === "asc"
          ? "ascending"
          : "descending"
        : "none";

    return (
      <th aria-sort={ariaSort}>
        {esOrdenable ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none lineas-sort-button"
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
    <div className="card shadow-sm border-0 lineas-table-card">
      <div className="table-responsive lineas-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light lineas-table-head">
            <tr>
              {renderHeader("id", "ID")}
              {renderHeader("codigo", "Código")}
              {renderHeader("nombre", "Nombre")}
              {renderHeader("activo", "Estado")}
              {renderHeader("createdAt", "Creada")}
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((linea) => (
                <tr
                  key={linea.id}
                  className="lineas-table-row"
                  onClick={() => onEditar(linea)}
                  role="button"
                >
                  <td>{linea.id}</td>

                  <td>
                    <span className="badge text-bg-light border lineas-code-badge">
                      {linea.codigo || "-"}
                    </span>
                  </td>

                  <td>
                    <div className="fw-semibold">
                      {linea.nombre || "-"}
                    </div>
                  </td>

                  <td>
                    <span
                      className={
                        linea.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {linea.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>{formatearFecha(linea.createdAt)}</td>

                  <td className="lineas-actions">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn lineas-brand-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(linea);
                        }}
                        title="Editar"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </button>

                      <button
                        className="btn lineas-brand-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminar(linea.id);
                        }}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5 d-block">No hay líneas de producto registradas</span>
                  <p className="text-secondary mt-2 mb-0">
                    Comienza creando una nueva línea de producto
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
