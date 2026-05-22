import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLineasProducto } from "../hooks/useLineasProducto";
import { lineaProductoGateway } from "../services/lineaProductoGateway.js";

import LineaProductoTable from "./LineaProductoTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./LineaProductoPage.css";

const PAGE_SIZE = 10;

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

      const blob = await lineaProductoGateway.exportarLineasProductoExcel({
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
            <CatalogPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={lineasProducto.length}
              itemLabel="lineas"
              summary={
                hayFiltrosActivos
                  ? `Mostrando ${lineasFiltradas.length} coincidencias en esta pagina`
                  : undefined
              }
              ariaLabel="Paginacion de lineas de producto"
              onPageChange={setPage}
              className="lineas-pagination-panel"
            />
          )}
        </div>
      )}
    </>
  );
}
