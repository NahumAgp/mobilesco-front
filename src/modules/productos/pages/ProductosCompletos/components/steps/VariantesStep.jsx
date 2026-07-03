import { useEffect, useMemo, useState } from "react";

import { obtenerNiveles } from "../../../../services/niveles.js";
import { obtenerColores } from "../../../../../colores/services/color.js";
import { obtenerMaterialesActivos } from "../../../../../materiales/services/materiales.js";
import { obtenerFamiliaPorId } from "../../../../../familias/services/familias.js";
import { obtenerLineaProductoPorId } from "../../../../../lineas-producto/services/lineaProducto.js";
import { obtenerCategoriasGlobalesActivas } from "../../../../../modelos/services/categoriasGlobales.js";
import SearchableSelect from "../../../../../../components/ui/SearchableSelect.jsx";
import { SimpleDraftModal, crearRefBorrador } from "../WizardDraftModal.jsx";

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

const limpiarCodigo = (valor = "") => valor.toString().toUpperCase().replace(/[^A-Z0-9]/g, "");

const construirCodigoCatalogo = (item, fallback = "X") => {
  const base = limpiarCodigo(item?.codigo || "");
  return base || fallback;
};

const construirCodigoCategoria = (categoria) => {
  const porId = String(categoria?.id || "").replace(/\D/g, "");
  return construirCodigoCatalogo(categoria, porId ? porId.slice(-2).padStart(2, "0") : "00");
};

const construirCodigoColor = (color) => {
  const iniciales = (color?.nombre || "")
    .trim()
    .split(/\s+/)
    .map((parte) => limpiarCodigo(parte)[0])
    .filter(Boolean)
    .join("");

  return construirCodigoCatalogo(color, (iniciales || "SC").slice(0, 2).padEnd(2, "X"));
};

const construirCodigoMaterial = (material) => {
  const iniciales = (material?.nombre || "")
    .trim()
    .split(/\s+/)
    .map((parte) => limpiarCodigo(parte)[0])
    .filter(Boolean)
    .join("");

  return construirCodigoCatalogo(material, (iniciales || "MAT").slice(0, 3).padEnd(3, "X"));
};

const construirSku = ({ linea, familia, modelo, categoria, material, color }) => {
  const codigoLinea = construirCodigoCatalogo(linea, "X");
  const codigoFamilia = construirCodigoCatalogo(familia, "X");
  const codigoModelo = construirCodigoCatalogo(modelo, "X");

  return `${codigoLinea}${codigoFamilia}${codigoModelo}-${construirCodigoCategoria(categoria)}-${construirCodigoMaterial(material)}-${construirCodigoColor(color)}`;
};

const getParKey = (categoriaId, materialId, colorId) => `${categoriaId}::${materialId}::${colorId}`;
const getVarianteDraftId = (categoriaId, materialId, colorId) => `draft-variante::${getParKey(categoriaId, materialId, colorId)}`;

const getImagenesPorVariante = (imagenes) => {
  if (Array.isArray(imagenes)) return {};
  if (imagenes && typeof imagenes === "object" && imagenes.variantes) {
    return imagenes.variantes;
  }
  return {};
};

const getImagenModelo = (imagenes) => {
  if (Array.isArray(imagenes)) {
    return imagenes.find((img) => img?.principal) || imagenes[0] || null;
  }
  if (imagenes && typeof imagenes === "object") {
    return imagenes.modelo || null;
  }
  return null;
};

const primeraImagenDisponible = (mapaVariantes) => {
  const entradas = Object.values(mapaVariantes || {});
  for (const lista of entradas) {
    if (Array.isArray(lista) && lista.length > 0) {
      return lista[0];
    }
  }
  return null;
};

