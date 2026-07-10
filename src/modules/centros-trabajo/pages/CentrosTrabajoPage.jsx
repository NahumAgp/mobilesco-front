import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCentrosTrabajo } from "../hooks/useCentrosTrabajo";
import CentrosTrabajoTable from "./CentrosTrabajoTable.jsx";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";

const PAGE_SIZE = 10;

export default function CentrosTrabajoPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);

  const {
    centrosTrabajo,
    pageInfo,
    loadingLista,
    error,
    eliminarCentroTrabajo
  } = useCentrosTrabajo({
    page,
    size: PAGE_SIZE,
    busqueda,
    estatus: filtroEstatus,
    soloActivos
  });

  const abrirEditar = (centro) => {
    navigate(`/centros-trabajo/${centro.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este centro de trabajo?");
    if (!confirmacion) return;

    try {

      await eliminarCentroTrabajo(id);

      setToastType("success");
      setToastMessage("Centro de trabajo eliminado correctamente");

    } catch {

      setToastType("danger");
      setToastMessage("Error al eliminar centro de trabajo");
    }
  };

  useEffect(() => {
    setPage(0);
  }, [busqueda, filtroEstatus, soloActivos]);

  const totalPages = Math.max(pageInfo.totalPages || 0, 1);
  const safePage = Math.min(page, totalPages - 1);
  
  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Centros de Trabajo"
        subtitle="Catálogo de máquinas y estaciones de trabajo"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/centros-trabajo/nuevo")}
          >
            Nuevo Centro
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando centros de trabajo...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">

            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por código, nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
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
                  checked={soloActivos}
                  onChange={() => setSoloActivos(!soloActivos)}
                />
                <label className="form-check-label">
                  Solo activos
                </label>
              </div>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstatus("TODOS");
                  setSoloActivos(false);
                }}
                title="Limpiar filtros"
              >
                <i className="bi bi-eraser me-2"></i>
                Limpiar
              </button>
            </div>

          </div>
        </div>
      </div>

      <CentrosTrabajoTable
        data={centrosTrabajo}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />

      <CatalogPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalElements={pageInfo.totalElements || 0}
        pageSize={PAGE_SIZE}
        currentCount={centrosTrabajo.length}
        itemLabel="centros"
        ariaLabel="Paginacion de centros de trabajo"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
