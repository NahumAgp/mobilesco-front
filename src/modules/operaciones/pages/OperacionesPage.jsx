import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useOperaciones } from "../hooks/useOperaciones";
import OperacionesTable from "./OperacionesTable.jsx";

import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
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
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const centrosUnicos = useMemo(
    () => [...new Set(operaciones.map((op) => op.centroTrabajoNombre).filter(Boolean))].sort(),
    [operaciones]
  );

  const abrirEditar = (operacion) => {
    navigate(`/operaciones/${operacion.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("Seguro que deseas eliminar esta operacion?");
    if (!confirmacion) return;

    try {
      await eliminarOperacion(id);
      setToastType("success");
      setToastMessage("Operacion eliminada correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar operacion");
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

      <PageHeader
        title="Operaciones"
        subtitle="Catalogo de operaciones de fabricacion (Mano de Obra Directa)"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/operaciones/nuevo")}
          >
            Nueva Operacion
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando operaciones...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo, nombre o descripcion..."
                value={busqueda}
                onChange={(event) => resetPage(() => setBusqueda(event.target.value))}
              />
            </div>

            <div className="col-md-2">
              <select
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
              <select
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

            <div className="col-md-2 d-flex align-items-center">
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
          </div>
        </div>
      </div>

      <OperacionesTable
        data={operaciones}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />

      {totalElements > 0 && (
        <CatalogPagination
          currentPage={paginaActual}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          currentCount={operaciones.length}
          itemLabel="operaciones"
          ariaLabel="Paginacion de operaciones"
          onPageChange={setPage}
          className="mt-3"
        />
      )}
    </>
  );
}
