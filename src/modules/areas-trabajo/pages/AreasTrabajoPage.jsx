import { useCallback, useEffect, useState } from "react";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";

import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { useGeneratedCatalogCode } from "../../../hooks/useGeneratedCatalogCode.js";
import {
  activarAreaTrabajo,
  actualizarAreaTrabajo,
  crearAreaTrabajo,
  desactivarAreaTrabajo,
  obtenerCodigoSugeridoAreaTrabajo,
  obtenerAreasTrabajo
} from "../services/areasTrabajo.js";
import "./AreasTrabajoPage.css";

const PAGE_SIZE = 10;
const PAGE_INFO_DEFAULT = {
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
};
const initialForm = {
  codigo: "",
  nombre: "",
  descripcion: "",
  activo: true
};

export default function AreasTrabajoPage() {
  const [areas, setAreas] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [form, setForm] = useState(initialForm);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloActivas, setSoloActivas] = useState(false);
  const [page, setPage] = useState(() => getInitialPaginationPage("areas-trabajo"));
  usePersistedPagination("areas-trabajo", page);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    form.nombre,
    !editando,
    obtenerCodigoSugeridoAreaTrabajo
  );

  const cargarAreas = useCallback(async (pagina = page) => {
    try {
      setLoading(true);
      const data = await obtenerAreasTrabajo({
        page: pagina,
        size: PAGE_SIZE,
        busqueda,
        activo: soloActivas ? true : undefined
      });
      setAreas(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
      setPageInfo(data?.content ? {
        page: data.page ?? pagina,
        size: data.size ?? PAGE_SIZE,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudieron cargar las areas.");
    } finally {
      setLoading(false);
    }
  }, [busqueda, page, soloActivas]);

  useEffect(() => {
    cargarAreas(page);
  }, [cargarAreas, page]);

  const totalPages = pageInfo.totalPages || 0;
  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const payload = {
        nombre: form.nombre?.trim() || "",
        descripcion: form.descripcion?.trim() || "",
        activo: form.activo
      };

      if (editando) {
        await actualizarAreaTrabajo(editando.id, {
          ...payload,
          codigo: form.codigo?.trim() || ""
        });
        setToastMessage("Area actualizada correctamente.");
      } else {
        await crearAreaTrabajo(payload);
        setToastMessage("Area creada correctamente.");
      }

      setToastType("success");
      setForm(initialForm);
      setEditando(null);
      await cargarAreas(page);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo guardar el area.");
    } finally {
      setLoading(false);
    }
  };

  const editarArea = (area) => {
    setEditando(area);
    setForm({
      codigo: area.codigo || "",
      nombre: area.nombre || "",
      descripcion: area.descripcion || "",
      activo: area.activo ?? true
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setForm(initialForm);
  };

  const cambiarActivo = async (area) => {
    try {
      setLoading(true);
      if (area.activo) {
        await desactivarAreaTrabajo(area.id);
        setToastMessage("Area desactivada correctamente.");
      } else {
        await activarAreaTrabajo(area.id);
        setToastMessage("Area activada correctamente.");
      }
      setToastType("success");
      await cargarAreas(page);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo cambiar el estado del area.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Areas de trabajo"
        subtitle="Catalogo de areas internas como carpinteria, pintura o herreria"
      />

      <div className="areas-layout">
        <section className="areas-list-panel">
          <div className="card areas-filters-card mb-3">
            <div className="card-body">
              <div className="row g-2 align-items-center">
                <div className="col-md-8">
                  <input
                    className="form-control"
                    value={busqueda}
                    onChange={(event) => {
                      setBusqueda(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Buscar por codigo, nombre o descripcion..."
                  />
                </div>
                <div className="col-md-4 d-flex justify-content-md-end">
                  <div className="form-check form-switch">
                    <input
                      id="soloAreasActivas"
                      className="form-check-input"
                      type="checkbox"
                      checked={soloActivas}
                      onChange={(event) => {
                        setSoloActivas(event.target.checked);
                        setPage(0);
                      }}
                    />
                    <label className="form-check-label" htmlFor="soloAreasActivas">Solo activas</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card areas-table-card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Codigo</th>
                    <th>Area</th>
                    <th>Descripcion</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length > 0 ? areas.map((area) => (
                    <tr key={area.id} onClick={() => editarArea(area)} role="button">
                      <td><span className="badge text-bg-light border">{area.codigo}</span></td>
                      <td className="fw-semibold">{area.nombre}</td>
                      <td className="text-muted">{area.descripcion || "-"}</td>
                      <td>
                        <span className={`badge ${area.activo ? "text-bg-success" : "text-bg-secondary"}`}>
                          {area.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            editarArea(area);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            cambiarActivo(area);
                          }}
                        >
                          {area.activo ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        No hay areas para mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <CatalogPagination
           currentPage={page}
            totalPages={totalPages}
            totalElements={pageInfo.totalElements || 0}
            pageSize={PAGE_SIZE}
            currentCount={areas.length}
            itemLabel="areas"
            ariaLabel="Paginacion de areas de trabajo"
            onPageChange={setPage}
            className="areas-pagination-panel"
          />
        </section>

        <aside className="areas-form-panel">
          <form className="card areas-form-card" onSubmit={handleSubmit}>
            <div className="card-body">
              <h2 className="h5 mb-3">{editando ? "Editar area" : "Nueva area"}</h2>
              <div className="d-grid gap-3">
                <div>
                  <label className="form-label">{editando ? "Codigo" : "Codigo generado"}</label>
                  <input
                    className={`form-control ${!editando ? "bg-light text-secondary" : ""}`}
                    value={editando ? form.codigo : codigoGenerado}
                    onChange={(event) => setForm((prev) => ({ ...prev, codigo: event.target.value }))}
                    readOnly={!editando}
                    placeholder="CARPINTERIA"
                  />
                  {!editando && (
                    <div className="form-text">
                      {generandoCodigo ? "Generando codigo..." : "Se genera automaticamente desde el nombre."}
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-control"
                    value={form.nombre}
                    onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    placeholder="Carpinteria"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Descripcion</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.descripcion}
                    onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                    placeholder="Area interna de trabajo"
                  />
                </div>
                {editando && (
                  <div className="form-check form-switch">
                    <input
                      id="areaActiva"
                      className="form-check-input"
                      type="checkbox"
                      checked={form.activo}
                      onChange={(event) => setForm((prev) => ({ ...prev, activo: event.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="areaActiva">Area activa</label>
                  </div>
                )}
                <div className="d-flex gap-2 justify-content-end">
                  {editando && (
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelarEdicion}>
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar area"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}