const getCategoriaKey = (categoriaId) => String(categoriaId);
const getMaterialKey = (materialId) => String(materialId);
const getColorKey = (colorId) => String(colorId);
const obtenerCampo = (item, claves = []) => {
  for (const clave of claves) {
    const valor = item?.[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return null;
};

const getCategoriaProducto = (producto) =>
  obtenerCampo(producto, ["categoriaId", "nivelId", "id_nivel", "categoria_id", "nivel_id"]);
const getMaterialProducto = (producto) =>
  obtenerCampo(producto, ["materialId", "id_material", "material_id"]);
const getColorProducto = (producto) =>
  obtenerCampo(producto, ["colorId", "id_color", "color_id"]);

const normalizarTexto = (valor = "") =>
  valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const parseCodigoCategoria = (codigo) => {
  const parsed = Number.parseInt(String(codigo || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatoCodigoCategoria = (numero) => String(numero).padStart(2, "0");

const ordenarPorCodigoCategoria = (a, b) => {
  const codigoA = parseCodigoCategoria(a?.codigo);
  const codigoB = parseCodigoCategoria(b?.codigo);
  if (codigoA !== codigoB) return codigoA - codigoB;
  return String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es", { numeric: true, sensitivity: "base" });
};

const maxCodigoCategoria = (categorias = []) =>
  categorias.reduce((maximo, categoria) => Math.max(maximo, parseCodigoCategoria(categoria?.codigo)), 0);

const existeCategoriaEnLista = (categoria, categorias = []) => {
  const categoriaId = categoria?.categoriaId || categoria?.id;
  const nombre = normalizarTexto(categoria?.nombre);

  return categorias.some((item) => {
    const itemCategoriaId = item?.categoriaId || item?.id;
    if (categoriaId && itemCategoriaId && String(itemCategoriaId) === String(categoriaId)) return true;
    return nombre && normalizarTexto(item?.nombre) === nombre;
  });
};

function CategoriaBatchModal({
  show,
  categoriasBase = [],
  categoriasActuales = [],
  categoriasGlobales = [],
  onClose,
  onSave
}) {
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState("");
  const [manual, setManual] = useState({ nombre: "", descripcion: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setSeleccionadas([]);
    setCategoriaSeleccionadaId("");
    setManual({ nombre: "", descripcion: "" });
    setError("");
  }, [show]);

  const codigoBase = useMemo(() => maxCodigoCategoria(categoriasActuales), [categoriasActuales]);
  const categoriasFijas = useMemo(
    () => [...categoriasBase].sort(ordenarPorCodigoCategoria),
    [categoriasBase]
  );
  const categoriasDisponibles = useMemo(
    () =>
      categoriasGlobales
        .filter((categoria) => !existeCategoriaEnLista(categoria, categoriasActuales))
        .filter((categoria) => !existeCategoriaEnLista(categoria, seleccionadas))
        .sort((a, b) => String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es", { sensitivity: "base" })),
    [categoriasActuales, categoriasGlobales, seleccionadas]
  );

  if (!show) return null;

  const agregarCategoriaGlobal = (categoriaId, categoria) => {
    const categoriaCompleta = categoria || categoriasGlobales.find((item) => String(item.id) === String(categoriaId));
    if (!categoriaCompleta) return;

    if (existeCategoriaEnLista(categoriaCompleta, [...categoriasActuales, ...seleccionadas])) {
      setError("Esa categoria ya esta asignada al modelo.");
      return;
    }

    const ref = crearRefBorrador("categoria");
    setSeleccionadas((prev) => [
      ...prev,
      {
        id: ref,
        ref,
        categoriaId: Number(categoriaCompleta.id),
        nombre: categoriaCompleta.nombre || "",
        descripcion: categoriaCompleta.descripcion || "",
        activo: categoriaCompleta.activo !== false,
        _pending: true,
        _source: "global"
      }
    ]);
    setCategoriaSeleccionadaId("");
    setError("");
  };

  const agregarManual = () => {
    const nombre = manual.nombre.trim();
    if (!nombre) {
      setError("Escribe el nombre de la categoria.");
      return;
    }

    const categoriaManual = {
      nombre,
      descripcion: manual.descripcion.trim(),
      activo: true
    };

    if (existeCategoriaEnLista(categoriaManual, [...categoriasActuales, ...seleccionadas])) {
      setError("Esa categoria ya existe o ya fue agregada.");
      return;
    }

    const ref = crearRefBorrador("categoria");
    setSeleccionadas((prev) => [
      ...prev,
      {
        ...categoriaManual,
        id: ref,
        ref,
        _pending: true,
        _source: "manual"
      }
    ]);
    setManual({ nombre: "", descripcion: "" });
    setError("");
  };

  const moverSeleccionada = (index, direccion) => {
    const destino = index + direccion;
    if (destino < 0 || destino >= seleccionadas.length) return;
    setSeleccionadas((prev) => {
      const siguiente = [...prev];
      const [movida] = siguiente.splice(index, 1);
      siguiente.splice(destino, 0, movida);
      return siguiente;
    });
  };

  const quitarSeleccionada = (index) => {
    setSeleccionadas((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const guardar = () => {
    if (seleccionadas.length === 0) {
      setError("Agrega al menos una categoria.");
      return;
    }

    onSave(
      seleccionadas.map((categoria, index) => ({
        ...categoria,
        codigo: formatoCodigoCategoria(codigoBase + index + 1)
      }))
    );
  };

  return (
    <div
      className="modal fade show modelos-modal-popout wizard-draft-modal"
      style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.42)", zIndex: 1080 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-folder-plus me-2"></i>
              Agregar categorias al modelo
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="alert alert-info py-2">
              Las categorias existentes conservan su codigo. Las nuevas se ordenan despues de {formatoCodigoCategoria(codigoBase || 0)} para cuidar los SKUs.
            </div>

            {categoriasFijas.length > 0 && (
              <div className="border rounded p-3 mb-3 bg-light">
                <div className="fw-semibold mb-2">Categorias ya creadas, no se reordenan</div>
                <div className="d-flex flex-wrap gap-2">
                  {categoriasFijas.map((categoria) => (
                    <span key={categoria.id || categoria.ref} className="badge rounded-pill text-bg-secondary">
                      [{categoria.codigo || "--"}] {categoria.nombre || "-"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="row g-3">
              <div className="col-lg-6">
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold mb-2">Seleccionar del catalogo global</div>
                  <SearchableSelect
                    label=""
                    value={categoriaSeleccionadaId}
                    options={categoriasDisponibles}
                    onChange={agregarCategoriaGlobal}
                    placeholder="Buscar categoria existente..."
                    searchPlaceholder="Busca por nombre o descripcion..."
                    emptyText="No hay categorias disponibles"
                    getOptionValue={(item) => item.id}
                    getOptionLabel={(item) => `${item.nombre || "-"}${item.descripcion ? ` - ${item.descripcion}` : ""}`}
                    getOptionSearchText={(item) => [item.nombre, item.descripcion].filter(Boolean).join(" ").toLowerCase()}
                    renderOptionLabel={(item) => `${item.nombre || "-"}${item.descripcion ? ` - ${item.descripcion}` : ""}`}
                    helperText="Puedes seleccionar varias, una por una, antes de guardar."
                  />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold mb-2">Crear categoria nueva</div>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <input
                        className="form-control"
                        value={manual.nombre}
                        onChange={(event) => setManual((prev) => ({ ...prev, nombre: event.target.value }))}
                        placeholder="Ej. Universidad"
                      />
                    </div>
                    <div className="col-md-5">
                      <input
                        className="form-control"
                        value={manual.descripcion}
                        onChange={(event) => setManual((prev) => ({ ...prev, descripcion: event.target.value }))}
                        placeholder="Descripcion opcional"
                      />
                    </div>
                    <div className="col-md-2 d-grid">
                      <button type="button" className="btn btn-outline-primary" onClick={agregarManual}>
                        Agregar
                      </button>
                    </div>
                  </div>
                  <div className="form-text">Si no existe en el catalogo global, se creara al guardar el producto.</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="fw-semibold mb-2">Nuevas categorias y orden</div>
              {seleccionadas.length === 0 ? (
                <div className="text-muted border rounded p-3">Aun no agregas categorias nuevas.</div>
              ) : (
                <div className="list-group">
                  {seleccionadas.map((categoria, index) => (
                    <div key={categoria.ref || categoria.id} className="list-group-item d-flex align-items-center gap-2">
                      <span className="badge text-bg-primary">{formatoCodigoCategoria(codigoBase + index + 1)}</span>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{categoria.nombre}</div>
                        <small className="text-muted">
                          {categoria._source === "global" ? "Del catalogo global" : "Nueva categoria global"}
                          {categoria.descripcion ? ` - ${categoria.descripcion}` : ""}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => moverSeleccionada(index, -1)}
                        disabled={index === 0}
                        title="Subir"
                      >
                        <i className="bi bi-arrow-up"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => moverSeleccionada(index, 1)}
                        disabled={index === seleccionadas.length - 1}
                        title="Bajar"
                      >
                        <i className="bi bi-arrow-down"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => quitarSeleccionada(index)}
                        title="Quitar"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-warning py-2 mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <span className="badge text-bg-warning me-auto">Pendiente hasta guardar el producto</span>
            <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={guardar} disabled={seleccionadas.length === 0}>
              Agregar categorias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SECCION_BORRADOR_POR_TIPO = {
  material: "materiales",
  color: "colores"
};

export default function VariantesStep({
  data,
  onUpdate,
  borradores,
  onUpsertDraft,
  productosExistentes = [],
  cargandoProductosExistentes = false,
  errorProductosExistentes = ""
}) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasGlobales, setCategoriasGlobales] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [familiaActual, setFamiliaActual] = useState(null);
  const [lineaActual, setLineaActual] = useState(null);
  const [seleccion, setSeleccion] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [modalBorrador, setModalBorrador] = useState("");
  const [modalCategorias, setModalCategorias] = useState(false);
  const [borradorEditando, setBorradorEditando] = useState(null);

  const variantes = useMemo(
    () => (Array.isArray(data.variantes) ? data.variantes : []),
    [data.variantes]
  );

  const categoriasDisponibles = useMemo(() => {
    if (data?.modelo?.modo === "nuevo") {
      return [...(data?.modelo?.categorias || [])].sort(ordenarPorCodigoCategoria);
    }
    return [
      ...(borradores?.categorias || []).filter((item) => String(item.modeloId) === String(data?.modelo?.id)),
      ...categorias
    ].sort(ordenarPorCodigoCategoria);
  }, [borradores?.categorias, categorias, data?.modelo?.categorias, data?.modelo?.id, data?.modelo?.modo]);

  const materialesDisponibles = useMemo(
    () => {
      const materialesDelModelo = getMaterialesDelModelo(data?.modelo);
      const base = materialesDelModelo.length > 0 ? materialesDelModelo : materiales;
      const combinados = [...(borradores?.materiales || []), ...base];
      const vistos = new Set();

      return combinados.filter((item) => {
        const key = String(item?.id || item?.materialId || item?.ref || "");
        if (!key || vistos.has(key)) return false;
        vistos.add(key);
        return true;
      });
    },
    [borradores?.materiales, data?.modelo, materiales]
  );

  const coloresDisponibles = useMemo(
    () => [...(borradores?.colores || []), ...colores],
    [borradores?.colores, colores]
  );

  const pendientes = useMemo(() => ({
    categorias: categoriasDisponibles.filter((item) => item?._pending),
    materiales: materialesDisponibles.filter((item) => item?._pending),
    colores: coloresDisponibles.filter((item) => item?._pending)
  }), [categoriasDisponibles, coloresDisponibles, materialesDisponibles]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const categoriasPromise = data?.modelo?.modo === "nuevo"
          ? Promise.resolve(Array.isArray(data?.modelo?.categorias) ? data.modelo.categorias : [])
          : obtenerNiveles(data?.modelo?.id).then(getLista);
        const [categoriasLista, categoriasGlobalesLista, materialesLista, coloresLista] = await Promise.all([
          categoriasPromise,
          obtenerCategoriasGlobalesActivas().then(getLista),
          obtenerMaterialesActivos().then(getLista),
          obtenerColores().then(getLista)
        ]);
        setCategorias(categoriasLista);
        setCategoriasGlobales(categoriasGlobalesLista);
        setMateriales(materialesLista);
        setColores(coloresLista);
      } catch (error) {
        console.error("Error cargando catalogos de productos:", error);
      } finally {
        setCargandoCatalogos(false);
      }
    };

    cargarCatalogos();
  }, [data?.modelo?.id, data?.modelo?.modo, data?.modelo?.categorias]);

  useEffect(() => {
    const cargarContextoSku = async () => {
      if (data?.modelo?._pending) {
        setFamiliaActual(data.modelo.familia || null);
        setLineaActual(data.modelo.linea || null);
        return;
      }
      const familiaId = Number(data?.modelo?.familiaId);

      if (!familiaId) {
        setFamiliaActual(null);
        setLineaActual(null);
        return;
      }

      try {
        const familia = await obtenerFamiliaPorId(familiaId);
        setFamiliaActual(familia || null);

        const lineaId = familia?.lineaId || familia?.linea?.id;
        const linea = lineaId ? await obtenerLineaProductoPorId(lineaId) : null;
        setLineaActual(linea || null);
      } catch (error) {
        console.error("Error cargando contexto de SKU:", error);
        setFamiliaActual(null);
        setLineaActual(null);
      }
    };

    cargarContextoSku();
  }, [data?.modelo?._pending, data?.modelo?.familia, data?.modelo?.familiaId, data?.modelo?.linea]);

  useEffect(() => {
    if (cargandoCatalogos || variantes.length === 0) return;

    const siguienteSeleccion = {};
    variantes.forEach((variante) => {
      if (!variante?.materialId || !variante?.categoriaId || !variante?.colorId) return;

      const materialKey = getMaterialKey(variante.materialId);
      const categoriaKey = getCategoriaKey(variante.categoriaId);
      const colorKey = getColorKey(variante.colorId);

      if (!siguienteSeleccion[materialKey]) {
        siguienteSeleccion[materialKey] = { categorias: {} };
      }

      if (!siguienteSeleccion[materialKey].categorias[categoriaKey]) {
        siguienteSeleccion[materialKey].categorias[categoriaKey] = [];
      }

      if (!siguienteSeleccion[materialKey].categorias[categoriaKey].includes(colorKey)) {
        siguienteSeleccion[materialKey].categorias[categoriaKey].push(colorKey);
      }
    });

    setSeleccion(siguienteSeleccion);
  }, [cargandoCatalogos, variantes]);

  useEffect(() => {
    if (cargandoCatalogos || variantes.length > 0) return;

    const materialesDelModelo = getMaterialesDelModelo(data?.modelo);
    if (materialesDelModelo.length === 0) return;

    const siguienteSeleccion = {};
    materialesDelModelo.forEach((material) => {
      const key = getMaterialKey(material.id);
      siguienteSeleccion[key] = { categorias: {} };
    });

    setSeleccion(siguienteSeleccion);
  }, [cargandoCatalogos, data?.modelo, variantes.length]);

  const categoriasPorId = useMemo(
    () => new Map(categoriasDisponibles.map((categoria) => [String(categoria.id), categoria])),
    [categoriasDisponibles]
  );

  const materialesPorId = useMemo(
    () => new Map(materialesDisponibles.map((material) => [String(material.id), material])),
    [materialesDisponibles]
  );

  const coloresPorId = useMemo(
    () => new Map(coloresDisponibles.map((color) => [String(color.id), color])),
    [coloresDisponibles]
  );

  const variantesPorPar = useMemo(() => {
    const mapa = new Map();
    variantes.forEach((variante) => {
      if (variante?.categoriaId && variante?.materialId && variante?.colorId) {
        mapa.set(getParKey(variante.categoriaId, variante.materialId, variante.colorId), variante);
      }
    });
    return mapa;
  }, [variantes]);

  const variantesExistentesPorPar = useMemo(() => {
    const set = new Set();
    variantes.forEach((variante) => {
      if (variante?._existing && variante?.categoriaId && variante?.materialId && variante?.colorId) {
        set.add(getParKey(variante.categoriaId, variante.materialId, variante.colorId));
      }
    });
    productosExistentes.forEach((producto) => {
      const categoriaId = getCategoriaProducto(producto);
      const materialId = getMaterialProducto(producto);
      const colorId = getColorProducto(producto);
      if (categoriaId && materialId && colorId) {
        set.add(getParKey(categoriaId, materialId, colorId));
      }
    });
    return set;
  }, [productosExistentes, variantes]);

  const productosExistentesPorPar = useMemo(() => {
    const mapa = new Map();
    productosExistentes.forEach((producto) => {
      const categoriaId = getCategoriaProducto(producto);
      const materialId = getMaterialProducto(producto);
      const colorId = getColorProducto(producto);
      if (categoriaId && materialId && colorId) {
        mapa.set(getParKey(categoriaId, materialId, colorId), producto);
      }
    });
    return mapa;
  }, [productosExistentes]);

  const skusExistentes = useMemo(
    () => new Set(productosExistentes.map((producto) => producto?.sku?.toString().trim().toUpperCase()).filter(Boolean)),
    [productosExistentes]
  );

  const totalSeleccionado = useMemo(() => {
    return Object.values(seleccion).reduce((totalMateriales, materialSeleccionado) => {
      const categoriasSeleccionadas = materialSeleccionado?.categorias || {};
      return totalMateriales + Object.values(categoriasSeleccionadas).reduce(
        (totalCategorias, colorIds) => totalCategorias + (Array.isArray(colorIds) ? colorIds.length : 0),
        0
      );
    }, 0);
  }, [seleccion]);

  const toggleMaterial = (materialId) => {
    const materialKey = getMaterialKey(materialId);
    const tieneVariantesExistentes = Array.from(variantesExistentesPorPar).some((parKey) =>
      parKey.split("::")[1] === materialKey
    );

    if (tieneVariantesExistentes && seleccion[materialKey]) {
      setMensaje("Este material tiene variantes ya creadas y no se puede desmarcar desde el wizard.");
      return;
    }

    setSeleccion((prev) => {
      const siguiente = { ...prev };
      if (siguiente[materialKey]) {
        delete siguiente[materialKey];
      } else {
        siguiente[materialKey] = { categorias: {} };
      }
      return siguiente;
    });
    setMensaje("");
  };

  const toggleCategoria = (materialId, categoriaId) => {
    const materialKey = getMaterialKey(materialId);
    const categoriaKey = getCategoriaKey(categoriaId);
    const tieneVariantesExistentes = Array.from(variantesExistentesPorPar).some((parKey) => {
      const [categoriaExistente, materialExistente] = parKey.split("::");
      return categoriaExistente === categoriaKey && materialExistente === materialKey;
    });

    setSeleccion((prev) => {
      const materialActual = prev[materialKey] || { categorias: {} };
      const categoriasActuales = { ...materialActual.categorias };

      if (categoriasActuales[categoriaKey]) {
        if (tieneVariantesExistentes) {
          return prev;
        }
        delete categoriasActuales[categoriaKey];
      } else {
        categoriasActuales[categoriaKey] = [];
      }

      return {
        ...prev,
        [materialKey]: { categorias: categoriasActuales }
      };
    });
    setMensaje(tieneVariantesExistentes ? "Esta categoria tiene variantes ya creadas y no se puede desmarcar desde el wizard." : "");
  };

  const toggleColor = (materialId, categoriaId, colorId) => {
    const materialKey = getMaterialKey(materialId);
    const categoriaKey = getCategoriaKey(categoriaId);
    const colorKey = getColorKey(colorId);
    const parKey = getParKey(categoriaId, materialId, colorId);

    if (variantesExistentesPorPar.has(parKey)) {
      setMensaje("Esta combinacion ya existe y no se puede volver a crear.");
      return;
    }

    setSeleccion((prev) => {
      const materialActual = prev[materialKey] || { categorias: {} };
      const categoriasActuales = { ...materialActual.categorias };
      const coloresActuales = categoriasActuales[categoriaKey] || [];
      const siguientesColores = coloresActuales.includes(colorKey)
        ? coloresActuales.filter((item) => item !== colorKey)
        : [...coloresActuales, colorKey];

      return {
        ...prev,
        [materialKey]: {
          categorias: {
            ...categoriasActuales,
            [categoriaKey]: siguientesColores
          }
        }
      };
    });
    setMensaje("");
  };

  const seleccionarTodosLosColores = (materialId, categoriaId) => {
    const materialKey = getMaterialKey(materialId);
    const categoriaKey = getCategoriaKey(categoriaId);
    const todos = coloresDisponibles.map((color) => getColorKey(color.id));

    setSeleccion((prev) => {
      const materialActual = prev[materialKey] || { categorias: {} };
      return {
        ...prev,
        [materialKey]: {
          categorias: {
            ...materialActual.categorias,
            [categoriaKey]: todos
          }
        }
      };
    });
    setMensaje("");
  };

  const limpiarColoresCategoria = (materialId, categoriaId) => {
    const materialKey = getMaterialKey(materialId);
    const categoriaKey = getCategoriaKey(categoriaId);

    setSeleccion((prev) => {
      const materialActual = prev[materialKey] || { categorias: {} };
      const coloresExistentes = (materialActual.categorias?.[categoriaKey] || []).filter((colorKey) =>
        variantesExistentesPorPar.has(getParKey(categoriaId, materialId, colorKey))
      );
      return {
        ...prev,
        [materialKey]: {
          categorias: {
            ...materialActual.categorias,
            [categoriaKey]: coloresExistentes
          }
        }
      };
    });
    setMensaje("");
  };

  const generarVariantes = () => {
    const nuevas = [];
    const paresGenerados = new Set();
    let omitidas = 0;
    let existentes = 0;

    Object.entries(seleccion).forEach(([materialKey, materialSeleccionado]) => {
      const material = materialesPorId.get(materialKey);
      if (!material) return;

      Object.entries(materialSeleccionado?.categorias || {}).forEach(([categoriaKey, colorIds]) => {
        const categoria = categoriasPorId.get(categoriaKey);
        if (!categoria || !Array.isArray(colorIds) || colorIds.length === 0) return;

        colorIds.forEach((colorKey) => {
          const color = coloresPorId.get(colorKey);
          if (!color) return;

          const parKey = getParKey(categoria.id, material.id, color.id);
          const existente = variantesPorPar.get(parKey);
          const idVariante = existente?._existing
            ? existente.id
            : getVarianteDraftId(categoria.id, material.id, color.id);
          const sku = construirSku({
            linea: lineaActual,
            familia: familiaActual,
            modelo: data?.modelo,
            categoria,
            material,
            color
          }).toUpperCase();

          if (paresGenerados.has(parKey)) {
            omitidas += 1;
            return;
          }

          if (!existente && (productosExistentesPorPar.has(parKey) || skusExistentes.has(sku))) {
            existentes += 1;
            return;
          }

          nuevas.push({
            id: idVariante,
            productoId: existente?.productoId,
            _existing: Boolean(existente?._existing),
            categoriaId: categoria.id,
            categoriaNombre: categoria.nombre || "",
            categoriaCodigo: categoria.codigo || "",
            materialId: material.id,
            materialNombre: material.nombre || "",
            materialCodigo: material.codigo || "",
            colorId: color.id,
            colorNombre: color.nombre || "",
            colorCodigo: color.codigo || "",
            colorHex: color.hex || "",
            sku,
            descripcionCorta: existente?.descripcionCorta || data?.modelo?.descripcionCorta || "",
            pesoVolumetrico: existente?.pesoVolumetrico ?? "",
            ancho: existente?.ancho ?? "",
            alto: existente?.alto ?? "",
            fondo: existente?.fondo ?? "",
            pesoKg: existente?.pesoKg ?? ""
          });
          paresGenerados.add(parKey);
        });
      });
    });

    onUpdate("variantes", nuevas);
    const imagenesActuales = getImagenesPorVariante(data.imagenes);
    const siguienteImagenes = {};
    const idsRemapeados = new Map();

    nuevas.forEach((variante) => {
      const parKey = getParKey(variante.categoriaId, variante.materialId, variante.colorId);
      const varianteAnterior = variantesPorPar.get(parKey);
      const idActual = String(variante.id);
      const idAnterior = String(varianteAnterior?.id || "");
      idsRemapeados.set(idActual, idActual);
      if (idAnterior) idsRemapeados.set(idAnterior, idActual);

      const lista =
        (Array.isArray(imagenesActuales[idActual]) && imagenesActuales[idActual])
        || (idAnterior && Array.isArray(imagenesActuales[idAnterior]) ? imagenesActuales[idAnterior] : []);

      if (lista.length > 0) {
        siguienteImagenes[idActual] = lista.map((imagen) => ({
          ...imagen,
          varianteId: variante.id,
          materialId: variante.materialId,
          materialNombre: variante.materialNombre,
          colorId: variante.colorId,
          colorNombre: variante.colorNombre
        }));
      }
    });

    const imagenModeloActual = getImagenModelo(data.imagenes);
    let siguienteImagenModelo = imagenModeloActual;
    if (imagenModeloActual?.origen === "variante") {
      const siguienteVarianteId = idsRemapeados.get(String(imagenModeloActual.varianteId));
      const imagenSigueDisponible = siguienteVarianteId
        && Array.isArray(siguienteImagenes[siguienteVarianteId])
        && siguienteImagenes[siguienteVarianteId].some((imagen) => String(imagen.id) === String(imagenModeloActual.imagenId));

      if (imagenSigueDisponible) {
        siguienteImagenModelo = {
          ...imagenModeloActual,
          varianteId: siguienteVarianteId
        };
      } else {
        const reemplazo = primeraImagenDisponible(siguienteImagenes);
        siguienteImagenModelo = reemplazo
          ? {
              id: `m-${reemplazo.id}`,
              nombre: reemplazo.nombre,
              url: reemplazo.url,
              origen: "variante",
              varianteId: reemplazo.varianteId,
              imagenId: reemplazo.id
            }
          : null;
      }
    }

    onUpdate("imagenes", {
      modelo: siguienteImagenModelo,
      variantes: siguienteImagenes
    });
    const partes = [`${nuevas.length} productos nuevos listos`];
    if (existentes) partes.push(`${existentes} ya existian y no se enviaran`);
    if (omitidas) partes.push(`${omitidas} duplicados omitidos`);
    setMensaje(`${partes.join(", ")}.`);
  };

  const eliminarVariante = (index) => {
    const variante = variantes[index];
    if (variante?._existing) {
      setMensaje("Esta variante ya existe. No se quitara del modelo desde este wizard.");
      return;
    }

    if (variante?.materialId && variante?.categoriaId && variante?.colorId) {
      const materialKey = getMaterialKey(variante.materialId);
      const categoriaKey = getCategoriaKey(variante.categoriaId);
      const colorKey = getColorKey(variante.colorId);

      setSeleccion((prev) => {
        const materialActual = prev[materialKey];
        if (!materialActual) return prev;

        const coloresActuales = materialActual.categorias?.[categoriaKey] || [];
        return {
          ...prev,
          [materialKey]: {
            categorias: {
              ...materialActual.categorias,
              [categoriaKey]: coloresActuales.filter((item) => item !== colorKey)
            }
          }
        };
      });
    }

    onUpdate("variantes", variantes.filter((_, i) => i !== index));
    setMensaje("");
  };

  const actualizarVariante = (index, campo, valor) => {
    onUpdate(
      "variantes",
      variantes.map((variante, i) =>
        i === index
          ? {
              ...variante,
              [campo]: valor
            }
          : variante
        )
    );
  };

  const actualizarVarianteCampo = actualizarVariante;

  const limpiarVariantes = () => {
    if (!window.confirm("Eliminar todos los productos nuevos generados?")) return;
    const variantesExistentes = variantes.filter((variante) => variante?._existing);
    setSeleccion({});
    onUpdate("variantes", variantesExistentes);
    setMensaje(variantesExistentes.length ? "Productos nuevos limpiados. Se conservan las variantes existentes." : "Productos limpiados.");
  };

  const guardarBorradorRapido = (tipo, borrador) => {
    const borradorKey = String(borrador.ref || borrador.id);

    if (tipo === "categoria" && data?.modelo?.modo === "nuevo") {
      onUpdate("modelo", {
        categorias: [
          borrador,
          ...(data?.modelo?.categorias || []).filter(
            (item) => String(item.ref || item.id) !== String(borrador.ref || borrador.id)
          )
        ].sort(ordenarPorCodigoCategoria)
      });
    } else if (tipo === "categoria") {
      onUpsertDraft("categorias", { ...borrador, modeloId: Number(data?.modelo?.id) });
    } else {
      onUpsertDraft(SECCION_BORRADOR_POR_TIPO[tipo], borrador);
    }

    if (!borradorEditando && tipo === "material") {
      setSeleccion((prev) => ({
        ...prev,
        [borradorKey]: prev[borradorKey] || { categorias: {} }
      }));
      setMensaje("Material pendiente creado y activado.");
    } else if (!borradorEditando && tipo === "categoria") {
      setSeleccion((prev) => {
        const siguiente = {};
        Object.entries(prev).forEach(([materialKey, materialSeleccionado]) => {
          siguiente[materialKey] = {
            categorias: {
              ...(materialSeleccionado?.categorias || {}),
              [borradorKey]: materialSeleccionado?.categorias?.[borradorKey] || []
            }
          };
        });
        return siguiente;
      });
      setMensaje(
        Object.keys(seleccion).length
          ? "Categoria pendiente agregada a los materiales activos."
          : "Categoria pendiente creada. Activa un material para asignarla."
      );
    } else if (!borradorEditando && tipo === "color") {
      setSeleccion((prev) => {
        const siguiente = {};
        Object.entries(prev).forEach(([materialKey, materialSeleccionado]) => {
          const categoriasSiguientes = {};
          Object.entries(materialSeleccionado?.categorias || {}).forEach(([categoriaKey, colorIds]) => {
            categoriasSiguientes[categoriaKey] = colorIds.includes(borradorKey)
              ? colorIds
              : [...colorIds, borradorKey];
          });
          siguiente[materialKey] = { categorias: categoriasSiguientes };
        });
        return siguiente;
      });
      setMensaje(
        totalSeleccionado || Object.keys(seleccion).length
          ? "Color pendiente agregado a las categorias activas."
          : "Color pendiente creado. Activa un material y una categoria para asignarlo."
      );
    }

    if (borradorEditando) {
      onUpdate("variantes", []);
      onUpdate("imagenes", { variantes: {} });
      setMensaje("Borrador actualizado. Vuelve a generar los productos.");
    }
    setModalBorrador("");
    setBorradorEditando(null);
  };

  const guardarCategoriasBatch = (categoriasNuevas) => {
    if (!Array.isArray(categoriasNuevas) || categoriasNuevas.length === 0) return;

    if (data?.modelo?.modo === "nuevo") {
      const refsNuevas = new Set(categoriasNuevas.map((categoria) => String(categoria.ref || categoria.id)));
      onUpdate("modelo", {
        categorias: [
          ...(data?.modelo?.categorias || []).filter(
            (item) => !refsNuevas.has(String(item.ref || item.id))
          ),
          ...categoriasNuevas
        ].sort(ordenarPorCodigoCategoria)
      });
    } else {
      categoriasNuevas.forEach((categoria) => {
        onUpsertDraft("categorias", {
          ...categoria,
          modeloId: Number(data?.modelo?.id)
        });
      });
    }

    setSeleccion((prev) => {
      const siguiente = {};
      Object.entries(prev).forEach(([materialKey, materialSeleccionado]) => {
        siguiente[materialKey] = {
          categorias: {
            ...(materialSeleccionado?.categorias || {})
          }
        };

        categoriasNuevas.forEach((categoria) => {
          const categoriaKey = String(categoria.ref || categoria.id);
          siguiente[materialKey].categorias[categoriaKey] =
            siguiente[materialKey].categorias[categoriaKey] || [];
        });
      });
      return siguiente;
    });

    setModalCategorias(false);
    setMensaje(
      Object.keys(seleccion).length
        ? "Categorias agregadas a los materiales activos. Asigna colores y genera los productos."
        : "Categorias agregadas. Activa un material para asignar colores."
    );
  };

  const abrirBorrador = (tipo, borrador = null) => {
    setBorradorEditando(borrador);
    setModalBorrador(tipo);
  };

  const variantesPorMaterial = useMemo(() => {
    const mapa = new Map();
    variantes.forEach((variante) => {
      const key = String(variante.materialId || "sin-material");
      if (!mapa.has(key)) {
        mapa.set(key, {
          id: key,
          nombre: variante.materialNombre || "Sin material",
          codigo: variante.materialCodigo || "",
          variantes: []
        });
      }
      mapa.get(key).variantes.push(variante);
    });
    return Array.from(mapa.values());
  }, [variantes]);

  if (cargandoCatalogos) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mb-0 mt-2">Cargando categorias, materiales y colores...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-diagram-3 me-2 text-primary"></i>
        Materiales, categorias y colores
      </h4>

      <div className="alert alert-info py-2">
        Marca los materiales disponibles. Dentro de cada material elige las categorias y los colores que existen para esa categoria.
      </div>

      {data?.modelo?.modo === "existente" && (
        <div className={`alert py-2 ${errorProductosExistentes ? "alert-warning" : "alert-secondary"}`}>
          {cargandoProductosExistentes ? (
            "Revisando productos ya creados para este modelo..."
          ) : errorProductosExistentes ? (
            errorProductosExistentes
          ) : (
            `${productosExistentes.length} productos existentes detectados para este modelo. Las combinaciones repetidas se omiten al generar.`
          )}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => abrirBorrador("material")}>
          + Material
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setModalCategorias(true)}>
          + Categoria
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => abrirBorrador("color")}>
          + Color
        </button>
      </div>

      {(pendientes.materiales.length > 0 || pendientes.categorias.length > 0 || pendientes.colores.length > 0) && (
        <div className="border rounded bg-light p-3 mb-3">
          <div className="small fw-semibold mb-2">Borradores pendientes de guardar</div>
          <div className="d-flex flex-wrap gap-2">
            {pendientes.materiales.map((item) => (
              <button key={item.id} type="button" className="btn btn-sm btn-outline-warning" onClick={() => abrirBorrador("material", item)}>
                Material: [{item.codigo}] {item.nombre} <i className="bi bi-pencil ms-1"></i>
              </button>
            ))}
            {pendientes.categorias.map((item) => (
              <button key={item.id} type="button" className="btn btn-sm btn-outline-warning" onClick={() => abrirBorrador("categoria", item)}>
                Categoria: [{item.codigo}] {item.nombre} <i className="bi bi-pencil ms-1"></i>
              </button>
            ))}
            {pendientes.colores.map((item) => (
              <button key={item.id} type="button" className="btn btn-sm btn-outline-warning" onClick={() => abrirBorrador("color", item)}>
                Color: [{item.codigo}] {item.nombre} <i className="bi bi-pencil ms-1"></i>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="accordion mb-4" id="accordion-materiales-producto">
        {materialesDisponibles.map((material) => {
          const materialKey = getMaterialKey(material.id);
          const materialActivo = Boolean(seleccion[materialKey]);
          const materialTieneExistentes = Array.from(variantesExistentesPorPar).some((parKey) =>
            parKey.split("::")[1] === materialKey
          );
          const categoriasSeleccionadas = seleccion[materialKey]?.categorias || {};
          const totalMaterial = Object.values(categoriasSeleccionadas).reduce(
            (total, colorIds) => total + (Array.isArray(colorIds) ? colorIds.length : 0),
            0
          );

          return (
            <div className="accordion-item" key={material.id}>
              <h2 className="accordion-header d-flex align-items-stretch">
                <button
                  className={`accordion-button ${materialActivo ? "" : "collapsed"}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#material-${material.id}`}
                  aria-expanded={materialActivo}
                  aria-controls={`material-${material.id}`}
                >
                  <span className="form-check me-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={materialActivo}
                      onChange={() => toggleMaterial(material.id)}
                      disabled={materialTieneExistentes}
                      id={`material-check-${material.id}`}
                    />
                  </span>
                  <span className="fw-semibold">
                    {material.codigo ? `[${material.codigo}] ` : ""}
                    {material.nombre}
                  </span>
                  {material._pending && <span className="badge text-bg-warning ms-3">Pendiente</span>}
                  {totalMaterial > 0 && <span className="badge bg-primary ms-3">{totalMaterial} productos</span>}
                </button>
                {material._pending && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-0"
                    onClick={() => abrirBorrador("material", material)}
                    title="Editar material pendiente"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                )}
              </h2>

              <div
                id={`material-${material.id}`}
                className={`accordion-collapse collapse ${materialActivo ? "show" : ""}`}
                data-bs-parent="#accordion-materiales-producto"
              >
                <div className="accordion-body">
                  {!materialActivo ? (
                    <div className="text-muted">Activa este material para asignar categorias y colores.</div>
                  ) : (
                    <div className="row g-3">
                      {categoriasDisponibles.map((categoria) => {
                        const categoriaKey = getCategoriaKey(categoria.id);
                        const categoriaActiva = Object.prototype.hasOwnProperty.call(categoriasSeleccionadas, categoriaKey);
                        const categoriaTieneExistentes = Array.from(variantesExistentesPorPar).some((parKey) => {
                          const [categoriaExistente, materialExistente] = parKey.split("::");
                          return categoriaExistente === categoriaKey && materialExistente === materialKey;
                        });
                        const coloresCategoria = categoriasSeleccionadas[categoriaKey] || [];

                        return (
                          <div className="col-12" key={categoria.id}>
                            <div className="border rounded p-3">
                              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={categoriaActiva}
                                      onChange={() => toggleCategoria(material.id, categoria.id)}
                                      disabled={categoriaTieneExistentes}
                                      id={`categoria-${material.id}-${categoria.id}`}
                                    />
                                    <label className="form-check-label fw-semibold" htmlFor={`categoria-${material.id}-${categoria.id}`}>
                                      {categoria.codigo ? `[${categoria.codigo}] ` : ""}
                                      {categoria.nombre}
                                    </label>
                                  </div>
                                  {categoria._pending && (
                                    <>
                                      <span className="badge text-bg-warning">Pendiente</span>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => abrirBorrador("categoria", categoria)}
                                        title="Editar categoria pendiente"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    </>
                                  )}
                                </div>

                                {categoriaActiva && (
                                  <div className="d-flex gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => seleccionarTodosLosColores(material.id, categoria.id)}
                                    >
                                      Todos
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => limpiarColoresCategoria(material.id, categoria.id)}
                                    >
                                      Limpiar
                                    </button>
                                  </div>
                                )}
                              </div>

                              {categoriaActiva && (
                                <div className="d-flex flex-wrap gap-2">
                                  {coloresDisponibles.map((color) => {
                                    const selected = coloresCategoria.includes(getColorKey(color.id));
                                    const existeVariante = variantesExistentesPorPar.has(getParKey(categoria.id, material.id, color.id));
                                    return (
                                      <div key={color.id} className="d-inline-flex">
                                        <button
                                          type="button"
                                          className={`btn btn-sm ${selected ? "btn-success" : "btn-outline-success"} ${color._pending ? "rounded-end-0" : ""}`}
                                          onClick={() => toggleColor(material.id, categoria.id, color.id)}
                                          disabled={existeVariante}
                                          title={existeVariante ? "Variante ya creada" : undefined}
                                        >
                                          <span
                                            className="d-inline-block rounded-circle border me-1"
                                            style={{ width: "12px", height: "12px", backgroundColor: color.hex || "#ccc" }}
                                          />
                                          {color.codigo ? `[${color.codigo}] ` : ""}
                                          {color.nombre}
                                          {existeVariante ? " (Creado)" : ""}
                                          {color._pending ? " (Pendiente)" : ""}
                                        </button>
                                        {color._pending && (
                                          <button
                                            type="button"
                                            className={`btn btn-sm ${selected ? "btn-success" : "btn-outline-success"} rounded-start-0 border-start`}
                                            onClick={() => abrirBorrador("color", color)}
                                            title="Editar color pendiente"
                                          >
                                            <i className="bi bi-pencil"></i>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <button type="button" className="btn btn-primary" onClick={generarVariantes} disabled={totalSeleccionado === 0}>
          Generar productos seleccionados
        </button>
        {variantes.length > 0 && (
          <button type="button" className="btn btn-outline-danger" onClick={limpiarVariantes}>
            Limpiar todo
          </button>
        )}
        <span className="text-muted">
          {totalSeleccionado} combinaciones marcadas
          {mensaje ? ` - ${mensaje}` : ""}
        </span>
      </div>

      {variantesPorMaterial.length > 0 ? (
        variantesPorMaterial.map((grupo) => (
          <div key={grupo.id} className="card mb-3">
            <div className="card-header">
              <strong>
                {grupo.codigo ? `[${grupo.codigo}] ` : ""}
                {grupo.nombre}
              </strong>
            </div>
            <div className="table-responsive producto-variantes-editable-wrap">
              <table className="table table-sm table-hover align-middle mb-0 producto-variantes-editable-table">
                <thead className="table-light">
                  <tr>
                    <th>Categoria</th>
                    <th>Color</th>
                    <th>Peso (kg)</th>
                    <th>Descripcion corta</th>
                    <th>Peso volumetrico</th>
                    <th>Ancho</th>
                    <th>Alto</th>
                    <th>Fondo</th>
                    <th>SKU</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.variantes.map((variante) => {
                    const indexReal = variantes.findIndex((item) => item.id === variante.id);
                    return (
                      <tr key={variante.id}>
                        <td>
                          {variante.categoriaCodigo ? `[${variante.categoriaCodigo}] ` : ""}
                          {variante.categoriaNombre || "Sin categoria"}
                        </td>
                        <td>
                          <span
                            className="d-inline-block rounded-circle border me-2"
                            style={{ width: "14px", height: "14px", backgroundColor: variante.colorHex || "#ccc" }}
                          />
                          {variante.colorCodigo ? `[${variante.colorCodigo}] ` : ""}
                          {variante.colorNombre || "Sin color"}
                        </td>
                        <td style={{ minWidth: "130px" }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm text-end"
                            value={variante.pesoKg ?? ""}
                            disabled={variante._existing}
                            onChange={(e) =>
                              actualizarVarianteCampo(
                                indexReal,
                                "pesoKg",
                                (() => {
                                  if (e.target.value === "") return "";
                                  const parsed = Number(e.target.value);
                                  return Number.isFinite(parsed) ? parsed : "";
                                })()
                              )
                            }
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={variante.descripcionCorta || ""}
                            disabled={variante._existing}
                            onChange={(event) => actualizarVariante(indexReal, "descripcionCorta", event.target.value)}
                            placeholder="Descripcion breve"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            step="0.01"
                            value={variante.pesoVolumetrico ?? ""}
                            disabled={variante._existing}
                            onChange={(event) => actualizarVariante(indexReal, "pesoVolumetrico", event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            step="0.01"
                            value={variante.ancho ?? ""}
                            disabled={variante._existing}
                            onChange={(event) => actualizarVariante(indexReal, "ancho", event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            step="0.01"
                            value={variante.alto ?? ""}
                            disabled={variante._existing}
                            onChange={(event) => actualizarVariante(indexReal, "alto", event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            step="0.01"
                            value={variante.fondo ?? ""}
                            disabled={variante._existing}
                            onChange={(event) => actualizarVariante(indexReal, "fondo", event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <code>{variante.sku || "-"}</code>
                          {variante._existing && <span className="badge text-bg-secondary ms-2">Creado</span>}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarVariante(indexReal)}
                            disabled={variante._existing}
                            title={variante._existing ? "Variante ya creada" : "Eliminar variante"}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="text-muted">Aun no hay productos generados. Marca las combinaciones y genera la lista.</div>
      )}

      <SimpleDraftModal
        show={Boolean(modalBorrador)}
        tipo={modalBorrador || "material"}
        initialValue={borradorEditando}
        existingItems={
          modalBorrador === "material"
            ? materialesDisponibles
            : modalBorrador === "color"
              ? coloresDisponibles
              : [...categoriasGlobales, ...categoriasDisponibles]
        }
        lockCodigo={modalBorrador === "categoria"}
        onClose={() => {
          setModalBorrador("");
          setBorradorEditando(null);
        }}
        onSave={(borrador) => guardarBorradorRapido(modalBorrador, borrador)}
      />

      <CategoriaBatchModal
        show={modalCategorias}
        categoriasBase={categorias}
        categoriasActuales={categoriasDisponibles}
        categoriasGlobales={categoriasGlobales}
        onClose={() => setModalCategorias(false)}
        onSave={guardarCategoriasBatch}
      />
    </div>
  );
}
