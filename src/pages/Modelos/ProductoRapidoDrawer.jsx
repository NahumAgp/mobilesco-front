import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { obtenerModeloPorId } from "../../services/modelos.js";
import { obtenerFamiliaPorId } from "../../services/familias.js";
import { obtenerLineaProductoPorId } from "../../services/lineaProducto.js";
import { obtenerNiveles, crearNivel } from "../../services/niveles.js";
import { obtenerColores, crearColor } from "../../services/color.js";
import { crearProducto } from "../../services/variantes.js";
import { subirImagenArchivo } from "../../services/imagenes.js";
import { API_BASE_URL } from "../../config/apiConfig.js";
import SearchableSelect from "../../components/ui/SearchableSelect.jsx";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return respuesta?.content || respuesta?.data || respuesta?.items || [];
};

const limpiarCodigo = (valor = "") => valor.toString().toUpperCase().replace(/[^A-Z0-9]/g, "");

const tomarInicial = (valor, fallback = "X") => {
  const limpio = limpiarCodigo(valor);
  return limpio[0] || fallback;
};

const construirCodigoCategoria = (categoria) => {
  const base = limpiarCodigo(categoria?.codigo || "");
  if (/^\d+$/.test(base)) {
    return base.slice(-2).padStart(2, "0");
  }

  if (base) {
    return base.slice(0, 2).padEnd(2, "X");
  }

  const porId = String(categoria?.id || "").replace(/\D/g, "");
  if (porId) {
    return porId.slice(-2).padStart(2, "0");
  }

  return "00";
};

const construirCodigoColor = (color) => {
  const base = limpiarCodigo(color?.codigo || "");
  if (base) return base.slice(0, 2).padEnd(2, "X");

  const nombre = (color?.nombre || "").trim();
  if (!nombre) return "SC";

  const iniciales = nombre
    .split(/\s+/)
    .map((parte) => limpiarCodigo(parte)[0])
    .filter(Boolean)
    .join("");

  return (iniciales || "SC").slice(0, 2).padEnd(2, "X");
};

const construirSku = ({ linea, familia, modelo, categoria, color }) => {
  const codigoLinea = tomarInicial(linea?.codigo || linea?.nombre, "X");
  const codigoFamilia = tomarInicial(familia?.codigo || familia?.nombre, "X");
  const codigoModelo = tomarInicial(modelo?.codigo || modelo?.nombre, "X");

  const codigoCategoria = construirCodigoCategoria(categoria);
  const codigoColor = construirCodigoColor(color);

  return `${codigoLinea}${codigoFamilia}${codigoModelo}-${codigoCategoria}-${codigoColor}`;
};

const construirNombre = ({ modelo, categoria, color }) =>
  [modelo?.nombre || modelo?.codigo || "Producto", categoria?.nombre, color?.nombre]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const getImagenActiva = (imagen) =>
  imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenRepresentativa = (imagenes = []) => {
  if (!Array.isArray(imagenes) || imagenes.length === 0) return null;

  const principalActiva = imagenes.find(
    (img) => Boolean(img?.esPrincipal || img?.principal) && getImagenActiva(img) && img?.url
  );
  if (principalActiva) return principalActiva;

  const primeraActiva = imagenes.find((img) => getImagenActiva(img) && img?.url);
  if (primeraActiva) return primeraActiva;

  const principal = imagenes.find((img) => Boolean(img?.esPrincipal || img?.principal) && img?.url);
  if (principal) return principal;

  return imagenes.find((img) => img?.url) || null;
};

