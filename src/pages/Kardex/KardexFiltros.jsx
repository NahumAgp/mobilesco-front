import React from "react";
import Card from "../../../components/ui/Card.jsx";

export default function KardexFiltros({
  insumos,
  insumoSeleccionado,
  onInsumoChange,
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  usarFiltroFechas,
  onUsarFiltroFechasChange,
  onConsultar,
  onLimpiar,
  loading
}) {
  return (
    <Card>
      <div className="row g-3 align-items-end">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Insumo</label>
          <select
            className="form-select"
            value={insumoSeleccionado}
            onChange={(e) => onInsumoChange(e.target.value)}
          >
            <option value="">Seleccionar insumo...</option>
            {insumos.map(ins => (
              <option key={ins.id} value={ins.id}>
                {ins.nombre} ({ins.unidadMedida?.simbolo || '?'})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={usarFiltroFechas}
              onChange={(e) => onUsarFiltroFechasChange(e.target.checked)}
              id="filtrarFechas"
            />
            <label className="form-check-label" htmlFor="filtrarFechas">
              Filtrar por fechas
            </label>
          </div>
        </div>

        {usarFiltroFechas && (
          <>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => onFechaInicioChange(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="col-md-2">
          <button
            className="btn btn-primary w-100"
            onClick={onConsultar}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Consultando...
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>
                Consultar
              </>
            )}
          </button>
        </div>

        <div className="col-md-1">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={onLimpiar}
            title="Limpiar"
          >
            <i className="bi bi-eraser"></i>
          </button>
        </div>
      </div>
    </Card>
  );
}