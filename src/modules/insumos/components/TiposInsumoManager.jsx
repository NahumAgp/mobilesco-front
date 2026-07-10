import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";
import {
  actualizarEstadoTipoInsumo,
  actualizarTipoInsumo,
  crearTipoInsumo,
  obtenerPreviewTipoInsumo,
  obtenerTiposInsumo
} from "../services/tiposInsumo.js";

const emptyForm = {
  nombre: "",
  descripcion: ""
};

const emptyPreview = {
  codigo: "",
  disponible: false,
  mensaje: "Escribe un nombre para generar un codigo de 1 a 3 letras"
};

const PAGE_SIZE = 10;
const PAGE_INFO_DEFAULT = {
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
};

export default function TiposInsumoManager({ puedeGestionar, onFeedback }) {
  const [tipos, setTipos] = useState([]);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(emptyPreview);
  const [errores, setErrores] = useState({});

  const emitirFeedback = useCallback(
    (message, type = "success") => {
      if (typeof onFeedback === "function") {
        onFeedback(message, type);
      }
    },
    [onFeedback]
  );

  const cargarTipos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await obtenerTiposInsumo({ page, size: PAGE_SIZE });
      setTipos(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
      setPageInfo(data?.content ? {
        page: data.page ?? page,
        size: data.size ?? PAGE_SIZE,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
    } catch (error) {
      emitirFeedback(error.message || "No se pudo cargar el catalogo de tipos de insumo", "danger");
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [emitirFeedback, page]);

  useEffect(() => {
    void cargarTipos();
  }, [cargarTipos]);

  useEffect(() => {
    if (pageInfo.totalPages > 0 && page >= pageInfo.totalPages) {
      setPage(pageInfo.totalPages - 1);
    }
  }, [page, pageInfo.totalPages]);

  useEffect(() => {
    if (editingTipo) {
      setPreview({
        codigo: editingTipo.codigo || "",
        disponible: true,
        mensaje: "El codigo actual se conserva para no romper relaciones existentes"
      });
      setPreviewLoading(false);
      return undefined;
    }

    const nombre = form.nombre.trim();

    if (!nombre) {
      setPreview(emptyPreview);
      setPreviewLoading(false);
      return undefined;
    }

    setPreviewLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await obtenerPreviewTipoInsumo(nombre);
        setPreview(data || emptyPreview);
      } catch (error) {
        setPreview({
          codigo: "",
          disponible: false,
          mensaje: error.message || "No se pudo validar el codigo sugerido"
        });
      } finally {
        setPreviewLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [editingTipo, form.nombre]);

  const resumen = useMemo(() => {
    const activos = tipos.filter((tipo) => tipo.activo).length;
    return {
      total: tipos.length,
      activos,
      inactivos: tipos.length - activos
    };
  }, [tipos]);

  const reiniciarFormulario = useCallback(() => {
    setEditingTipo(null);
    setForm(emptyForm);
    setPreview(emptyPreview);
    setErrores({});
    setPreviewLoading(false);
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));

    setErrores((prev) => {
      if (!prev[field]) return prev;
      const copia = { ...prev };
      delete copia[field];
      return copia;
    });
  };

  const handleEdit = (tipo) => {
    setEditingTipo(tipo);
    setForm({
      nombre: tipo.nombre || "",
      descripcion: tipo.descripcion || ""
    });
    setErrores({});
  };

  const handleToggleEstado = async (tipo) => {
    const siguienteEstado = !tipo.activo;
    const accion = siguienteEstado ? "activar" : "desactivar";
    const confirmacion = window.confirm(`Seguro que deseas ${accion} este tipo de insumo?`);

    if (!confirmacion) return;

    try {
      await actualizarEstadoTipoInsumo(tipo.id, siguienteEstado);
      await cargarTipos();
      emitirFeedback(
        `Tipo de insumo ${siguienteEstado ? "activado" : "desactivado"} correctamente`
      );
    } catch (error) {
      emitirFeedback(error.message || `No se pudo ${accion} el tipo de insumo`, "danger");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    const nuevosErrores = {};

    if (!nombre) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    if (!editingTipo && !preview.disponible) {
      nuevosErrores.nombre = preview.mensaje || "Corrige el nombre antes de guardar";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nombre,
        descripcion: descripcion || null
      };

      if (editingTipo) {
        await actualizarTipoInsumo(editingTipo.id, payload);
        emitirFeedback("Tipo de insumo actualizado correctamente");
      } else {
        await crearTipoInsumo(payload);
        emitirFeedback("Tipo de insumo creado correctamente");
      }

      await cargarTipos();
      reiniciarFormulario();
    } catch (error) {
      setErrores(error.errors || {});
      emitirFeedback(error.message || "No se pudo guardar el tipo de insumo", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card shadow-sm border-0 mb-3 tipos-insumo-panel">
      <div className="card-body">
        <div className="tipos-insumo-header">
          <div>
            <span className="tipos-insumo-eyebrow">Catalogo vivo</span>
            <h3 className="tipos-insumo-title mb-1">Gestion de tipos de insumo</h3>
            <p className="text-muted mb-0">
              Desde aqui puedes mantener el catalogo que luego seleccionas en proveedores.
            </p>
          </div>

          <div className="tipos-insumo-stats">
            <div className="tipos-insumo-stat">
              <strong>{resumen.total}</strong>
              <span>En pagina</span>
            </div>
            <div className="tipos-insumo-stat">
              <strong>{resumen.activos}</strong>
              <span>Activos pagina</span>
            </div>
            <div className="tipos-insumo-stat">
              <strong>{resumen.inactivos}</strong>
              <span>Inactivos pagina</span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-xl-4">
            <div className="tipos-insumo-form-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="h6 mb-1">
                    {editingTipo ? "Editar tipo de insumo" : "Nuevo tipo de insumo"}
                  </h4>
                  <p className="text-muted small mb-0">
                    {editingTipo
                      ? "El codigo se mantiene estable aunque cambies el nombre."
                      : "El codigo se genera con la inicial y, si hace falta, usa hasta 3 letras."}
                  </p>
                </div>

                {editingTipo && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={reiniciarFormulario}
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {puedeGestionar ? (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre</label>
                    <input
                      type="text"
                      className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                      value={form.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      placeholder="Ej. Pintura electrostatica"
                    />
                    {errores.nombre ? (
                      <div className="invalid-feedback d-block">{errores.nombre}</div>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Codigo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={preview.codigo || ""}
                      readOnly
                      placeholder={previewLoading ? "Generando..." : "Aun sin codigo"}
                    />
                    <div
                      className={`form-text ${
                        previewLoading
                          ? "text-muted"
                          : preview.disponible
                            ? "text-success"
                            : "text-danger"
                      }`}
                    >
                      {previewLoading ? "Validando disponibilidad..." : preview.mensaje}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Descripcion</label>
                    <textarea
                      className={`form-control ${errores.descripcion ? "is-invalid" : ""}`}
                      rows="4"
                      value={form.descripcion}
                      onChange={(e) => handleChange("descripcion", e.target.value)}
                      placeholder="Opcional: detalle breve para el equipo de compras o almacen"
                    />
                    {errores.descripcion ? (
                      <div className="invalid-feedback d-block">{errores.descripcion}</div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="btn insumos-brand-primary w-100"
                    disabled={saving || previewLoading}
                  >
                    {saving
                      ? "Guardando..."
                      : editingTipo
                        ? "Guardar cambios"
                        : "Crear tipo de insumo"}
                  </button>
                </form>
              ) : (
                <div className="alert alert-light border mb-0">
                  Solo tienes vista del catalogo. Para editarlo necesitas permisos de gestion.
                </div>
              )}
            </div>
          </div>

          <div className="col-xl-8">
            <div className="tipos-insumo-table-card">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Nombre</th>
                      <th>Descripcion</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          Cargando catalogo...
                        </td>
                      </tr>
                    ) : tipos.length > 0 ? (
                      tipos.map((tipo) => (
                        <tr key={tipo.id}>
                          <td>
                            <span className="badge text-bg-light border tipos-insumo-code-badge">
                              {tipo.codigo}
                            </span>
                          </td>
                          <td>
                            <span className="fw-semibold">{tipo.nombre}</span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {tipo.descripcion || "Sin descripcion"}
                            </span>
                          </td>
                          <td>
                            <CatalogStatusBadge active={tipo.activo} />
                          </td>
                          <td className="text-end">
                            {puedeGestionar ? (
                              <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(tipo)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${
                                    tipo.activo ? "btn-outline-secondary" : "btn-outline-success"
                                  }`}
                                  onClick={() => handleToggleEstado(tipo)}
                                >
                                  {tipo.activo ? "Desactivar" : "Activar"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">Solo lectura</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          No hay tipos de insumo registrados todavia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {pageInfo.totalElements > 0 && (
                <CatalogPagination
                  currentPage={Math.min(page, Math.max(pageInfo.totalPages - 1, 0))}
                  totalPages={pageInfo.totalPages || 0}
                  totalElements={pageInfo.totalElements || 0}
                  pageSize={PAGE_SIZE}
                  currentCount={tipos.length}
                  itemLabel="tipos de insumo"
                  ariaLabel="Paginacion de tipos de insumo"
                  onPageChange={setPage}
                  className="mt-3"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