const getHexColor = (color) => {
  const hex = String(color?.hex || color?.codigoHex || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  return "#cbd5e1";
};

export default function ProductoRapidoDrawer({ show, modeloId, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const nextImagenIdRef = useRef(1);
  const imagenesRef = useRef([]);
  const descripcionAutoRef = useRef("");
  const [dragActive, setDragActive] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modeloBase, setModeloBase] = useState(null);
  const [familiaBase, setFamiliaBase] = useState(null);
  const [lineaBase, setLineaBase] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [formCategoria, setFormCategoria] = useState({ codigo: "", nombre: "" });
  const [formColor, setFormColor] = useState({ codigo: "", nombre: "", hex: "#808080" });
  const [mostrarAltaCategoria, setMostrarAltaCategoria] = useState(false);
  const [mostrarAltaColor, setMostrarAltaColor] = useState(false);
  const [formData, setFormData] = useState({
    categoriaId: "",
    colorId: "",
    descripcion: ""
  });

  const categoriaSeleccionada = useMemo(
    () => categorias.find((categoria) => String(categoria.id) === String(formData.categoriaId)) || null,
    [categorias, formData.categoriaId]
  );

  const colorSeleccionado = useMemo(
    () => colores.find((color) => String(color.id) === String(formData.colorId)) || null,
    [colores, formData.colorId]
  );

  const coloresOrdenados = useMemo(
    () => [...colores].sort((a, b) => String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")),
    [colores]
  );

  const skuGenerado = useMemo(
    () =>
      construirSku({
        linea: lineaBase,
        familia: familiaBase,
        modelo: modeloBase,
        categoria: categoriaSeleccionada,
        color: colorSeleccionado
      }),
    [lineaBase, familiaBase, modeloBase, categoriaSeleccionada, colorSeleccionado]
  );

  const nombreGenerado = useMemo(
    () =>
      construirNombre({
        modelo: modeloBase,
        categoria: categoriaSeleccionada,
        color: colorSeleccionado
      }),
    [modeloBase, categoriaSeleccionada, colorSeleccionado]
  );

  const descripcionGenerada = useMemo(
    () =>
      `Variante ${categoriaSeleccionada?.nombre || "sin categoria"} - ${colorSeleccionado?.nombre || "sin color"}`,
    [categoriaSeleccionada, colorSeleccionado]
  );

  const limpiarImagenesLocales = useCallback((lista) => {
    (lista || []).forEach((imagen) => {
      if (imagen?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(imagen.url);
      }
    });
  }, []);

  useEffect(() => {
    imagenesRef.current = imagenes;
  }, [imagenes]);

  useEffect(() => {
    setFormData((prev) => {
      const descripcionActual = prev.descripcion || "";
      const descripcionAnterior = descripcionAutoRef.current;

      descripcionAutoRef.current = descripcionGenerada;

      if (!descripcionActual || descripcionActual === descripcionAnterior) {
        return {
          ...prev,
          descripcion: descripcionGenerada
        };
      }

      return prev;
    });
  }, [descripcionGenerada]);

  const resetForm = useCallback(() => {
    setError("");
    setGuardando(false);
    setDragActive(false);
    setModeloBase(null);
    setFamiliaBase(null);
    setLineaBase(null);
    setCategorias([]);
    setColores([]);
    setImagenes([]);
    setFormCategoria({ codigo: "", nombre: "" });
    setFormColor({ codigo: "", nombre: "", hex: "#808080" });
    setMostrarAltaCategoria(false);
    setMostrarAltaColor(false);
    descripcionAutoRef.current = "";
    setFormData({
      categoriaId: "",
      colorId: "",
      descripcion: descripcionGenerada
    });
    nextImagenIdRef.current = 1;
  }, [descripcionGenerada]);

  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show, resetForm]);

  useEffect(() => () => limpiarImagenesLocales(imagenesRef.current), [limpiarImagenesLocales]);

  useEffect(() => {
    if (!show) return undefined;

    let cancelado = false;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const [modeloResp, categoriasResp, coloresResp] = await Promise.all([
          modeloId ? obtenerModeloPorId(modeloId) : Promise.resolve(null),
          obtenerNiveles(),
          obtenerColores()
        ]);

        if (cancelado) return;

        const modelo = modeloResp || null;
        setModeloBase(modelo);
        setCategorias(getLista(categoriasResp));
        setColores(getLista(coloresResp));

        const familiaId = modelo?.familiaId || modelo?.familia_id || modelo?.familia?.id || null;
        if (familiaId) {
          try {
            const familia = await obtenerFamiliaPorId(familiaId);
            if (cancelado) return;
            setFamiliaBase(familia || null);

            const lineaId = familia?.lineaId || familia?.linea?.id || null;
            if (lineaId) {
              try {
                const linea = await obtenerLineaProductoPorId(lineaId);
                if (cancelado) return;
                setLineaBase(linea || null);
              } catch {
                if (!cancelado) {
                  setLineaBase(null);
                }
              }
            } else {
              setLineaBase(null);
            }
          } catch {
            if (!cancelado) {
              setFamiliaBase(null);
              setLineaBase(null);
            }
          }
        }
      } catch (loadingError) {
        if (!cancelado) {
          setError(loadingError?.message || "No se pudieron cargar los datos del producto.");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [show, modeloId]);

  const validarArchivos = (files) => {
    const validos = files.filter((file) => file.type.startsWith("image/") && file.size <= MAX_SIZE_BYTES);
    if (validos.length !== files.length) {
      setError("Algunas imagenes se omitieron por formato invalido o tamano mayor a 5MB.");
    } else {
      setError("");
    }
    return validos;
  };

  const refrescarCategorias = async () => {
    const respuesta = await obtenerNiveles();
    const lista = getLista(respuesta);
    setCategorias(lista);
    return lista;
  };

  const refrescarColores = async () => {
    const respuesta = await obtenerColores();
    const lista = getLista(respuesta);
    setColores(lista);
    return lista;
  };

  const crearCategoriaRapida = async () => {
    const nombre = formCategoria.nombre.trim();
    if (!nombre) {
      setError("Escribe el nombre de la categoria.");
      return;
    }

    const codigoSugerido = String(categorias.length + 1).padStart(2, "0");

    try {
      setError("");
      const creada = await crearNivel({
        codigo: (formCategoria.codigo || codigoSugerido).trim(),
        nombre,
        descripcion: "Creada desde el panel rapido de producto",
        activo: true
      });

      const categoriasActualizadas = await refrescarCategorias();
      const categoriaCreada =
        categoriasActualizadas.find((cat) => String(cat.id) === String(creada?.id)) ||
        categoriasActualizadas.find((cat) => cat.nombre?.trim().toLowerCase() === nombre.toLowerCase());

      if (categoriaCreada?.id) {
        setFormData((prev) => ({ ...prev, categoriaId: String(categoriaCreada.id) }));
      }

      setFormCategoria({ codigo: "", nombre: "" });
      setMostrarAltaCategoria(false);
    } catch (error) {
      setError(error?.message || "No se pudo crear la categoria.");
    }
  };

  const crearColorRapido = async () => {
    const nombre = formColor.nombre.trim();
    if (!nombre) {
      setError("Escribe el nombre del color.");
      return;
    }

    const codigoSugerido = nombre
      .split(/\s+/)
      .map((parte) => parte[0]?.toUpperCase())
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .padEnd(2, "X");

    try {
      setError("");
      const creada = await crearColor({
        codigo: (formColor.codigo || codigoSugerido).trim().toUpperCase(),
        nombre,
        hex: (formColor.hex || "#808080").trim().toUpperCase()
      });

      const coloresActualizados = await refrescarColores();
      const colorCreado =
        coloresActualizados.find((color) => String(color.id) === String(creada?.id)) ||
        coloresActualizados.find((color) => color.nombre?.trim().toLowerCase() === nombre.toLowerCase());

      if (colorCreado?.id) {
        setFormData((prev) => ({ ...prev, colorId: String(colorCreado.id) }));
      }

      setFormColor({ codigo: "", nombre: "", hex: "#808080" });
      setMostrarAltaColor(false);
    } catch (error) {
      setError(error?.message || "No se pudo crear el color.");
    }
  };

  const agregarImagenes = (files) => {
    const validas = validarArchivos(files);
    if (validas.length === 0) return;

    setImagenes((prev) => {
      const tienePrincipal = prev.some((imagen) => Boolean(imagen?.principal));
      const nuevas = validas.map((file, index) => ({
        id: `tmp-${Date.now()}-${nextImagenIdRef.current++}`,
        file,
        url: URL.createObjectURL(file),
        nombre: file.name,
        principal: !tienePrincipal && prev.length === 0 && index === 0,
        orden: prev.length + index + 1
      }));

      return [...prev, ...nuevas];
    });
  };

  const manejarCambioImagen = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    agregarImagenes(files);
  };

  const manejarDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const manejarDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    agregarImagenes(files);
  };

  const establecerPrincipal = (imagenId) => {
    setImagenes((prev) =>
      prev.map((imagen) => ({
        ...imagen,
        principal: imagen.id === imagenId
      }))
    );
  };

  const eliminarImagen = (imagenId) => {
    setImagenes((prev) => {
      const siguiente = prev.filter((imagen) => imagen.id !== imagenId);
      const imagenEliminada = prev.find((imagen) => imagen.id === imagenId);
      if (imagenEliminada?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(imagenEliminada.url);
      }

      if (siguiente.length > 0 && !siguiente.some((imagen) => imagen.principal)) {
        siguiente[0] = { ...siguiente[0], principal: true };
      }

      return siguiente;
    });
  };

  const cerrarPanel = () => {
    limpiarImagenesLocales(imagenes);
    onClose?.();
  };

  const handleGuardar = async () => {
    if (!modeloId) {
      setError("No se encontro el modelo asociado.");
      return;
    }

    if (!formData.categoriaId || !formData.colorId) {
      setError("Selecciona nivel/categoria y color para generar el SKU.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const imagenPrincipalLocal = imagenes.find((imagen) => imagen.principal) || imagenes[0] || null;
      const imagenesConPrincipal = imagenes.map((imagen, index) => ({
        ...imagen,
        principal:
          Boolean(imagen.principal) || (!imagenPrincipalLocal && index === 0) || (imagenPrincipalLocal && imagen.id === imagenPrincipalLocal.id)
      }));

      const payload = {
        sku: skuGenerado,
        nombre: nombreGenerado || modeloBase?.nombre || "Producto",
        descripcion: formData.descripcion?.trim() || descripcionGenerada,
        activo: true,
        id_modelo: Number(modeloId),
        id_nivel: Number(formData.categoriaId),
        id_color: Number(formData.colorId)
      };

      const productoGuardado = await crearProducto(payload);
      const productoIdCreado = productoGuardado?.id || productoGuardado?.productoId || productoGuardado?.varianteId;

      if (!productoIdCreado) {
        throw new Error("No se recibio el ID del producto creado.");
      }

      for (let index = 0; index < imagenesConPrincipal.length; index += 1) {
        const imagen = imagenesConPrincipal[index];
        if (!(imagen.file instanceof File)) continue;

        await subirImagenArchivo({
          archivo: imagen.file,
          productoId: Number(productoIdCreado),
          esPrincipal: Boolean(imagen.principal),
          orden: index + 1,
          altTexto: imagen.nombre || `Imagen ${index + 1}`
        });
      }

      limpiarImagenesLocales(imagenes);
      setImagenes([]);
      onSaved?.(productoGuardado);
      cerrarPanel();
    } catch (saveError) {
      setError(saveError?.message || "No se pudo crear el producto.");
    } finally {
      setGuardando(false);
    }
  };

  if (!show) return null;

  const imagenRepresentativa = getImagenRepresentativa(imagenes);
  const previewUrl = imagenRepresentativa?.url ? toPreviewUrl(imagenRepresentativa.url) : "";

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1040 }}
        onClick={cerrarPanel}
      />

      <div
        className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column"
        style={{ width: "min(560px, 100vw)", zIndex: 1050 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-bottom p-3 d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">Nuevo producto</h5>
            <div className="text-muted small">
              {modeloBase?.nombre || "Modelo seleccionado"}
            </div>
          </div>
          <button type="button" className="btn-close" onClick={cerrarPanel} />
        </div>

        <div className="flex-grow-1 overflow-auto p-3">
          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 mb-0">Cargando datos...</p>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-warning py-2">{error}</div>}

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">Nivel / Categoria *</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    onClick={() => setMostrarAltaCategoria((prev) => !prev)}
                  >
                    {mostrarAltaCategoria ? "Ocultar alta" : "Crear categoria"}
                  </button>
                </div>
                <SearchableSelect
                  value={formData.categoriaId}
                  options={categorias}
                  onChange={(value) => setFormData((prev) => ({ ...prev, categoriaId: value }))}
                  placeholder="Seleccionar nivel / categoria..."
                  searchPlaceholder="Escribe código, nombre o descripción..."
                  getOptionValue={(categoria) => categoria.id}
                  getOptionLabel={(categoria) => `${categoria.codigo ? `[${categoria.codigo}] ` : ""}${categoria.nombre}`}
                  getOptionSearchText={(categoria) =>
                    [categoria.codigo, categoria.nombre, categoria.descripcion].filter(Boolean).join(" ").toLowerCase()
                  }
                  actionNode={
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMostrarAltaCategoria((prev) => !prev)}
                      title="Crear categoria"
                    >
                      +
                    </button>
                  }
                />
                {mostrarAltaCategoria && (
                  <div className="border rounded p-3 mt-2 bg-white">
                    <div className="row g-2">
                      <div className="col-4">
                        <input
                          className="form-control"
                          value={formCategoria.codigo}
                          onChange={(e) => setFormCategoria((prev) => ({ ...prev, codigo: e.target.value }))}
                          placeholder="Codigo"
                        />
                      </div>
                      <div className="col-8">
                        <input
                          className="form-control"
                          value={formCategoria.nombre}
                          onChange={(e) => setFormCategoria((prev) => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Nombre de categoria"
                        />
                      </div>
                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setMostrarAltaCategoria(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={crearCategoriaRapida}
                        >
                          Guardar categoria
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">Color *</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    onClick={() => setMostrarAltaColor((prev) => !prev)}
                  >
                    {mostrarAltaColor ? "Ocultar alta" : "Crear color"}
                  </button>
                </div>
                <SearchableSelect
                  value={formData.colorId}
                  options={coloresOrdenados}
                  onChange={(value) => setFormData((prev) => ({ ...prev, colorId: value }))}
                  placeholder="Seleccionar color..."
                  searchPlaceholder="Escribe código, nombre o hex..."
                  getOptionValue={(color) => color.id}
                  getOptionLabel={(color) => `${color.codigo ? `[${color.codigo}] ` : ""}${color.nombre}`}
                  getOptionSearchText={(color) =>
                    [color.codigo, color.nombre, color.descripcion, color.hex].filter(Boolean).join(" ").toLowerCase()
                  }
                  actionNode={
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMostrarAltaColor((prev) => !prev)}
                      title="Crear color"
                    >
                      +
                    </button>
                  }
                />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {coloresOrdenados.slice(0, 10).map((color) => {
                    const hex = getHexColor(color);
                    const esSeleccionado = String(color.id) === String(formData.colorId);

                    return (
                      <button
                        key={color.id}
                        type="button"
                        className={`btn p-0 border ${esSeleccionado ? "border-primary border-2" : "border-light"}`}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: hex
                        }}
                        title={color.nombre}
                        onClick={() => setFormData((prev) => ({ ...prev, colorId: String(color.id) }))}
                      />
                    );
                  })}
                </div>
                <div className="d-flex gap-2 mt-2 align-items-center">
                  <div
                    className="border rounded"
                    style={{
                      width: "44px",
                      height: "38px",
                      backgroundColor: getHexColor(colorSeleccionado)
                    }}
                    title={colorSeleccionado?.nombre || "Color seleccionado"}
                  />
                  <small className="text-muted">
                    {colorSeleccionado?.nombre || "Sin color seleccionado"}
                  </small>
                </div>
                {mostrarAltaColor && (
                  <div className="border rounded p-3 mt-2 bg-white">
                    <div className="row g-2">
                      <div className="col-4">
                        <input
                          className="form-control"
                          value={formColor.codigo}
                          onChange={(e) => setFormColor((prev) => ({ ...prev, codigo: e.target.value }))}
                          placeholder="Codigo"
                        />
                      </div>
                      <div className="col-8">
                        <input
                          className="form-control"
                          value={formColor.nombre}
                          onChange={(e) => setFormColor((prev) => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Nombre del color"
                        />
                      </div>
                      <div className="col-8">
                        <input
                          type="color"
                          className="form-control form-control-color w-100"
                          value={formColor.hex}
                          onChange={(e) => setFormColor((prev) => ({ ...prev, hex: e.target.value.toUpperCase() }))}
                        />
                        <small className="text-muted">Elige el color visualmente antes de guardarlo.</small>
                      </div>
                      <div className="col-4 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setMostrarAltaColor(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={crearColorRapido}
                        >
                          Guardar color
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">SKU generado</label>
                <input type="text" className="form-control bg-light" value={skuGenerado} readOnly />
                <small className="text-muted">
                  Se arma con linea, familia, modelo, nivel y color.
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre generado</label>
                <input type="text" className="form-control bg-light" value={nombreGenerado} readOnly />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Descripcion opcional</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripcion corta del producto"
                />
              </div>

              <div className="border-2 border-dashed rounded p-3 text-center mb-3"
                style={{
                  borderStyle: "dashed",
                  cursor: "pointer",
                  background: dragActive ? "#eef5ff" : "#fafafa"
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={manejarDrag}
                onDragLeave={manejarDrag}
                onDragOver={manejarDrag}
                onDrop={manejarDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="d-none"
                  onChange={manejarCambioImagen}
                />
                <i className="bi bi-images fs-3 text-secondary"></i>
                <div className="mt-2 fw-semibold">Imagenes del producto</div>
                <small className="text-muted">Arrastra o selecciona imagenes para subirlas luego.</small>
              </div>

              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-secondary">{imagenes.length}</span>
                {previewUrl && (
                  <span className="badge bg-success">Imagen principal lista</span>
                )}
              </div>

              {imagenes.length > 0 ? (
                <div className="row g-2">
                  {imagenes.map((imagen) => (
                    <div className="col-6" key={imagen.id}>
                      <div className="card h-100 shadow-sm">
                        <img
                          src={imagen.url}
                          alt={imagen.nombre}
                          className="card-img-top"
                          style={{ height: "140px", objectFit: "cover" }}
                        />
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-center gap-2">
                            {imagen.principal ? (
                              <span className="badge bg-success">Principal</span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => establecerPrincipal(imagen.id)}
                              >
                                Principal
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => eliminarImagen(imagen.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Todavia no agregas imagenes.</div>
              )}
            </>
          )}
        </div>

        <div className="border-top p-3 d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={cerrarPanel} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={guardando || cargando}
          >
            {guardando ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </div>
    </>
  );
}
