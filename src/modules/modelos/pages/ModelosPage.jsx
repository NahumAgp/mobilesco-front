import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useModelos } from "../hooks/useModelos.js";
import { exportarModelosExcel } from "../services/modelos.js";
import { familiaGateway } from "../../familias/services/familiaGateway.js";
import ModelosTable from "./ModelosTable.jsx";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./ModelosPage.css";

const PAGE_SIZE = 10;

const getLineaNombre = (modelo = {}) =>
  modelo.lineaNombre || modelo.linea?.nombre || modelo.familia?.lineaNombre || modelo.familia?.linea?.nombre || "";

const getFamiliaNombre = (modelo = {}) =>
  modelo.familiaNombre || modelo.familia?.nombre || "";

const getFamiliaLabel = (modelo = {}) =>
  [getLineaNombre(modelo), getFamiliaNombre(modelo)].filter(Boolean).join(" / ");

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
  const [familiasDisponibles, setFamiliasDisponibles] = useState([]);
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
    familiaId: filtroFamilia
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;

  const hayFiltrosActivos = Boolean(terminoBusqueda) || Boolean(filtroFamilia) || filtroEstatus !== "TODOS" || soloActivos;
  const mostrarVacio = !loadingLista && !error && !hayFiltrosActivos && totalElements === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && hayFiltrosActivos && totalElements === 0;

  useEffect(() => {
    let activo = true;

    const cargarFamilias = async () => {
      try {
        const data = await familiaGateway.obtenerFamiliasActivas();
        const lista = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        const opciones = lista
          .map((familia) => ({
            id: familia.id ?? familia.familiaId,
            label: getFamiliaLabel(familia) || familia.nombre || familia.codigo || `Familia ${familia.id ?? familia.familiaId}`
          }))
          .filter((familia) => familia.id && familia.label)
          .sort((a, b) => a.label.localeCompare(b.label, "es"));

        if (activo) {
          setFamiliasDisponibles(opciones);
        }
      } catch {
        if (activo) {
          setFamiliasDisponibles([]);
        }
      }
    };

    cargarFamilias();

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
        busqueda: terminoBusqueda || undefined,
        familiaId: filtroFamilia || undefined,
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
                  <option key={familia.id} value={familia.id}>
                    {familia.label}
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
