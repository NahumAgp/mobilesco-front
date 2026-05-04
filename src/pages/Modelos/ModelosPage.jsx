import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useModelos } from "./useModelos.js";
import { exportarModelosExcel } from "../../services/modelos.js";
import ModelosTable from "./ModelosTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./ModelosPage.css";

const PAGE_SIZE = 10;

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) {
    paginas.push("...");
  }

  for (let page = inicio; page <= fin; page += 1) {
    paginas.push(page);
  }

  if (fin < totalPages - 2) {
    paginas.push("...");
  }

  paginas.push(totalPages - 1);
  return paginas;
}

export default function ModelosPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const {
    modelos,
    pageInfo,
    loadingLista,
    error,
    eliminarModelo,
    cambiarEstadoModelo
  } = useModelos({ page, size: PAGE_SIZE });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + modelos.length : 0;
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

  const familiasDisponibles = useMemo(() => {
    const familiasUnicas = new Set();

    modelos.forEach((modelo) => {
      const nombreFamilia = (modelo.familiaNombre || modelo.familia?.nombre || "").trim();
      if (nombreFamilia) {
        familiasUnicas.add(nombreFamilia);
      }
    });

    return Array.from(familiasUnicas).sort((a, b) => a.localeCompare(b, "es"));
  }, [modelos]);

  const modelosFiltrados = useMemo(() => {
    return modelos.filter((modelo) => {
      const pasaFiltroTexto = (() => {
        if (!terminoBusqueda) return true;

        const palabras = terminoBusqueda.split(" ");
        const familiaNombre = modelo.familiaNombre || modelo.familia?.nombre || "";

        const infoModelo = [
          modelo.nombre,
          modelo.descripcion,
          familiaNombre
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return palabras.every((palabra) => infoModelo.includes(palabra));
      })();

      const coincideEstatus =
        filtroEstatus === "TODOS" ||
        (filtroEstatus === "ACTIVO" && modelo.activo) ||
        (filtroEstatus === "INACTIVO" && !modelo.activo);

      const coincideSoloActivos = !soloActivos || modelo.activo;
      const familiaModelo = (modelo.familiaNombre || modelo.familia?.nombre || "").trim();
      const coincideFamilia = !filtroFamilia || familiaModelo === filtroFamilia;

      return pasaFiltroTexto && coincideEstatus && coincideSoloActivos && coincideFamilia;
    });
  }, [busqueda, filtroEstatus, filtroFamilia, modelos, soloActivos, terminoBusqueda]);

  const hayFiltrosActivos = Boolean(terminoBusqueda) || Boolean(filtroFamilia) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && totalElements > 0 && modelosFiltrados.length === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => {
        setPage(nextPage);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (modelo) => {
    navigate(`/modelos/${modelo.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("Seguro que deseas eliminar este modelo?");
    if (!confirmacion) return;

    try {
      await eliminarModelo(id);
      setToastType("success");
      setToastMessage("Modelo eliminado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar modelo");
    }
  };

  const manejarCambioEstado = async (modelo) => {
    try {
      const nuevoEstado = !modelo.activo;
      await cambiarEstadoModelo(modelo.id, nuevoEstado);
      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Modelo activado correctamente" : "Modelo desactivado correctamente"
      );
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del modelo");
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarModelosExcel({
        activo: soloActivos ? true : undefined,
        busqueda: terminoBusqueda || undefined,
        familia: filtroFamilia || undefined,
        sortBy: "nombre",
        direction: "asc"
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "modelos.xlsx";
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

  const cambiarFamilia = (e) => {
    setFiltroFamilia(e.target.value);
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
        title="Modelos"
        subtitle="Catalogo de modelos"
        actions={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button
              className="btn modelos-brand-primary"
              onClick={() => navigate("/modelos/nuevo")}
            >
              Nuevo Modelo
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando modelos...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 modelos-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, descripcion o familia..."
                value={busqueda}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroFamilia}
                onChange={cambiarFamilia}
              >
                <option value="">Todas las familias</option>
                {familiasDisponibles.map((familia) => (
                  <option key={familia} value={familia}>
                    {familia}
                  </option>
                ))}
              </select>
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
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label">
                  Solo activos
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 modelos-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay modelos registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Comienza creando un nuevo modelo
            </p>
          </div>
        </div>
      ) : (
        <>
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 mb-3 modelos-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver modelos en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <ModelosTable
              data={modelosFiltrados}
              onEditar={abrirEditar}
              onCambiarEstado={manejarCambioEstado}
            />
          )}

          {totalElements > 0 && (
            <div className="modelos-pagination-panel">
              <div className="modelos-pagination-summary">
                {hayFiltrosActivos
                  ? `Mostrando ${modelosFiltrados.length} coincidencias en esta pagina`
                  : `Mostrando ${desde} a ${hasta} de ${totalElements} modelos`}
              </div>

              <nav aria-label="Paginacion de modelos">
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
        </>
      )}
    </>
  );
}
