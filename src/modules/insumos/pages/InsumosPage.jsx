import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useInsumos } from "../hooks/useInsumos";
import { exportarInsumosExcel } from "../services/insumos.js";
import { getUser } from "../../auth/services/authService.js";
import {
  puedeAjustarStockManual,
  puedeGestionarCatalogoInsumos,
  puedeGestionarCostosInsumos
} from "../utils/costosPermisos.js";
import InsumosTable from "./InsumosTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./InsumosPage.css";

const PAGE_SIZE = 10;

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) paginas.push("...");
  for (let page = inicio; page <= fin; page += 1) paginas.push(page);
  if (fin < totalPages - 2) paginas.push("...");

  paginas.push(totalPages - 1);
  return paginas;
}

export default function InsumosPage() {
  const navigate = useNavigate();
  const user = getUser();
  const puedeGestionarInsumos = puedeGestionarCatalogoInsumos(user);
  const puedeGestionarCostos = puedeGestionarCostosInsumos(user);
  const puedeAjustarStock = puedeAjustarStockManual(user);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [ajusteStock, setAjusteStock] = useState(null);
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  // Debounce: actualiza el termino de busqueda real desde el input (~350ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBusqueda(busquedaInput);
      setPage(0);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [busquedaInput]);

  // Derivar el filtro de estatus para el backend
  const activoBackend =
    filtroEstatus === "ACTIVO" || soloActivos
      ? true
      : filtroEstatus === "INACTIVO"
        ? false
        : undefined;
  const stockBajoBackend = filtroStockBajo ? true : undefined;
  const terminoBusqueda = busqueda.trim();

  const {
    insumos,
    pageInfo,
    loadingLista,
    error,
    actualizarEstadoInsumo,
    ajustarStock
  } = useInsumos({
    page,
    size: PAGE_SIZE,
    sortBy: sortField,
    direction: sortDirection,
    busqueda: terminoBusqueda || undefined,
    activo: activoBackend,
    stockBajo: stockBajoBackend
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + insumos.length : 0;

  const hayFiltrosActivos =
    Boolean(terminoBusqueda) || filtroEstatus !== "TODOS" || soloActivos || filtroStockBajo;
  const mostrarVacio = !loadingLista && !error && totalElements === 0 && !hayFiltrosActivos;
  const mostrarSinCoincidencias =
    !loadingLista && !error && totalElements === 0 && hayFiltrosActivos;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => setPage(nextPage), 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (insumo) => {
    navigate(`/insumos/${insumo.id}`);
  };

  const abrirKardex = (insumo) => {
    navigate(`/kardex?insumoId=${insumo.id}`);
  };

  const manejarCambiarEstado = async (insumo) => {
    const siguienteEstado = !insumo.activo;
    const accion = siguienteEstado ? "activar" : "desactivar";
    const confirmacion = window.confirm(`Seguro que deseas ${accion} este insumo?`);
    if (!confirmacion) return;

    try {
      await actualizarEstadoInsumo(insumo.id, siguienteEstado);
      setToastType("success");
      setToastMessage(`Insumo ${siguienteEstado ? "activado" : "desactivado"} correctamente`);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message || `Error al ${accion} insumo`);
    }
  };

  const abrirAjusteStock = (insumo) => {
    setAjusteStock({
      insumo,
      tipo: "ENTRADA",
      cantidad: "",
      motivo: ""
    });
  };

  const cerrarAjusteStock = () => {
    if (!guardandoAjuste) setAjusteStock(null);
  };

  const confirmarAjusteStock = async (event) => {
    event.preventDefault();
    if (!ajusteStock?.insumo) return;

    const cantidad = Number(ajusteStock.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setToastType("danger");
      setToastMessage("La cantidad del ajuste debe ser mayor a cero.");
      return;
    }
    const motivo = ajusteStock.motivo.trim();
    if (!motivo) {
      setToastType("danger");
      setToastMessage("Escribe el motivo del ajuste.");
      return;
    }

    const accion = ajusteStock.tipo === "SALIDA" ? "descontar" : "agregar";
    const confirmado = window.confirm(
      `Se va a ${accion} ${cantidad.toFixed(2)} al stock de ${ajusteStock.insumo.nombre}. ¿Confirmas el ajuste manual?`
    );
    if (!confirmado) return;

    try {
      setGuardandoAjuste(true);
      await ajustarStock(
        ajusteStock.insumo.id,
        cantidad,
        ajusteStock.tipo,
        motivo
      );
      setToastType("success");
      setToastMessage("Stock actualizado correctamente.");
      setAjusteStock(null);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message || "No se pudo actualizar el stock.");
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarInsumosExcel({
        activo: activoBackend,
        stockBajo: stockBajoBackend,
        busqueda: terminoBusqueda || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "insumos.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastType("success");
      setToastMessage("Reporte de Excel generado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("No se pudo generar el reporte de Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 0) return;
    if (totalPages > 0 && nuevaPagina >= totalPages) return;
    setPage(nuevaPagina);
  };

  const manejarOrden = (campo) => {
    if (sortField === campo) {
      setSortDirection((direccionActual) => (direccionActual === "asc" ? "desc" : "asc"));
    } else {
      setSortDirection("asc");
      setSortField(campo);
    }

    setPage(0);
  };

  const cambiarBusqueda = (e) => {
    setBusquedaInput(e.target.value);
  };

  const cambiarEstatus = (e) => {
    setFiltroEstatus(e.target.value);
    setPage(0);
  };

  const cambiarSoloActivos = (e) => {
    setSoloActivos(e.target.checked);
    setPage(0);
  };

  const cambiarStockBajo = (e) => {
    setFiltroStockBajo(e.target.checked);
    setPage(0);
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Insumos"
        subtitle="Catalogo paginado de insumos y materia prima"
        actions={
          <div className="insumos-header-actions">
            {puedeGestionarCostos && (
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => navigate("/insumos/costos")}
              >
                <i className="bi bi-cash-coin me-1"></i>
                Costos
              </button>
            )}
            <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            {puedeGestionarInsumos && (
              <button
                className="btn insumos-brand-primary"
                onClick={() => navigate("/insumos/nuevo")}
              >
                Nuevo insumo
              </button>
            )}
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando insumos...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 insumos-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, unidad o ubicacion..."
                value={busquedaInput}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={cambiarEstatus}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivosInsumos"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivosInsumos">
                  Solo activos
                </label>
              </div>
            </div>

            <div className="col-md-3 d-flex align-items-center justify-content-end insumos-filters-switch-col">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="stockBajoInsumos"
                  checked={filtroStockBajo}
                  onChange={cambiarStockBajo}
                />
                <label className="form-check-label text-warning" htmlFor="stockBajoInsumos">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Stock bajo
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 insumos-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-boxes fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay insumos registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Crea el primer insumo para alimentar compras y estructuras de costos
            </p>
          </div>
        </div>
      ) : (
        <div className="insumos-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 insumos-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver insumos en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <InsumosTable
              data={insumos}
              onEditar={abrirEditar}
              onVerKardex={abrirKardex}
              onCambiarEstado={manejarCambiarEstado}
              onAjustarStock={abrirAjusteStock}
              puedeGestionar={puedeGestionarInsumos}
              puedeAjustarStock={puedeAjustarStock}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="insumos-pagination-panel">
              <div className="insumos-pagination-summary">
                {`Mostrando ${desde} a ${hasta} de ${totalElements} insumos`}
              </div>

              <nav aria-label="Paginacion de insumos">
                <ul className="pagination mb-0 flex-wrap">
                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(0)}
                      disabled={page <= 0}
                    >
                      Primera
                    </button>
                  </li>

                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(page - 1)}
                      disabled={page <= 0}
                    >
                      Anterior
                    </button>
                  </li>

                  {paginasVisibles.map((pagina, index) => (
                    pagina === "..." ? (
                      <li key={`dots-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li
                        key={`page-${pagina}`}
                        className={`page-item ${page === pagina ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => irAPagina(pagina)}
                        >
                          {pagina + 1}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Siguiente
                    </button>
                  </li>

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Ultima
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}

      {ajusteStock && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content border-0 shadow-lg" onSubmit={confirmarAjusteStock}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Ajuste manual de stock</h5>
                    <small className="text-muted">{ajusteStock.insumo.nombre}</small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    disabled={guardandoAjuste}
                    onClick={cerrarAjusteStock}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    Stock actual: <strong>{Number(ajusteStock.insumo.stockActual || 0).toFixed(2)}</strong>.
                    Esta acción quedará registrada en Kardex.
                  </div>
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Tipo de ajuste</label>
                      <select
                        className="form-select"
                        value={ajusteStock.tipo}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, tipo: event.target.value }))}
                      >
                        <option value="ENTRADA">Entrada</option>
                        <option value="SALIDA">Salida</option>
                      </select>
                    </div>
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="form-control"
                        value={ajusteStock.cantidad}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, cantidad: event.target.value }))}
                        placeholder="0.00"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Motivo *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        maxLength="500"
                        value={ajusteStock.motivo}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, motivo: event.target.value }))}
                        placeholder="Describe por qué se realiza el ajuste"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={cerrarAjusteStock} disabled={guardandoAjuste}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={guardandoAjuste}>
                    {guardandoAjuste ? "Actualizando..." : "Confirmar ajuste"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
