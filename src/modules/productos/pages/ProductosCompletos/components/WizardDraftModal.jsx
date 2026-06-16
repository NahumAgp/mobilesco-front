/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "../../../../../components/ui/SearchableSelect.jsx";
import { obtenerFamiliasActivas } from "../../../../familias/services/familias.js";
import { obtenerLineasActivas } from "../../../../lineas-producto/services/lineaProducto.js";
import { obtenerCategoriasGlobalesActivas } from "../../../../modelos/services/categoriasGlobales.js";
import { materialGateway } from "../../../../materiales/services/materialGateway.js";

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

const aplicarCodigosCategoriaModelo = (categorias = []) =>
  categorias.map((categoria, index) => ({
    ...categoria,
    codigo: String(index + 1).padStart(2, "0")
  }));

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

const getMaterialesDelModelo = (modelo = {}) => {
  const candidatos = [
    modelo?.materiales,
    modelo?.materialesSeleccionados,
    modelo?.materiales_modelo,
    modelo?.materialesModelos,
    modelo?.materiales_asociados
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) {
      return candidato.map((material) => ({
        ...material,
        id: material?.id ?? material?.materialId ?? material?.id_material ?? material?.material_id ?? null,
        codigo: material?.codigo ?? material?.codigo_material ?? "",
        nombre: material?.nombre ?? material?.nombre_material ?? "",
        descripcion: material?.descripcion ?? material?.descripcion_material ?? "",
        activo: material?.activo ?? true
      }));
    }
  }

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
  const [materialesExistentes, setMaterialesExistentes] = useState([]);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
  const [materialSeleccionadoId, setMaterialSeleccionadoId] = useState("");
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState("");
  const [categoriaArrastradaIndex, setCategoriaArrastradaIndex] = useState(null);
  const [mostrarFamilia, setMostrarFamilia] = useState(false);
  const [mostrarLinea, setMostrarLinea] = useState(false);
  const [mostrarMaterial, setMostrarMaterial] = useState(false);
  const [mostrarCategoria, setMostrarCategoria] = useState(false);
  const [lineaParaFamilia, setLineaParaFamilia] = useState("");
  const [familiaEditando, setFamiliaEditando] = useState(null);
  const [lineaEditando, setLineaEditando] = useState(null);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [cargandoMateriales, setCargandoMateriales] = useState(false);
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
      materiales: getMaterialesDelModelo(initialValue),
      categorias: initialValue?.categorias?.length
        ? aplicarCodigosCategoriaModelo(initialValue.categorias)
        : []
    });
    setErrores({});
    setMaterialesSeleccionados(getMaterialesDelModelo(initialValue));
    setMaterialSeleccionadoId("");
    setCategoriaSeleccionadaId("");
    setCategoriaArrastradaIndex(null);
    setCargandoMateriales(true);
    Promise.all([
      obtenerFamiliasActivas(),
      obtenerLineasActivas(),
      obtenerCategoriasGlobalesActivas(),
      materialGateway.obtenerMaterialesActivos()
    ])
      .then(([familias, lineas, categorias, materiales]) => {
        setFamiliasExistentes(getLista(familias));
        setLineasExistentes(getLista(lineas));
        setCategoriasExistentes(getLista(categorias));
        setMaterialesExistentes(getLista(materiales));
      })
      .catch((error) => console.error("No se pudieron cargar familias, lineas, categorias y materiales:", error))
      .finally(() => setCargandoMateriales(false));
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
    (item.categoriaId && (form.categorias || []).some(
      (otra) => String(otra.ref || otra.id) !== String(item.ref || item.id)
        && String(otra.categoriaId) === String(item.categoriaId)
    ))
    || (!item.categoriaId && (
      buscarDuplicado(categoriasComparablesActuales, "nombre", item.nombre, item.ref || item.id)
    ))
  );
  const materialesDisponibles = useMemo(
    () =>
      materialesExistentes.filter(
        (material) => !materialesSeleccionados.some((seleccionado) => String(seleccionado.id) === String(material.id))
      ),
    [materialesExistentes, materialesSeleccionados]
  );
  const categoriasDisponibles = useMemo(
    () =>
      categoriasExistentes.filter(
        (categoria) => !form.categorias?.some(
          (seleccionada) => String(seleccionada.categoriaId || seleccionada.id) === String(categoria.id)
        )
      ),
    [categoriasExistentes, form.categorias]
  );

  const agregarMaterial = (materialId, material) => {
    const idNormalizado = Number(materialId);
    if (!Number.isFinite(idNormalizado)) return;

    setMaterialesSeleccionados((prev) => {
      if (prev.some((item) => String(item.id) === String(idNormalizado))) {
        return prev;
      }

      const materialCompleto = material || materialesExistentes.find((item) => String(item.id) === String(idNormalizado));
      if (!materialCompleto) return prev;

      return [...prev, { ...materialCompleto, id: materialCompleto.id ?? idNormalizado }];
    });
    setMaterialSeleccionadoId("");
  };

  const quitarMaterial = (materialId) => {
    setMaterialesSeleccionados((prev) => prev.filter((material) => String(material.id) !== String(materialId)));
  };

  const agregarCategoria = (categoriaId, categoria) => {
    const idNormalizado = Number(categoriaId);
    if (!Number.isFinite(idNormalizado)) return;

    const categoriaCompleta = categoria || categoriasExistentes.find((item) => String(item.id) === String(idNormalizado));
    if (!categoriaCompleta) return;

    setForm((prev) => {
      if (prev.categorias?.some((item) => String(item.categoriaId || item.id) === String(idNormalizado))) {
        return prev;
      }

      const ref = crearRefBorrador("categoria");
      const categoriaModelo = {
        id: ref,
        ref,
        categoriaId: idNormalizado,
        codigo: "",
        nombre: categoriaCompleta.nombre || "",
        descripcion: categoriaCompleta.descripcion || "",
        activo: categoriaCompleta.activo !== false
      };

      const categoriasActuales = prev.categorias || [];
      const categoriasSinFilaVacia = categoriasActuales.filter(
        (item) => item.categoriaId || item.nombre?.trim() || item.descripcion?.trim()
      );

      return { ...prev, categorias: aplicarCodigosCategoriaModelo([...categoriasSinFilaVacia, categoriaModelo]) };
    });
    setCategoriaSeleccionadaId("");
  };

  const quitarCategoria = (categoriaId) => {
    setForm((prev) => ({
      ...prev,
      categorias: aplicarCodigosCategoriaModelo(
        prev.categorias.filter((categoria) => String(categoria.id || categoria.ref) !== String(categoriaId))
      )
    }));
  };

  const moverCategoria = (origenIndex, destinoIndex) => {
    if (origenIndex === null || destinoIndex === null || origenIndex === destinoIndex) return;
    setForm((prev) => {
      const categorias = [...(prev.categorias || [])];
      if (!categorias[origenIndex] || !categorias[destinoIndex]) return prev;
      const [movida] = categorias.splice(origenIndex, 1);
      categorias.splice(destinoIndex, 0, movida);
      return { ...prev, categorias: aplicarCodigosCategoriaModelo(categorias) };
    });
  };

  const guardarMaterial = (material) => {
    onUpsertDraft("materiales", material);
    setMaterialesExistentes((prev) => {
      const materialNormalizado = {
        ...material,
        id: material?.id ?? material?.ref ?? material?.materialId ?? null
      };
      const sinDuplicado = prev.filter((item) => String(item.id || item.ref) !== String(materialNormalizado.id || materialNormalizado.ref));
      return [...sinDuplicado, materialNormalizado];
    });
    setMaterialesSeleccionados((prev) => {
      const siguiente = prev.filter((item) => String(item.id || item.ref) !== String(material.id || material.ref));
      return [...siguiente, material];
    });
    setMaterialEditando(null);
    setMostrarMaterial(false);
  };

  const guardarCategoria = (categoria) => {
    onUpsertDraft("categorias", categoria);
    setCategoriasExistentes((prev) => {
      const categoriaNormalizada = {
        ...categoria,
        id: categoria?.id ?? categoria?.ref ?? null
      };
      const sinDuplicado = prev.filter((item) => String(item.id || item.ref) !== String(categoriaNormalizada.id || categoriaNormalizada.ref));
      return [...sinDuplicado, categoriaNormalizada];
    });
    setForm((prev) => {
      const siguiente = (prev.categorias || []).filter((item) => String(item.id || item.ref) !== String(categoria.id || categoria.ref));
      return { ...prev, categorias: aplicarCodigosCategoriaModelo([...siguiente, categoria]) };
    });
    setCategoriaEditando(null);
    setMostrarCategoria(false);
    setCategoriaSeleccionadaId("");
  };

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
      materiales: materialesSeleccionados.map((material) => ({
        ...material,
        id: material.id ?? material.materialId,
        _pending: true
      })),
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
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="fw-semibold">Materiales asociados</div>
                        <small className="text-muted">Se siguen tomando del catálogo global, pero aquí defines cuáles usa el modelo.</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setMaterialEditando(null);
                          setMostrarMaterial(true);
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i>
                        Nuevo material
                      </button>
                    </div>

                    <SearchableSelect
                      label=""
                      value={materialSeleccionadoId}
                      options={materialesDisponibles}
                      onChange={agregarMaterial}
                      placeholder={cargandoMateriales ? "Cargando materiales..." : "Buscar y agregar material..."}
                      searchPlaceholder="Busca por código, nombre o descripción..."
                      loading={cargandoMateriales}
                      emptyText="No hay materiales disponibles"
                      getOptionValue={(item) => item.id || item.materialId}
                      getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                      getOptionSearchText={(item) => [item.codigo, item.nombre, item.descripcion].filter(Boolean).join(" ").toLowerCase()}
                      renderOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                      helperText="Puedes asociar varios materiales al modelo sin duplicarlos."
                    />

                    {materialesSeleccionados.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {materialesSeleccionados.map((material) => (
                          <span key={material.id} className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2">
                            <span>{material.codigo ? `[${material.codigo}] ` : ""}{material.nombre || "-"}</span>
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0 bg-transparent text-danger"
                              onClick={() => quitarMaterial(material.id)}
                              title="Quitar material"
                              aria-label={`Quitar material ${material.nombre || material.codigo || material.id}`}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0 bg-transparent text-secondary"
                              onClick={() => {
                                setMaterialEditando(material);
                                setMostrarMaterial(true);
                              }}
                              title="Editar material"
                              aria-label={`Editar material ${material.nombre || material.codigo || material.id}`}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="form-text text-muted">No hay materiales asociados todavía.</div>
                    )}
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                      <div>
                        <div className="fw-semibold">Categorias propias del modelo *</div>
                        <small className="text-muted">Se toman del catalogo global, pero aqui defines cuales usa el modelo.</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setCategoriaEditando(null);
                          setMostrarCategoria(true);
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i>
                        Categoria
                      </button>
                    </div>

                    <div className="mt-3">
                      <SearchableSelect
                        label=""
                        value={categoriaSeleccionadaId}
                        options={categoriasDisponibles}
                        onChange={agregarCategoria}
                        placeholder="Buscar y agregar categoria..."
                        searchPlaceholder="Busca por codigo, nombre o descripcion..."
                        emptyText="No hay categorias disponibles"
                        getOptionValue={(item) => item.id}
                        getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                        getOptionSearchText={(item) => [item.codigo, item.nombre, item.descripcion].filter(Boolean).join(" ").toLowerCase()}
                        renderOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
                        helperText="Puedes asociar varias categorias al modelo sin duplicarlas."
                      />
                    </div>

                    {errores.categorias && <div className="text-danger small mt-2">{errores.categorias}</div>}
                    {(form.categorias || []).length > 0 ? (
                      <div className="list-group mt-2">
                        {(form.categorias || []).map((categoria, index) => (
                          <div
                            key={categoria.ref || categoria.id}
                            className={`list-group-item d-flex align-items-center gap-2 ${categoriaArrastradaIndex === index ? "opacity-50" : ""}`}
                            draggable
                            onDragStart={(event) => {
                              setCategoriaArrastradaIndex(index);
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", String(index));
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              const origen = Number(event.dataTransfer.getData("text/plain"));
                              moverCategoria(Number.isFinite(origen) ? origen : categoriaArrastradaIndex, index);
                              setCategoriaArrastradaIndex(null);
                            }}
                            onDragEnd={() => setCategoriaArrastradaIndex(null)}
                          >
                            <span className="text-muted" title="Arrastrar para ordenar" aria-label="Arrastrar para ordenar">
                              <i className="bi bi-grip-vertical"></i>
                            </span>
                            <span className="badge text-bg-primary">{categoria.codigo || String(index + 1).padStart(2, "0")}</span>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{categoria.nombre || "-"}</div>
                              {categoria.descripcion && <small className="text-muted">{categoria.descripcion}</small>}
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0 bg-transparent text-danger"
                              onClick={() => quitarCategoria(categoria.id || categoria.ref)}
                              title="Quitar categoria"
                              aria-label={`Quitar categoria ${categoria.nombre || categoria.codigo || categoria.id}`}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                            {categoria._pending && (
                              <button
                                type="button"
                                className="btn btn-sm p-0 border-0 bg-transparent text-secondary"
                                onClick={() => {
                                  setCategoriaEditando(categoria);
                                  setMostrarCategoria(true);
                                }}
                                title="Editar categoria"
                                aria-label={`Editar categoria ${categoria.nombre || categoria.codigo || categoria.id}`}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="form-text text-muted">No hay categorias asociadas todavia.</div>
                    )}
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
      <SimpleDraftModal
        show={mostrarMaterial}
        tipo="material"
        depth={1}
        initialValue={materialEditando}
        existingItems={materialesExistentes}
        onClose={() => {
          setMostrarMaterial(false);
          setMaterialEditando(null);
        }}
        onSave={(material) => guardarMaterial(material)}
      />
      <SimpleDraftModal
        show={mostrarCategoria}
        tipo="categoria"
        depth={1}
        initialValue={categoriaEditando}
        existingItems={categoriasExistentes}
        onClose={() => {
          setMostrarCategoria(false);
          setCategoriaEditando(null);
        }}
        onSave={(categoria) => guardarCategoria(categoria)}
      />
    </>
  );
}
