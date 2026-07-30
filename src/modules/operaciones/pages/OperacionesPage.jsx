import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useOperaciones } from "../hooks/useOperaciones";
import OperacionesTable from "./OperacionesTable.jsx";

import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import CatalogFilters from "../../../components/ui/CatalogFilters.jsx";
import ConfirmationDialog from "../../../components/ui/ConfirmationDialog.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";

const PAGE_SIZE = 10;

export default function OperacionesPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [filtroCentroTrabajo, setFiltroCentroTrabajo] = useState("");
  const [page, setPage] = useState(0);
  const [operacionPorEliminar, setOperacionPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const activo = filtroEstatus === "TODOS" && !soloActivos
    ? undefined
    : filtroEstatus === "INACTIVO"
      ? false
      : true;

  const {
    operaciones,
    pageInfo,
    loadingLista,
    error,
    eliminarOperacion
  } = useOperaciones({
    page,
    size: PAGE_SIZE,
    busqueda,
    activo,
    centroTrabajo: filtroCentroTrabajo
  });

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages - 1), 0);
      return () => window.clearTimeout(timer);
    }
  }, [page, totalPages]);

  const centrosUnicos = useMemo(
    () => [...new Set(operaciones.map((op) => op.centroTrabajoNombre).filter(Boolean))].sort(),
    [operaciones]
  );

  const abrirEditar = (operacion) => {
    navigate(`/operaciones/${operacion.id}`);
  };

  const confirmarEliminacion = async () => {
    if (!operacionPorEliminar) return;
    try {
      setEliminando(true);
      await eliminarOperacion(operacionPorEliminar.id);
      setToastType("success");
      setToastMessage("Operación eliminada correctamente");
      setOperacionPorEliminar(null);
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar la operación");
    } finally {
      setEliminando(false);
    }
  };

  const resetPage = (callback) => {
    callback();
    setPage(0);
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />
      <ConfirmationDialog
        open={Boolean(operacionPorEliminar)}
        title="Eliminar operación"
        message={`¿Deseas eliminar la operación “${operacionPorEliminar?.nombre || ""}”? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar operación"
        loading={eliminando}
        onCancel={() => setOperacionPorEliminar(null)}
        onConfirm={confirmarEliminacion}
      />

      <PageHeader
        title="Operaciones"
        eyebrow="Producción"
        subtitle="Catálogo de operaciones de fabricación (mano de obra directa)"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/operaciones/nuevo")}
          >
            Nueva operación
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando operaciones…
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <CatalogFilters
        onClear={() => {
          setBusqueda("");
          setFiltroEstatus("TODOS");
          setFiltroCentroTrabajo("");
          setSoloActivos(false);
          setPage(0);
        }}
        clearDisabled={!busqueda && filtroEstatus === "TODOS" && !filtroCentroTrabajo && !soloActivos}
      >
            <div className="col-md-3">
              <label className="form-label" htmlFor="operaciones-busqueda">Búsqueda</label>
              <input
                id="operaciones-busqueda"
                type="text"
                className="form-control"
                placeholder="Código, nombre o descripción"
                value={busqueda}
                onChange={(event) => resetPage(() => setBusqueda(event.target.value))}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label" htmlFor="operaciones-estado">Estado</label>
              <select
                id="operaciones-estado"
                className="form-select"
                value={filtroEstatus}
                onChange={(event) => resetPage(() => setFiltroEstatus(event.target.value))}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label" htmlFor="operaciones-centro">Centro de trabajo</label>
              <select
                id="operaciones-centro"
                className="form-select"
                value={filtroCentroTrabajo}
                onChange={(event) => resetPage(() => setFiltroCentroTrabajo(event.target.value))}
              >
                <option value="">Todos los centros</option>
                {centrosUnicos.map((centro) => (
                  <option key={centro} value={centro}>{centro}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-center pb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={soloActivos}
                  onChange={() => resetPage(() => setSoloActivos((prev) => !prev))}
                />
                <label className="form-check-label">
                  Solo activos
                </label>
              </div>
            </div>
      </CatalogFilters>

      <OperacionesTable
        data={operaciones}
        onEditar={abrirEditar}
        onEliminar={setOperacionPorEliminar}
      />

      {totalElements > 0 && (
        <CatalogPagination
          currentPage={paginaActual}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          currentCount={operaciones.length}
          itemLabel="operaciones"
          ariaLabel="Paginación de operaciones"
          onPageChange={setPage}
          className="mt-3"
        />
      )}
    </>
  );
}
