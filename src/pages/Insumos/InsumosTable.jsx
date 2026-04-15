import { useState, useEffect } from "react";
import { obtenerCostoPromedio } from "../../services/kardex.js";

export default function InsumosTable({ data, onEditar, onEliminar, onAjustarStock }) {
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [tipoAjuste, setTipoAjuste] = useState("ENTRADA");
  const [motivo, setMotivo] = useState("");
  const [costosPromedio, setCostosPromedio] = useState({});
  const [loadingCostos, setLoadingCostos] = useState(false);

  // Cargar costos promedio para todos los insumos
  useEffect(() => {
    const cargarCostos = async () => {
      if (!data || data.length === 0) return;
      
      setLoadingCostos(true);
      const costos = {};
      
      try {
        // Cargar costo promedio de cada insumo en paralelo
        await Promise.all(
          data.map(async (insumo) => {
            try {
              const costo = await obtenerCostoPromedio(insumo.id);
              costos[insumo.id] = costo;
            } catch (error) {
              console.error(`Error cargando costo del insumo ${insumo.id}:`, error);
              costos[insumo.id] = 0;
            }
          })
        );
        setCostosPromedio(costos);
      } catch (error) {
        console.error("Error cargando costos promedio:", error);
      } finally {
        setLoadingCostos(false);
      }
    };

    cargarCostos();
  }, [data]);

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
      alert("Ingresa una cantidad válida");
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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <>
      <div className="card">
        <div
          className="table-responsive"
          style={{
            height: "calc(100vh - 400px)",
            overflowY: "auto"
          }}
        >
          <table className="table table-hover mb-0">
            <thead
              className="table-light"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                backgroundColor: "white"
              }}
            >
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Ubicación</th>
                <th>Unidad</th>
                <th className="text-end">Stock Actual</th>
                <th className="text-end">Stock Mínimo</th>
                <th className="text-end">Costo Promedio</th> {/* 👈 NUEVA COLUMNA */}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((insumo) => {
                  const stockStatus = getStockStatus(insumo);
                  return (
                    <tr
                      key={insumo.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onEditar(insumo)}
                      className={
                        stockStatus === "agotado" ? "table-danger" :
                        stockStatus === "bajo" ? "table-warning" : ""
                      }
                    >
                      <td>{insumo.id}</td>
                      <td>
                        <span className="fw-semibold">{insumo.nombre}</span>
                      </td>
                      <td>
                        {insumo.descripcion && insumo.descripcion.length > 50 
                          ? `${insumo.descripcion.substring(0, 50)}...` 
                          : insumo.descripcion || "-"}
                      </td>
                      <td>
                        {insumo.ubicacion || "-"}
                        {insumo.fila && insumo.columna && ` (${insumo.fila}-${insumo.columna})`}
                      </td>
                      <td>{insumo.unidadMedida?.simbolo || insumo.unidadMedida?.nombre || "-"}</td>
                      <td className="text-end fw-bold">
                        {insumo.stockActual?.toFixed(2) || "0.00"}
                      </td>
                      <td className="text-end">
                        {insumo.stockMinimo?.toFixed(2) || "-"}
                      </td>
                      <td className="text-end">
                        {loadingCostos ? (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <span className="fw-bold text-primary">
                            {formatCurrency(costosPromedio[insumo.id])}
                          </span>
                        )}
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
                              Stock Bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={(e) => abrirModalAjuste(insumo, e)}
                            title="Ajustar stock"
                          >
                            <i className="bi bi-plus-slash-minus"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditar(insumo);
                            }}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
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
                  <td colSpan="10" className="text-center text-muted py-5">
                    <i className="bi bi-boxes fs-1 d-block mb-3 text-secondary"></i>
                    <span className="fs-5">No hay insumos registrados</span>
                    <p className="text-secondary mt-2">Comienza creando un nuevo insumo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para ajuste de stock */}
      {showAjusteModal && insumoSeleccionado && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Ajustar Stock: {insumoSeleccionado.nombre}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Stock Actual</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={`${insumoSeleccionado.stockActual?.toFixed(2) || "0.00"} ${insumoSeleccionado.unidadMedida?.simbolo || insumoSeleccionado.unidadMedida?.nombre || ""}`}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Costo Promedio Actual</label>
                  <input
                    type="text"
                    className="form-control bg-light text-primary fw-bold"
                    value={formatCurrency(costosPromedio[insumoSeleccionado.id])}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tipo de Ajuste</label>
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
                  <label className="form-label fw-semibold">Motivo (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Compra, Ajuste, Merma..."
                  />
                </div>

                <div className="alert alert-info small">
                  <i className="bi bi-info-circle me-2"></i>
                  El stock se actualizará en la unidad de medida base: {insumoSeleccionado.unidadMedida?.simbolo || insumoSeleccionado.unidadMedida?.nombre || "N/A"}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAjustarStock}>
                  Aplicar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}