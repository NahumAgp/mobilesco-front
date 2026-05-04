import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLineasProducto } from "./useLineasProducto";
import { exportarLineasProductoExcel } from "../../services/lineaProducto";

import LineaProductoTable from "./LineaProductoTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./LineaProductoPage.css";

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

export default function LineaProductoPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const {
    lineasProducto,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoLineaProducto
  } = useLineasProducto({ page, sortBy: sortField, direction: sortDirection });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + lineasProducto.length : 0;
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

  const lineasFiltradas = useMemo(() => {
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

    const filtradas = lineasProducto.filter((linea) => {
      const pasaFiltroTexto = (() => {
        if (!terminoBusqueda) return true;

        const palabras = terminoBusqueda.split(" ");
        const infoLinea = [
          linea.codigo,
          linea.nombre,
          linea.createdAt,
          linea.activo ? "activo" : "inactivo"
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return palabras.every((palabra) => infoLinea.includes(palabra));
      })();

      const coincideSoloActivos = !soloActivos || linea.activo;

      return pasaFiltroTexto && coincideSoloActivos;
    });

    return filtradas.sort((a, b) => {
      const valorA =
        sortField === "createdAt"
          ? new Date(a?.createdAt || 0).getTime()
          : a?.[sortField];
      const valorB =
        sortField === "createdAt"
          ? new Date(b?.createdAt || 0).getTime()
          : b?.[sortField];

      const resultado = compararValor(valorA, valorB);
      return sortDirection === "asc" ? resultado : -resultado;
    });
  }, [lineasProducto, soloActivos, sortDirection, sortField, terminoBusqueda]);

  const hayFiltrosActivos = Boolean(terminoBusqueda) || soloActivos;
  const mostrarVacio = !loadingLista && !error && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && totalElements > 0 && lineasFiltradas.length === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => {
        setPage(nextPage);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (linea) => {
    navigate(`/lineas-producto/${linea.id}`);
  };

  const manejarCambioEstado = async (linea) => {
    try {
      const nuevoEstado = !linea.activo;
      await cambiarEstadoLineaProducto(linea.id, nuevoEstado);
      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Linea de producto activada correctamente" : "Linea de producto desactivada correctamente"
      );
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado de la linea de producto");
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

  const cambiarSoloActivos = (e) => {
    setSoloActivos(e.target.checked);
    setPage(0);
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarLineasProductoExcel({
        activo: soloActivos ? true : undefined,
        busqueda: terminoBusqueda || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lineas_producto.xlsx";
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
        title="Lineas de Producto"
        subtitle="Catalogo de lineas"
        actions={
          <div className="lineas-header-actions">
            <button
              className="btn lineas-brand-outline me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button
              className="btn lineas-brand-primary"
              onClick={() => navigate("/lineas-producto/nuevo")}
            >
              Nueva linea
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando lineas de producto...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 lineas-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo o nombre..."
                value={busqueda}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-4 d-flex align-items-center justify-content-end lineas-filters-switch-col">
              <div className="form-check form-switch lineas-filters-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivasLineasSwitch"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivasLineasSwitch">
                  Activo
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 lineas-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay lineas de producto registradas</span>
            <p className="text-secondary mt-2 mb-0">
              Crea la primera linea para comenzar a organizar tu catalogo
            </p>
          </div>
        </div>
      ) : (
        <div className="lineas-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 lineas-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver lineas en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <LineaProductoTable
              data={lineasFiltradas}
              onEditar={abrirEditar}
              onCambiarEstado={manejarCambioEstado}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="lineas-pagination-panel">
              <div className="lineas-pagination-summary">
                {hayFiltrosActivos
                  ? `Mostrando ${lineasFiltradas.length} coincidencias en esta pagina`
                  : `Mostrando ${desde} a ${hasta} de ${totalElements} lineas`}
              </div>

              <nav aria-label="Paginacion de lineas de producto">
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
