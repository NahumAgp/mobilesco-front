import { useState } from "react";

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
  onEliminar,
  onAjustarStock,
  sortField = "nombre",
  sortDirection = "asc",
  onSort
}) {
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [tipoAjuste, setTipoAjuste] = useState("ENTRADA");
  const [motivo, setMotivo] = useState("");

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

  const abrirModalAjuste = (insumo, e) => {
    e.stopPropagation();
    setInsumoSeleccionado(insumo);
    setShowAjusteModal(true);
    setCantidad("");
    setMotivo("");
  };

  const cerrarModal = () => {
    setShowAjusteModal(false);
    setInsumoSeleccionado(null);
  };

  const handleAjustarStock = () => {
    if (!cantidad || parseFloat(cantidad) <= 0) {
      alert("Ingresa una cantidad valida");
      return;
    }
    onAjustarStock(insumoSeleccionado.id, parseFloat(cantidad), tipoAjuste, motivo);
    cerrarModal();
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
                      onClick={() => onEditar(insumo)}
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
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn insumos-brand-outline"
                            onClick={(e) => abrirModalAjuste(insumo, e)}
                            title="Ajustar stock"
                          >
                            <i className="bi bi-plus-slash-minus"></i>
                          </button>
                          <button
                            className="btn insumos-brand-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditar(insumo);
                            }}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn insumos-brand-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminar(insumo.id);
                            }}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" className="text-center text-muted py-5">
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

      {showAjusteModal && insumoSeleccionado && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Ajustar stock: {insumoSeleccionado.nombre}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Stock actual</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={`${Number(insumoSeleccionado.stockActual || 0).toFixed(2)} ${insumoSeleccionado.unidadMedida?.simbolo || insumoSeleccionado.unidadMedida?.nombre || ""}`}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Costo promedio actual</label>
                  <input
                    type="text"
                    className="form-control bg-light text-primary fw-bold"
                    value={formatCurrency(insumoSeleccionado.costoPromedio)}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tipo de ajuste</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="tipoAjuste"
                        id="entrada"
                        value="ENTRADA"
                        checked={tipoAjuste === "ENTRADA"}
                        onChange={(e) => setTipoAjuste(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="entrada">
                        <span className="text-success">Entrada (+)</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="tipoAjuste"
                        id="salida"
                        value="SALIDA"
                        checked={tipoAjuste === "SALIDA"}
                        onChange={(e) => setTipoAjuste(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="salida">
                        <span className="text-danger">Salida (-)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Cantidad <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Motivo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: compra, ajuste, merma..."
                  />
                </div>

                <div className="alert alert-info small">
                  <i className="bi bi-info-circle me-2"></i>
                  El stock se actualizara en la unidad base: {insumoSeleccionado.unidadMedida?.simbolo || insumoSeleccionado.unidadMedida?.nombre || "N/A"}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAjustarStock}>
                  Aplicar ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
