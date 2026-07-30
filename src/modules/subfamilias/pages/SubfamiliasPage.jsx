import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { obtenerFamiliasActivas } from "../../familias/services/familias.js";
import { useSubfamilias } from "../hooks/useSubfamilias.js";
import SubfamiliasTable from "./SubfamiliasTable.jsx";
import "../../familias/pages/FamiliasPage.css";

const PAGE_SIZE = 10;

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getFamiliaLabel = (familia = {}) =>
  [familia.lineaNombre || familia.linea?.nombre, familia.nombre].filter(Boolean).join(" / ")
  || familia.codigo
  || `Familia ${familia.id ?? familia.familiaId}`;

export default function SubfamiliasPage() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [familiaFiltroId, setFamiliaFiltroId] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");
  const [familiasDisponibles, setFamiliasDisponibles] = useState([]);

  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
  const {
    subfamilias,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoSubfamilia
  } = useSubfamilias({
    page,
    sortBy: sortField,
    direction: sortDirection,
    busqueda: terminoBusqueda,
    activo: soloActivos ? true : null,
    familiaId: familiaFiltroId || ""
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const hayFiltrosActivos = Boolean(terminoBusqueda) || Boolean(familiaFiltroId) || soloActivos;

  useEffect(() => {
    obtenerFamiliasActivas()
      .then((respuesta) => setFamiliasDisponibles(getLista(respuesta)))
      .catch(() => setFamiliasDisponibles([]));
  }, []);

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages - 1), 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const manejarCambioEstado = async (subfamilia) => {
    try {
      const nuevoEstado = !subfamilia.activo;
      await cambiarEstadoSubfamilia(subfamilia.id, nuevoEstado);
      setToastType("success");
      setToastMessage(nuevoEstado ? "Subfamilia activada correctamente" : "Subfamilia desactivada correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado de la subfamilia");
    }
  };

  const manejarOrden = (campo) => {
    if (sortField === campo) {
      setSortDirection((actual) => (actual === "asc" ? "desc" : "asc"));
    } else {
      setSortField(campo);
      setSortDirection("asc");
    }
    setPage(0);
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Catálogo de Subfamilias"
        subtitle="Clasificación intermedia entre familia y modelo"
        actions={
          <button className="btn familias-brand-primary" onClick={() => navigate("/subfamilias/nuevo")}>
            Nueva subfamilia
          </button>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando subfamilias...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 familias-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo, nombre, descripcion, familia o linea..."
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={familiaFiltroId}
                onChange={(event) => {
                  setFamiliaFiltroId(event.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todas las familias</option>
                {familiasDisponibles.map((familia) => (
                  <option key={familia.id ?? familia.familiaId} value={familia.id ?? familia.familiaId}>
                    {getFamiliaLabel(familia)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center justify-content-end familias-filters-switch-col">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivasSubfamiliasSwitch"
                  checked={soloActivos}
                  onChange={(event) => {
                    setSoloActivos(event.target.checked);
                    setPage(0);
                  }}
                />
                <label className="form-check-label" htmlFor="soloActivasSubfamiliasSwitch">
                  Solo activas
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="familias-page-shell">
        <SubfamiliasTable
          data={subfamilias}
          onEditar={(subfamilia) => navigate(`/subfamilias/${subfamilia.id}`)}
          onCambiarEstado={manejarCambioEstado}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={manejarOrden}
        />

        {totalElements > 0 && (
          <CatalogPagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            currentCount={subfamilias.length}
            itemLabel="subfamilias"
            summary={hayFiltrosActivos ? `Mostrando ${subfamilias.length} de ${totalElements} coincidencias` : undefined}
            ariaLabel="Paginacion de subfamilias"
            onPageChange={setPage}
            className="familias-pagination-panel"
          />
        )}
      </div>
    </>
  );
}
