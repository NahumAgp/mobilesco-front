// pages/Materiales/MaterialesPage.jsx
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMateriales } from "../hooks/useMateriales";
import MaterialesTable from "./MaterialesTable.jsx";

import { materialGateway } from "../services/materialGateway.js";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import "./MaterialesPage.css";

const PAGE_SIZE = 10;

export default function MaterialesPage() {
  const navigate = useNavigate();
  const canCreate = hasPermission(getUser(), "ACTION_MATERIALS_CREATE");
  const canExport = hasPermission(getUser(), "ACTION_MATERIALS_EXPORT");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("materiales"));
  usePersistedPagination("materiales", page);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [sortField] = useState("nombre");
  const [sortDirection] = useState("asc");
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
  const filtroActivo = soloActivos
    ? true
    : filtroEstatus === "ACTIVO"
      ? true
      : filtroEstatus === "INACTIVO"
        ? false
        : null;

  const {
    materiales,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoMaterial
  } = useMateriales({
    page,
    size: PAGE_SIZE,
    sortBy: sortField,
    direction: sortDirection,
    busqueda: terminoBusqueda,
    activo: filtroActivo
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;

  const hayFiltrosActivos = Boolean(terminoBusqueda) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && !hayFiltrosActivos && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && hayFiltrosActivos && totalElements === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => {
        setPage(nextPage);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (material) => {
    navigate(`/materiales/${material.id}`);
  };

  const manejarCambioEstado = async (material) => {
    try {
      const nuevoEstado = !material.activo;
      await cambiarEstadoMaterial(material.id, nuevoEstado);
      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Material activado correctamente" : "Material desactivado correctamente"
      );
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del material");
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await materialGateway.exportarMaterialesExcel({
        activo: filtroActivo ?? undefined,
        busqueda: terminoBusqueda || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "materiales.xlsx";
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

  const cambiarBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPage(0);
  };

  const cambiarEstatus = (e) => {
    setFiltroEstatus(e.target.value);
    setPage(0);
  };

  const cambiarSoloActivos = (e) => {
    setSoloActivos(e.target.checked);
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
        title="Materiales"
        subtitle="Catálogo de materiales e insumos"
        actions={
          <div className="materiales-header-actions">
            {canExport && <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>}
            {canCreate && <button
              className="btn materiales-brand-primary"
              onClick={() => navigate("/materiales/nuevo")}
            >
              Nuevo Material
            </button>}
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando materiales...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 materiales-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, código o descripción..."
                value={busqueda}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
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

            <div className="col-md-3 d-flex align-items-center justify-content-end materiales-filters-switch-col">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivosMaterialesSwitch"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivosMaterialesSwitch">
                  Solo activos
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 materiales-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay materiales registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Comienza creando un nuevo material
            </p>
          </div>
        </div>
      ) : (
        <div className="materiales-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 materiales-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver materiales
                </p>
              </div>
            </div>
          ) : (
            <MaterialesTable
              data={materiales}
              onEditar={abrirEditar}
              onCambiarEstado={manejarCambioEstado}
            />
          )}

          {totalElements > 0 && (
            <CatalogPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={materiales.length}
              itemLabel="materiales"
              summary={
                hayFiltrosActivos
                  ? `Mostrando ${materiales.length} de ${totalElements} coincidencias`
                  : undefined
              }
              ariaLabel="Paginacion de materiales"
              onPageChange={setPage}
              className="materiales-pagination-panel"
            />
          )}
        </div>
      )}
    </>
  );
}
