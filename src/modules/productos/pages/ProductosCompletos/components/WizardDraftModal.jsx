/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "../../../../../components/ui/SearchableSelect.jsx";
import { obtenerFamiliasActivas } from "../../../../familias/services/familias.js";
import { obtenerLineasActivas } from "../../../../lineas-producto/services/lineaProducto.js";
import { obtenerNiveles } from "../../../services/niveles.js";

export const crearRefBorrador = (tipo) =>
  `draft-${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const esRefBorrador = (valor) => String(valor || "").startsWith("draft-");

const normalizarComparacion = (valor = "") =>
  valor.toString().normalize("NFD").replace(/\p{M}/gu, "").trim().toUpperCase();

const normalizarCodigoBase = (valor = "") =>
  normalizarComparacion(valor).replace(/[^A-Z0-9]/g, "");

export const crearCodigoDisponible = (valor, items = [], refExcluida = "") => {
  const base = normalizarCodigoBase(valor);
  if (!base) return "";
  const usados = new Set(
    items
      .filter((item) => String(item.ref || item.id) !== String(refExcluida))
      .map((item) => normalizarComparacion(item.codigo))
      .filter(Boolean)
  );
  const completar = (largo) => Array.from({ length: largo }, (_, index) => base[index % base.length]).join("");
  const candidatos = [completar(1), completar(2), completar(3)];
  const natural = candidatos.find((codigo) => !usados.has(codigo));
  if (natural) return natural;
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (const caracter of caracteres) {
    const codigo = `${completar(2)}${caracter}`;
    if (!usados.has(codigo)) return codigo;
  }
  for (const primero of caracteres) {
    for (const segundo of caracteres) {
      const codigo = `${completar(1)}${primero}${segundo}`;
      if (!usados.has(codigo)) return codigo;
    }
  }
  return "";
};

const buscarDuplicado = (items, campo, valor, refExcluida) =>
  items.find(
    (item) =>
      String(item.ref || item.id) !== String(refExcluida)
      && normalizarComparacion(item[campo]) === normalizarComparacion(valor)
  );

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const MODAL_CONFIG = {
  linea: { titulo: "Nueva linea", icono: "bi-diagram-3", descripcion: true },
  familia: { titulo: "Nueva familia", icono: "bi-collection", descripcion: true },
  categoria: { titulo: "Nueva categoria", icono: "bi-folder", descripcion: true },
  material: { titulo: "Nuevo material", icono: "bi-box-seam", descripcion: true },
  color: { titulo: "Nuevo color", icono: "bi-palette", descripcion: true }
};

export function SimpleDraftModal({
  show,
  tipo,
  initialValue = null,
  depth = 0,
  lineas = [],
  existingItems = [],
  forcedLineaId = "",
  onClose,
  onSave,
  onCreateLinea
}) {
  const config = MODAL_CONFIG[tipo] || MODAL_CONFIG.categoria;
  const [form, setForm] = useState({});
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!show) return;
    setForm({
      ref: initialValue?.ref || initialValue?.id || crearRefBorrador(tipo),
      nombre: initialValue?.nombre || "",
      codigo: initialValue?.codigo || "",
      descripcion: initialValue?.descripcion || "",
      activo: initialValue?.activo !== false,
      hex: initialValue?.hex || "#808080",
      lineaId: initialValue?.lineaId || initialValue?.lineaRef || ""
    });
    setErrores({});
  }, [initialValue, show, tipo]);

  useEffect(() => {
    if (!show) return;
    const fuenteCodigo = tipo === "color" ? form.hex : form.nombre;
    const codigo = crearCodigoDisponible(fuenteCodigo, existingItems, form.ref);
    setForm((prev) => prev.codigo === codigo ? prev : { ...prev, codigo });
  }, [existingItems, form.hex, form.nombre, form.ref, show, tipo]);

  useEffect(() => {
    if (show && tipo === "familia" && forcedLineaId) {
      setForm((prev) => ({ ...prev, lineaId: forcedLineaId }));
    }
  }, [forcedLineaId, show, tipo]);

  if (!show) return null;

  const nombreDuplicadoActual = buscarDuplicado(existingItems, "nombre", form.nombre, form.ref);
  const codigoDuplicadoActual = buscarDuplicado(existingItems, "codigo", form.codigo, form.ref);

  const guardar = (event) => {
    event.preventDefault();
    const siguientesErrores = {};
    if (!form.nombre?.trim()) siguientesErrores.nombre = "El nombre es obligatorio";
    if (nombreDuplicadoActual) siguientesErrores.nombre = `Ya existe ${nombreDuplicadoActual._pending ? "un borrador" : "un registro"} con este nombre`;
    if (!form.codigo) siguientesErrores.codigo = "No fue posible generar un codigo disponible";
    if (codigoDuplicadoActual) siguientesErrores.codigo = `El codigo ${form.codigo} ya esta ocupado`;
    if (tipo === "familia" && !form.lineaId) siguientesErrores.lineaId = "La linea es obligatoria";
    if (tipo === "color" && !/^#[0-9A-Fa-f]{6}$/.test(form.hex || "")) {
      siguientesErrores.hex = "Usa el formato #RRGGBB";
    }
    if (Object.keys(siguientesErrores).length) {
      setErrores(siguientesErrores);
      return;
    }

    onSave({
      ...form,
      id: form.ref,
      ref: form.ref,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || "",
      lineaId: tipo === "familia" && !esRefBorrador(form.lineaId) ? Number(form.lineaId) : undefined,
      lineaRef: tipo === "familia" && esRefBorrador(form.lineaId) ? form.lineaId : undefined,
      _pending: true
    });
  };

  return (
    <div
      className="modal fade show modelos-modal-popout wizard-draft-modal"
      style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.42)", zIndex: 1080 + depth * 20 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${config.icono} me-2`}></i>
              {config.titulo}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={guardar}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-5">
                  <label className="form-label fw-semibold">Nombre *</label>
                  <input
                    className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                    value={form.nombre || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    autoFocus
                  />
                  <div className="invalid-feedback">{errores.nombre}</div>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">Codigo</label>
                  <input className={`form-control fw-semibold ${errores.codigo ? "is-invalid" : ""}`} value={form.codigo || ""} readOnly />
                  <div className="invalid-feedback">{errores.codigo}</div>
                </div>

                {tipo === "color" && (
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Color *</label>
                    <div className="d-flex gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={form.hex || "#808080"}
                        onChange={(event) => setForm((prev) => ({ ...prev, hex: event.target.value.toUpperCase() }))}
                      />
                      <input
                        className={`form-control ${errores.hex ? "is-invalid" : ""}`}
                        value={form.hex || ""}
                        onChange={(event) => setForm((prev) => ({ ...prev, hex: event.target.value.toUpperCase() }))}
                      />
                    </div>
                    {errores.hex && <div className="text-danger small mt-1">{errores.hex}</div>}
                  </div>
                )}

                {tipo === "familia" && (
                  <div className="col-md-5">
                    <SearchableSelect
                      label="Linea *"
                      value={form.lineaId || ""}
                      options={lineas}
                      onChange={(value) => setForm((prev) => ({ ...prev, lineaId: value }))}
                      getOptionValue={(item) => item.id || item.ref}
                      getOptionLabel={(item) => `${item._pending ? "[Pendiente] " : ""}${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                      error={errores.lineaId}
                      actionNode={
                        <button type="button" className="btn btn-outline-primary" onClick={onCreateLinea} title="Nueva linea">
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      }
                    />
                  </div>
                )}

                {config.descripcion && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Descripcion</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.descripcion || ""}
                      onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                    />
                  </div>
                )}
                {(nombreDuplicadoActual || codigoDuplicadoActual) && (
                  <div className="col-12">
                    <div className="alert alert-warning mb-0 py-2">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {nombreDuplicadoActual
                        ? `El nombre ya esta usado por ${nombreDuplicadoActual._pending ? "otro borrador" : "un registro existente"}.`
                        : `El codigo ${form.codigo} ya esta ocupado.`}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <span className="badge text-bg-warning me-auto">Pendiente hasta guardar el producto</span>
              <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={Boolean(nombreDuplicadoActual || codigoDuplicadoActual || !form.codigo)}>
                Guardar borrador
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ModeloDraftModal({
  show,
  initialValue,
  modelos = [],
  borradores,
  onUpsertDraft,
  onClose,
  onSave
}) {
  const [form, setForm] = useState({});
  const [familiasExistentes, setFamiliasExistentes] = useState([]);
  const [lineasExistentes, setLineasExistentes] = useState([]);
  const [categoriasExistentes, setCategoriasExistentes] = useState([]);
  const [mostrarFamilia, setMostrarFamilia] = useState(false);
  const [mostrarLinea, setMostrarLinea] = useState(false);
  const [lineaParaFamilia, setLineaParaFamilia] = useState("");
  const [familiaEditando, setFamiliaEditando] = useState(null);
  const [lineaEditando, setLineaEditando] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!show) return;
    setForm({
      ref: initialValue?.ref || initialValue?.id || crearRefBorrador("modelo"),
      nombre: initialValue?.nombre || "",
      codigo: initialValue?.codigo || "",
      descripcion: initialValue?.descripcion || "",
      activo: initialValue?.activo !== false,
      familiaId: initialValue?.familiaId || initialValue?.familiaRef || "",
      categorias: initialValue?.categorias?.length
        ? initialValue.categorias
        : (() => {
            const ref = crearRefBorrador("categoria");
            return [{ id: ref, ref, nombre: "", descripcion: "", activo: true, _pending: true }];
          })()
    });
    setErrores({});
    Promise.all([obtenerFamiliasActivas(), obtenerLineasActivas(), obtenerNiveles()])
      .then(([familias, lineas, categorias]) => {
        setFamiliasExistentes(getLista(familias));
        setLineasExistentes(getLista(lineas));
        setCategoriasExistentes(getLista(categorias));
      })
      .catch((error) => console.error("No se pudieron cargar familias y lineas:", error));
  }, [initialValue, show]);

  const familias = useMemo(
    () => [...(borradores?.familias || []), ...familiasExistentes],
    [borradores?.familias, familiasExistentes]
  );
  const lineas = useMemo(
    () => [...(borradores?.lineas || []), ...lineasExistentes],
    [borradores?.lineas, lineasExistentes]
  );
  const familiaSeleccionada = useMemo(
    () => familias.find((item) => String(item.id || item.ref) === String(form.familiaId)),
    [familias, form.familiaId]
  );
  const lineaSeleccionada = useMemo(
    () => lineas.find(
      (item) => String(item.id || item.ref) === String(familiaSeleccionada?.lineaId || familiaSeleccionada?.lineaRef)
    ),
    [familiaSeleccionada?.lineaId, familiaSeleccionada?.lineaRef, lineas]
  );
  const modeloConflictoNombre = buscarDuplicado(modelos, "nombre", form.nombre, form.ref);
  const modeloConflictoCodigo = buscarDuplicado(modelos, "codigo", form.codigo, form.ref);
  const categoriasComparablesActuales = [...categoriasExistentes, ...(form.categorias || [])];
  const categoriaRepetidaActual = (form.categorias || []).find((item) =>
    buscarDuplicado(categoriasComparablesActuales, "nombre", item.nombre, item.ref || item.id)
    || buscarDuplicado(categoriasComparablesActuales, "codigo", item.codigo, item.ref || item.id)
  );

  useEffect(() => {
    if (!show) return;
    const codigo = crearCodigoDisponible(form.nombre, modelos, form.ref);
    setForm((prev) => prev.codigo === codigo ? prev : { ...prev, codigo });
  }, [form.nombre, form.ref, modelos, show]);

  if (!show) return null;

  const guardarModelo = (event) => {
    event.preventDefault();
    const siguientesErrores = {};
    if (!form.nombre?.trim()) siguientesErrores.nombre = "El nombre es obligatorio";
    if (modeloConflictoNombre) siguientesErrores.nombre = "Ya existe un modelo con este nombre";
    if (!form.codigo) siguientesErrores.codigo = "No fue posible generar un codigo disponible";
    if (modeloConflictoCodigo) siguientesErrores.codigo = `El codigo ${form.codigo} ya esta ocupado`;
    if (!form.familiaId) siguientesErrores.familiaId = "La familia es obligatoria";
    if (!form.categorias?.length || form.categorias.some((item) => !item.nombre?.trim())) {
      siguientesErrores.categorias = "Agrega al menos una categoria con nombre";
    }
    if (categoriaRepetidaActual) siguientesErrores.categorias = `La categoria ${categoriaRepetidaActual.nombre || categoriaRepetidaActual.codigo} esta repetida`;
    if (Object.keys(siguientesErrores).length) {
      setErrores(siguientesErrores);
      return;
    }
    const familia = familias.find((item) => String(item.id || item.ref) === String(form.familiaId));
    const linea = lineas.find((item) => String(item.id || item.ref) === String(familia?.lineaId || familia?.lineaRef));
    onSave({
      ...form,
      id: form.ref,
      modo: "nuevo",
      ref: form.ref,
      nombre: form.nombre.trim(),
      familiaId: esRefBorrador(form.familiaId) ? undefined : Number(form.familiaId),
      familiaRef: esRefBorrador(form.familiaId) ? form.familiaId : undefined,
      familia,
      linea,
      categorias: form.categorias.map((item) => ({
        ...item,
        id: item.ref || item.id,
        ref: item.ref || item.id,
        nombre: item.nombre.trim(),
        _pending: true
      })),
      _pending: true
    });
  };

  const cambiarCategoria = (index, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      categorias: prev.categorias.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const actualizado = { ...item, [campo]: valor };
        if (campo === "nombre") {
          actualizado.codigo = crearCodigoDisponible(
            valor,
            [...categoriasExistentes, ...prev.categorias],
            item.ref || item.id
          );
        }
        return actualizado;
      })
    }));
  };

  return (
    <>
      <div className="modal fade show modelos-modal-popout wizard-draft-modal" style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.48)", zIndex: 1080 }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-box-seam me-2"></i>Nuevo modelo</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={guardarModelo}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Nombre del modelo *</label>
                    <input className={`form-control ${errores.nombre ? "is-invalid" : ""}`} value={form.nombre || ""} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} autoFocus />
                    <div className="invalid-feedback">{errores.nombre}</div>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Codigo</label>
                    <input className={`form-control fw-semibold ${errores.codigo ? "is-invalid" : ""}`} value={form.codigo || ""} readOnly />
                    <div className="invalid-feedback">{errores.codigo}</div>
                  </div>
                  <div className="col-md-5">
                    <SearchableSelect
                      label="Familia *"
                      value={form.familiaId || ""}
                      options={familias}
                      onChange={(value) => setForm((prev) => ({ ...prev, familiaId: value }))}
                      getOptionValue={(item) => item.id || item.ref}
                      getOptionLabel={(item) => `${item._pending ? "[Pendiente] " : ""}${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                      error={errores.familiaId}
                      actionNode={<button type="button" className="btn btn-outline-primary" onClick={() => {
                        setFamiliaEditando(null);
                        setLineaParaFamilia("");
                        setMostrarFamilia(true);
                      }} title="Nueva familia"><i className="bi bi-plus-lg"></i></button>}
                    />
                    {familiaSeleccionada?._pending && (
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        <span className="badge text-bg-warning">Familia pendiente</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setFamiliaEditando(familiaSeleccionada);
                            setLineaParaFamilia(familiaSeleccionada.lineaRef || familiaSeleccionada.lineaId || "");
                            setMostrarFamilia(true);
                          }}
                        >
                          <i className="bi bi-pencil me-1"></i>Editar familia
                        </button>
                        {lineaSeleccionada?._pending && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setLineaEditando(lineaSeleccionada);
                              setMostrarLinea(true);
                            }}
                          >
                            <i className="bi bi-pencil me-1"></i>Editar linea
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Descripcion</label>
                    <textarea className="form-control" rows="3" value={form.descripcion || ""} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                      <div>
                        <div className="fw-semibold">Categorias propias del modelo *</div>
                        <small className="text-muted">Se guardaran junto con el producto.</small>
                      </div>
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => {
                        const ref = crearRefBorrador("categoria");
                        setForm((prev) => ({ ...prev, categorias: [...prev.categorias, { id: ref, ref, nombre: "", descripcion: "", activo: true, _pending: true }] }));
                      }}>+ Categoria</button>
                    </div>
                    {errores.categorias && <div className="text-danger small mt-2">{errores.categorias}</div>}
                    <div className="d-flex flex-column gap-2 mt-3">
                      {(form.categorias || []).map((categoria, index) => (
                        <div className="row g-2" key={categoria.ref || categoria.id}>
                          <div className="col-md-4"><input className="form-control" value={categoria.nombre || ""} onChange={(e) => cambiarCategoria(index, "nombre", e.target.value)} placeholder="Nombre de categoria" /></div>
                          <div className="col-md-2"><input className="form-control fw-semibold" value={categoria.codigo || ""} readOnly placeholder="Codigo" /></div>
                          <div className="col-md-5"><input className="form-control" value={categoria.descripcion || ""} onChange={(e) => cambiarCategoria(index, "descripcion", e.target.value)} placeholder="Descripcion opcional" /></div>
                          <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" disabled={form.categorias.length <= 1} onClick={() => setForm((prev) => ({ ...prev, categorias: prev.categorias.filter((_, itemIndex) => itemIndex !== index) }))}><i className="bi bi-trash"></i></button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(modeloConflictoNombre || modeloConflictoCodigo || categoriaRepetidaActual) && (
                    <div className="col-12">
                      <div className="alert alert-warning mb-0 py-2">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {modeloConflictoNombre
                          ? "Ya existe un modelo con este nombre."
                          : modeloConflictoCodigo
                            ? `El codigo de modelo ${form.codigo} ya esta ocupado.`
                            : `La categoria ${categoriaRepetidaActual.nombre || categoriaRepetidaActual.codigo} esta repetida.`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <span className="badge text-bg-warning me-auto">Pendiente hasta guardar el producto</span>
                <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={Boolean(modeloConflictoNombre || modeloConflictoCodigo || categoriaRepetidaActual || !form.codigo)}
                >
                  Guardar borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <SimpleDraftModal
        show={mostrarFamilia}
        tipo="familia"
        depth={1}
        lineas={lineas}
        existingItems={familias}
        forcedLineaId={lineaParaFamilia}
        initialValue={familiaEditando}
        onClose={() => {
          setMostrarFamilia(false);
          setFamiliaEditando(null);
        }}
        onCreateLinea={() => {
          setLineaEditando(null);
          setMostrarLinea(true);
        }}
        onSave={(familia) => {
          onUpsertDraft("familias", familia);
          setForm((prev) => ({ ...prev, familiaId: familia.ref }));
          setMostrarFamilia(false);
          setFamiliaEditando(null);
        }}
      />
      <SimpleDraftModal
        show={mostrarLinea}
        tipo="linea"
        depth={2}
        existingItems={lineas}
        initialValue={lineaEditando}
        onClose={() => {
          setMostrarLinea(false);
          setLineaEditando(null);
        }}
        onSave={(linea) => {
          onUpsertDraft("lineas", linea);
          setLineaParaFamilia(linea.ref);
          setMostrarLinea(false);
          setLineaEditando(null);
        }}
      />
    </>
  );
}
