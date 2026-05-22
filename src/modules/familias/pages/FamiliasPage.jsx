import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFamilias } from "../hooks/useFamilias";
import { lineaProductoGateway } from "../../lineas-producto/services/lineaProductoGateway.js";
import { familiaGateway } from "../services/familiaGateway.js";

import FamiliasTable from "./FamiliasTable";
import PageHeader from "../../../components/Sistema/PageHeader";
import CatalogPagination from "../../../components/ui/CatalogPagination";
import Toast from "../../../components/ui/Toast";
import "./FamiliasPage.css";

const PAGE_SIZE = 10;

export default function FamiliasPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [lineaFiltroId, setLineaFiltroId] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const {
    familias,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoFamilia
  } = useFamilias({ page, size: PAGE_SIZE, sortBy: sortField, direction: sortDirection });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
  const lineaFiltroNormalizado = lineaFiltroId ? String(lineaFiltroId) : "";

  useEffect(() => {
    let activo = true;

    const cargarLineas = async () => {
      try {
        const data = await lineaProductoGateway.obtenerLineasProducto();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : [];

        if (activo) {
          setLineasDisponibles(lista);
        }
      } catch {
        if (activo) {
          setLineasDisponibles([]);
        }
      }
    };

    cargarLineas();

    return () => {
      activo = false;
    };
  }, []);

  const familiasFiltradas = useMemo(() => {
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

    const filtradas = familias.filter((familia) => {
      const pasaFiltroTexto = (() => {
        if (!terminoBusqueda) return true;

        const palabras = terminoBusqueda.split(" ");
        const infoFamilia = [
          familia.codigo,
          familia.nombre,
          familia.descripcion,
          familia.lineaNombre,
          familia.linea?.nombre,
          familia.lineaId
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return palabras.every((palabra) => infoFamilia.includes(palabra));
      })();

      const lineaFamiliaId = familia.lineaId ?? familia.linea?.id ?? "";
      const coincideLinea =
        !lineaFiltroNormalizado || String(lineaFamiliaId) === lineaFiltroNormalizado;
      const coincideSoloActivos = !soloActivos || familia.activo;

      return pasaFiltroTexto && coincideLinea && coincideSoloActivos;
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
  }, [familias, lineaFiltroNormalizado, soloActivos, sortDirection, sortField, terminoBusqueda]);

  const hayFiltrosActivos = Boolean(terminoBusqueda) || Boolean(lineaFiltroNormalizado) || soloActivos;
  const mostrarVacio = !loadingLista && !error && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && totalElements > 0 && familiasFiltradas.length === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => {
        setPage(nextPage);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (familia) => {
    navigate(`/familias/${familia.id}`);
  };

  const manejarCambioEstado = async (familia) => {
    try {
      const nuevoEstado = !familia.activo;
      await cambiarEstadoFamilia(familia.id, nuevoEstado);
      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Familia activada correctamente" : "Familia desactivada correctamente"
      );
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado de la familia");
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await familiaGateway.exportarFamiliasExcel({
        activo: soloActivos ? true : undefined,
        busqueda: terminoBusqueda || undefined,
        lineaId: lineaFiltroId || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "familias.xlsx";
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

  const cambiarLineaFiltro = (e) => {
    setLineaFiltroId(e.target.value);
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
        title="Catálogo de Familias"
        subtitle="Administración paginada de familias de productos"
        actions={
          <div className="familias-header-actions">
            <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button
              className="btn familias-brand-primary"
              onClick={() => navigate("/familias/nuevo")}
            >
              Nueva familia
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando familias...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 familias-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo, nombre, descripcion o linea..."
                value={busqueda}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={lineaFiltroId}
                onChange={cambiarLineaFiltro}
              >
                <option value="">Todas las lineas</option>
                {lineasDisponibles.map((linea) => (
                  <option key={linea.id ?? linea.lineaId} value={linea.id ?? linea.lineaId}>
                    {linea.nombre || linea.codigo || `Linea ${linea.id ?? linea.lineaId}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center justify-content-end familias-filters-switch-col">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivasFamiliasSwitch"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivasFamiliasSwitch">
                  Solo activas
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 familias-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay familias registradas</span>
            <p className="text-secondary mt-2 mb-0">
              Crea la primera familia para empezar a organizar tu catálogo
            </p>
          </div>
        </div>
      ) : (
        <div className="familias-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 familias-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver familias en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <FamiliasTable
              data={familiasFiltradas}
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
              currentCount={familias.length}
              itemLabel="familias"
              summary={
                hayFiltrosActivos
                  ? `Mostrando ${familiasFiltradas.length} coincidencias en esta pagina`
                  : undefined
              }
              ariaLabel="Paginacion de familias"
              onPageChange={setPage}
              className="familias-pagination-panel"
            />
          )}
        </div>
      )}
    </>
  );
}
