import { useEffect, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import { useModelos } from "../hooks/useModelos.js";
import { exportarModelosExcel } from "../services/modelos.js";
import { familiaGateway } from "../../familias/services/familiaGateway.js";
import ModelosTable from "./ModelosTable.jsx";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import "./ModelosPage.css";

const PAGE_SIZE = 10;
const FILTROS_DEFAULT = {
  busqueda: "",
  filtroLinea: "",
  filtroEstatus: "TODOS",
  soloActivos: false
};

const getLineaNombre = (modelo = {}) =>
  modelo.lineaNombre || modelo.linea?.nombre || modelo.familia?.lineaNombre || modelo.familia?.linea?.nombre || "";

const getLineaId = (modelo = {}) =>
  modelo.lineaId || modelo.linea_id || modelo.linea?.id || modelo.familia?.lineaId || modelo.familia?.linea?.id || "";

export default function ModelosPage() {
  const navigate = useNavigate();
  const canCreate = hasPermission(getUser(), "ACTION_MODELS_CREATE");
  const canExport = hasPermission(getUser(), "ACTION_MODELS_EXPORT");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("modelos"));
  usePersistedPagination("modelos", page);
  const [filtros, setFiltros] = usePersistedState("modelos:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, filtroLinea, filtroEstatus, soloActivos } = filtros;
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
  const filtroActivo = soloActivos
    ? true
    : filtroEstatus === "ACTIVO"
      ? true
      : filtroEstatus === "INACTIVO"
        ? false
        : null;

  const {
    modelos,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoModelo
  } = useModelos({
    page,
    size: PAGE_SIZE,
    busqueda: terminoBusqueda,
    activo: filtroActivo,
    lineaId: filtroLinea
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;

  const hayFiltrosActivos = Boolean(busquedaInput.trim()) || Boolean(filtroLinea) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && !hayFiltrosActivos && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && hayFiltrosActivos && totalElements === 0;

  useEffect(() => {
    let activo = true;

    const cargarLineas = async () => {
      try {
        const data = await familiaGateway.obtenerFamiliasActivas();
        const lista = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        const opcionesMap = new Map();

        lista.forEach((familia) => {
          const lineaId = getLineaId(familia);
          const lineaNombre = getLineaNombre(familia);

          if (lineaId && lineaNombre && !opcionesMap.has(String(lineaId))) {
            opcionesMap.set(String(lineaId), {
              id: lineaId,
              label: lineaNombre
            });
          }
        });

        const opciones = Array.from(opcionesMap.values())
          .sort((a, b) => a.label.localeCompare(b.label, "es"));

        if (activo) {
          setLineasDisponibles(opciones);
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
        activo: filtroActivo ?? undefined,
        busqueda: busquedaInput.toLowerCase().trim().replace(/\s+/g, " ") || undefined,
        lineaId: filtroLinea || undefined,
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

  const cambiarBusqueda = (e) => {
    setFiltros((actuales) => ({ ...actuales, busqueda: e.target.value }));
    setPage(0);
  };

  const cambiarLinea = (e) => {
    setFiltros((actuales) => ({ ...actuales, filtroLinea: e.target.value }));
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
            {canExport && <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>}
            {canCreate && <button
              className="btn modelos-brand-primary"
              onClick={() => navigate("/modelos/nuevo")}
            >
              Nuevo Modelo
            </button>}
          </div>
        }
      />

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
                placeholder="Buscar por nombre, descripcion, linea o familia..."
                value={busquedaInput}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroLinea}
                onChange={cambiarLinea}
              >
                <option value="">Todas las lineas</option>
                {lineasDisponibles.map((linea) => (
                  <option key={linea.id} value={linea.id}>
                    {linea.label}
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
                  Ajusta los filtros para ver modelos
                </p>
              </div>
            </div>
          ) : (
            <ModelosTable
              data={modelos}
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
              currentCount={modelos.length}
              itemLabel="modelos"
              summary={
                hayFiltrosActivos
                  ? `Mostrando ${modelos.length} de ${totalElements} coincidencias`
                  : undefined
              }
              ariaLabel="Paginacion de modelos"
              onPageChange={setPage}
              className="modelos-pagination-panel"
            />
          )}
        </>
      )}
    </>
  );
}
