import CatalogRowActions from "../../../components/ui/CatalogRowActions.jsx";

const COLUMNAS_ORDENABLES = {
  id: "ID",
  nombre: "Nombre",
  ubicacion: "Ubicacion",
  stockActual: "Stock actual",
  stockMinimo: "Stock minimo",
  costoCotizacion: "Costo cotizacion",
  activo: "Estado",
  fechaRegistro: "Creado"
};

function obtenerIconoOrden(sortField, sortDirection, field) {
  if (sortField !== field) {
    return "bi bi-arrow-down-up text-secondary";
  }

  return sortDirection === "asc"
    ? "bi bi-sort-down-alt text-primary"
    : "bi bi-sort-up text-primary";
}

function renderHeaderLabel(label) {
  return (
    <span className="insumos-header-label">
      {String(label)
        .split(" ")
        .map((parte) => (
          <span key={parte}>{parte}</span>
        ))}
    </span>
  );
}

export default function InsumosTable({
  data,
  onEditar,
  onVerKardex,
  onCambiarEstado,
  puedeGestionar = false,
  sortField = "nombre",
  sortDirection = "asc",
  onSort
}) {
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
            className="btn btn-link p-0 text-decoration-none insumos-sort-button"
            onClick={() => onSort(field)}
          >
            {renderHeaderLabel(label)}
            <i className={`${obtenerIconoOrden(sortField, sortDirection, field)} ms-2`}></i>
          </button>
        ) : (
          renderHeaderLabel(label)
        )}
      </th>
    );
  };

  const getStockStatus = (insumo) => {
    if (insumo.stockActual <= 0) return "agotado";
    if (insumo.stockMinimo && insumo.stockActual <= insumo.stockMinimo) return "bajo";
    return "normal";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatTipoInsumo = (value) => {
    if (!value) return "-";
    return String(value).replace(/_/g, " ");
  };

  return (
    <>
      <div className="card shadow-sm border-0 insumos-table-card">
        <div className="table-responsive insumos-table-scroll">
          <table className="table table-hover align-middle mb-0 insumos-main-table">
            <thead className="table-light insumos-table-head">
              <tr>
                {renderHeader("id", "ID")}
                <th>{renderHeaderLabel("Codigo")}</th>
                {renderHeader("nombre", "Nombre")}
                <th>{renderHeaderLabel("Descripcion")}</th>
                <th>{renderHeaderLabel("Tipo")}</th>
                {renderHeader("ubicacion", "Ubicacion")}
                <th>{renderHeaderLabel("Unidad")}</th>
                {renderHeader("stockActual", "Stock actual")}
                {renderHeader("stockMinimo", "Stock minimo")}
                <th className="text-end">{renderHeaderLabel("Ultimo costo")}</th>
                <th>{renderHeaderLabel("Costo promedio")}</th>
                {renderHeader("costoCotizacion", "Costo cotizacion")}
                {renderHeader("activo", "Estado")}
                <th>{renderHeaderLabel("Acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((insumo) => {
                  const stockStatus = getStockStatus(insumo);
                  return (
                    <tr
                      key={insumo.id}
                      onClick={() => onVerKardex?.(insumo)}
                      className={`insumos-table-row insumos-row-${stockStatus}`}
                      role="button"
                    >
                      <td className="text-muted">#{insumo.id}</td>
                      <td>
                        <span className="badge text-bg-light border insumos-code-badge">
                          {insumo.codigoBarras || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold">{insumo.nombre}</span>
                      </td>
                      <td className="insumos-description">
                        {insumo.descripcion || "-"}
                      </td>
                      <td>
                        <span className="badge text-bg-light border insumos-unit-badge">
                          {formatTipoInsumo(insumo.tipoInsumo)}
                        </span>
                      </td>
                      <td>
                        {insumo.ubicacion || "-"}
                        {insumo.fila && insumo.columna ? ` (${insumo.fila}-${insumo.columna})` : ""}
                      </td>
                      <td>
                        <span className="badge text-bg-light border insumos-unit-badge">
                          {insumo.unidadMedida?.simbolo || insumo.unidadMedida?.nombre || "-"}
                        </span>
                      </td>
                      <td className="text-end fw-bold">
                        {Number(insumo.stockActual || 0).toFixed(2)}
                      </td>
                      <td className="text-end">
                        {insumo.stockMinimo !== null && insumo.stockMinimo !== undefined
                          ? Number(insumo.stockMinimo).toFixed(2)
                          : "-"}
                      </td>
                      <td className="text-end">
                        <span className="fw-bold text-secondary">
                          {formatCurrency(insumo.ultimoCostoCompra)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="fw-bold text-primary">
                          {formatCurrency(insumo.costoPromedio)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className={Number(insumo.costoCotizacion || 0) > 0 ? "fw-bold text-success" : "fw-bold text-danger"}>
                          {formatCurrency(insumo.costoCotizacion)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span
                            className={
                              insumo.activo
                                ? "badge bg-success-subtle text-success border border-success-subtle"
                                : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                            }
                          >
                            {insumo.activo ? "Activo" : "Inactivo"}
                          </span>
                          {stockStatus === "agotado" && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              Agotado
                            </span>
                          )}
                          {stockStatus === "bajo" && (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                              Stock bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="insumos-actions">
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          {puedeGestionar && (
                            <CatalogRowActions
                              item={insumo}
                              active={insumo.activo}
                              onEdit={onEditar}
                              onToggle={onCambiarEstado}
                              className="insumos-row-actions"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
                ) : (
                <tr>
                  <td colSpan="14" className="text-center text-muted py-5">
                    <i className="bi bi-boxes fs-1 d-block mb-3 text-secondary"></i>
                    <span className="fs-5 d-block">No hay insumos registrados</span>
                    <p className="text-secondary mt-2 mb-0">Comienza creando un nuevo insumo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  );
}
