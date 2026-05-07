import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUnidadesMedida } from "./useUnidadesMedida";
import { exportarUnidadesMedidaExcel } from "../../services/unidadMedidas.js";
import UnidadesMedidaTable from "../../components/UnidadMedidas/UnidadesMedidaTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./UnidadMedidaPage.css";

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

export default function UnidadesMedidaPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const {
    unidadesMedida,
    pageInfo,
    loadingLista,
    error,
    eliminarUnidadMedida
  } = useUnidadesMedida({ page, size: PAGE_SIZE, sortBy: sortField, direction: sortDirection });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + unidadesMedida.length : 0;
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

  const unidadesFiltradas = useMemo(() => {
    const compararValor = (a, b) => {
      const valorA = a ?? "";
      const valorB = b ?? "";

      if (typeof valorA === "number" && typeof valorB === "number") {
        return valorA - valorB;
      }

      if (typeof valorA === "boolean" && typeof valorB === "boolean") {
        return Number(valorA) - Number(valorB);
      }

      return String(valorA).localeCompare(String(valorB), "es", {
        numeric: true,
        sensitivity: "base"
      });
    };

    const filtradas = unidadesMedida.filter((unidad) => {
      const pasaFiltroTexto = (() => {
        if (!terminoBusqueda) return true;

        const palabras = terminoBusqueda.split(" ");
        const infoUnidad = [
          unidad.id,
          unidad.nombre,
          unidad.simbolo,
          unidad.tipo,
          unidad.estado ? "activo" : "inactivo",
          unidad.fechaRegistro
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return palabras.every((palabra) => infoUnidad.includes(palabra));
      })();

      const coincideEstatus =
        filtroEstatus === "TODOS" ||
        (filtroEstatus === "ACTIVO" && unidad.estado) ||
        (filtroEstatus === "INACTIVO" && !unidad.estado);
      const coincideSoloActivos = !soloActivos || unidad.estado;

      return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
    });

    return filtradas.sort((a, b) => {
      const valorA = a?.[sortField];
      const valorB = b?.[sortField];
      const resultado = compararValor(valorA, valorB);
      return sortDirection === "asc" ? resultado : -resultado;
    });
  }, [filtroEstatus, soloActivos, sortDirection, sortField, terminoBusqueda, unidadesMedida]);

  const hayFiltrosActivos =
    Boolean(terminoBusqueda) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && totalElements === 0;
  const mostrarSinCoincidencias =
    !loadingLista && !error && totalElements > 0 && unidadesFiltradas.length === 0;

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

      const estadoFiltro =
        soloActivos || filtroEstatus === "ACTIVO"
          ? true
          : filtroEstatus === "INACTIVO"
            ? false
            : undefined;

      const blob = await exportarUnidadesMedidaExcel({
        estado: estadoFiltro,
        busqueda: terminoBusqueda || undefined,
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

  const manejarOrden = (campo) => {
    if (sortField === campo) {
      setSortDirection((direccionActual) => (direccionActual === "asc" ? "desc" : "asc"));
    } else {
      setSortDirection("asc");
      setSortField(campo);
    }

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
            <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button
              className="btn unidades-brand-primary"
              onClick={() => navigate("/unidades-medida/nuevo")}
            >
              Nueva unidad
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando unidades de medida...
        </div>
      )}

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
                  Ajusta los filtros para ver unidades en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <UnidadesMedidaTable
              data={unidadesFiltradas}
              onEditar={abrirEditar}
              onEliminar={manejarEliminar}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="unidades-pagination-panel">
              <div className="unidades-pagination-summary">
                {hayFiltrosActivos
                  ? `Mostrando ${unidadesFiltradas.length} coincidencias en esta pagina`
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
