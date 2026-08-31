import React, { useEffect, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import { useUnidadesMedida } from "../hooks/useUnidadesMedida";
import { exportarUnidadesMedidaExcel } from "../services/unidadMedidas.js";
import UnidadesMedidaTable from "../components/UnidadesMedidaTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import "./UnidadMedidaPage.css";

const PAGE_SIZE = 10;
const FILTROS_DEFAULT = {
  busqueda: "",
  filtroEstatus: "TODOS",
  soloActivos: false,
  sortField: "nombre",
  sortDirection: "asc"
};

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

export default function UnidadesMedidaPage() {
  const navigate = useNavigate();
  const canCreate = hasPermission(getUser(), "ACTION_MEASURE_UNITS_CREATE");
  const canExport = hasPermission(getUser(), "ACTION_MEASURE_UNITS_EXPORT");
  const canEdit = hasPermission(getUser(), "ACTION_MEASURE_UNITS_EDIT");
  const canDelete = hasPermission(getUser(), "ACTION_MEASURE_UNITS_DELETE");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("unidades-medida"));
  usePersistedPagination("unidades-medida", page);
  const [filtros, setFiltros] = usePersistedState("unidades-medida:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, filtroEstatus, soloActivos, sortField, sortDirection } = filtros;
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
  const estadoFiltro =
    soloActivos || filtroEstatus === "ACTIVO"
      ? true
      : filtroEstatus === "INACTIVO"
        ? false
        : null;

  const {
    unidadesMedida,
    pageInfo,
    loadingLista,
    error,
    eliminarUnidadMedida
  } = useUnidadesMedida({
    page,
    size: PAGE_SIZE,
    sortBy: sortField,
    direction: sortDirection,
    busqueda: terminoBusqueda,
    estado: estadoFiltro
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + unidadesMedida.length : 0;

  const hayFiltrosActivos =
    Boolean(busquedaInput.trim()) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && !hayFiltrosActivos && totalElements === 0;
  const mostrarSinCoincidencias =
    !loadingLista && !error && hayFiltrosActivos && totalElements === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => setPage(nextPage), 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (unidad) => {
    navigate(`/unidades-medida/${unidad.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("Seguro que deseas eliminar esta unidad de medida?");
    if (!confirmacion) return;

    try {
      await eliminarUnidadMedida(id);
      setToastType("success");
      setToastMessage("Unidad de medida eliminada correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar unidad de medida");
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarUnidadesMedidaExcel({
        estado: estadoFiltro ?? undefined,
        busqueda: busquedaInput.toLowerCase().trim().replace(/\s+/g, " ") || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "unidades-medida.xlsx";
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

  const cambiarBusqueda = (e) => {
    setFiltros((actuales) => ({ ...actuales, busqueda: e.target.value }));
    setPage(0);
  };

  const cambiarEstatus = (e) => {
    setFiltros((actuales) => ({ ...actuales, filtroEstatus: e.target.value }));
    setPage(0);
  };

  const cambiarSoloActivos = (e) => {
    setFiltros((actuales) => ({ ...actuales, soloActivos: e.target.checked }));
    setPage(0);
  };

  const manejarOrden = (campo) => {
    setFiltros((actuales) => ({
      ...actuales,
      sortField: campo,
      sortDirection: actuales.sortField === campo && actuales.sortDirection === "asc" ? "desc" : "asc"
    }));
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
        title="Catalogo de Unidades de Medida"
        subtitle="Administracion paginada de unidades para productos e insumos"
        actions={
          <div className="unidades-header-actions">
            {canExport && <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>}
            {canCreate && <button
              className="btn unidades-brand-primary"
              onClick={() => navigate("/unidades-medida/nuevo")}
            >
              Nueva unidad
            </button>}
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 unidades-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, simbolo, tipo o estado..."
                value={busquedaInput}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={cambiarEstatus}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activas</option>
                <option value="INACTIVO">Inactivas</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center justify-content-end unidades-filters-switch-col">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivasUnidadesSwitch"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivasUnidadesSwitch">
                  Solo activas
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 unidades-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-rulers fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay unidades registradas</span>
            <p className="text-secondary mt-2 mb-0">
              Crea la primera unidad para usarla en insumos y compras
            </p>
          </div>
        </div>
      ) : (
        <div className="unidades-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 unidades-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver unidades
                </p>
              </div>
            </div>
          ) : (
            <UnidadesMedidaTable
              data={unidadesMedida}
              onEditar={abrirEditar}
              onEliminar={manejarEliminar}
              canEdit={canEdit}
              canDelete={canDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="unidades-pagination-panel">
              <div className="unidades-pagination-summary">
                {hayFiltrosActivos
                  ? `Mostrando ${unidadesMedida.length} de ${totalElements} coincidencias`
                  : `Mostrando ${desde} a ${hasta} de ${totalElements} unidades`}
              </div>

              <nav aria-label="Paginacion de unidades de medida">
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
    </>
  );
}
