import { useEffect, useMemo, useState } from "react";

import { obtenerNiveles } from "../../../../services/niveles.js";
import { obtenerColores } from "../../../../../colores/services/color.js";
import { obtenerMaterialesActivos } from "../../../../../materiales/services/materiales.js";
import { obtenerFamiliaPorId } from "../../../../../familias/services/familias.js";
import { obtenerLineaProductoPorId } from "../../../../../lineas-producto/services/lineaProducto.js";
import { SimpleDraftModal } from "../WizardDraftModal.jsx";

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

const tomarInicial = (valor, fallback = "X") => {
  const limpio = limpiarCodigo(valor);
  return limpio[0] || fallback;
};

const construirCodigoCategoria = (categoria) => {
  const base = limpiarCodigo(categoria?.codigo || "");
  if (/^\d+$/.test(base)) return base.slice(-2).padStart(2, "0");
  if (base) return base.slice(0, 2).padEnd(2, "X");

  const porId = String(categoria?.id || "").replace(/\D/g, "");
  return porId ? porId.slice(-2).padStart(2, "0") : "00";
};

const construirCodigoColor = (color) => {
  const base = limpiarCodigo(color?.codigo || "");
  if (base) return base.slice(0, 2).padEnd(2, "X");

  const iniciales = (color?.nombre || "")
    .trim()
    .split(/\s+/)
    .map((parte) => limpiarCodigo(parte)[0])
    .filter(Boolean)
    .join("");

  return (iniciales || "SC").slice(0, 2).padEnd(2, "X");
};

const construirCodigoMaterial = (material) => {
  const base = limpiarCodigo(material?.codigo || "");
  if (base) return base.slice(0, 3).padEnd(3, "X");

  const iniciales = (material?.nombre || "")
    .trim()
    .split(/\s+/)
    .map((parte) => limpiarCodigo(parte)[0])
    .filter(Boolean)
    .join("");

  return (iniciales || "MAT").slice(0, 3).padEnd(3, "X");
};

const construirSku = ({ linea, familia, modelo, categoria, material, color }) => {
  const codigoLinea = tomarInicial(linea?.codigo || linea?.nombre, "X");
  const codigoFamilia = tomarInicial(familia?.codigo || familia?.nombre, "X");
  const codigoModelo = tomarInicial(modelo?.codigo || modelo?.nombre, "X");

  return `${codigoLinea}${codigoFamilia}${codigoModelo}-${construirCodigoCategoria(categoria)}-${construirCodigoMaterial(material)}-${construirCodigoColor(color)}`;
};

const getParKey = (categoriaId, materialId, colorId) => `${categoriaId}::${materialId}::${colorId}`;

const getCategoriaKey = (categoriaId) => String(categoriaId);
const getMaterialKey = (materialId) => String(materialId);
const getColorKey = (colorId) => String(colorId);
const SECCION_BORRADOR_POR_TIPO = {
  material: "materiales",
  color: "colores"
};

export default function VariantesStep({ data, onUpdate, borradores, onUpsertDraft }) {
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
  const [borradorEditando, setBorradorEditando] = useState(null);

  const variantes = useMemo(
    () => (Array.isArray(data.variantes) ? data.variantes : []),
    [data.variantes]
  );

  const categoriasDisponibles = useMemo(() => {
    if (data?.modelo?.modo === "nuevo") return data?.modelo?.categorias || [];
    return [
      ...(borradores?.categorias || []).filter((item) => String(item.modeloId) === String(data?.modelo?.id)),
      ...categorias
    ];
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
          obtenerNiveles().then(getLista),
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

    setSeleccion((prev) => {
      const materialActual = prev[materialKey] || { categorias: {} };
      const categoriasActuales = { ...materialActual.categorias };

      if (categoriasActuales[categoriaKey]) {
        delete categoriasActuales[categoriaKey];
      } else {
        categoriasActuales[categoriaKey] = [];
      }

      return {
        ...prev,
        [materialKey]: { categorias: categoriasActuales }
      };
    });
    setMensaje("");
  };

  const toggleColor = (materialId, categoriaId, colorId) => {
    const materialKey = getMaterialKey(materialId);
    const categoriaKey = getCategoriaKey(categoriaId);
    const colorKey = getColorKey(colorId);

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
      return {
        ...prev,
        [materialKey]: {
          categorias: {
            ...materialActual.categorias,
            [categoriaKey]: []
          }
        }
      };
    });
    setMensaje("");
  };

  const generarVariantes = () => {
    const nuevas = [];
    const skus = new Set();
    let omitidas = 0;

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
          const sku = construirSku({
            linea: lineaActual,
            familia: familiaActual,
            modelo: data?.modelo,
            categoria,
            material,
            color
          }).toUpperCase();

          if (skus.has(sku)) {
            omitidas += 1;
            return;
          }

          nuevas.push({
            id: existente?.id || `${Date.now()}-${nuevas.length}`,
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
            descripcionCorta: existente?.descripcionCorta || "",
            pesoVolumetrico: existente?.pesoVolumetrico ?? "",
            ancho: existente?.ancho ?? "",
            alto: existente?.alto ?? "",
            fondo: existente?.fondo ?? "",
            dimensiones: existente?.dimensiones || "",
            pesoKg: existente?.pesoKg ?? ""
          });
          skus.add(sku);
        });
      });
    });

    onUpdate("variantes", nuevas);
    setMensaje(`${nuevas.length} productos listos${omitidas ? `, ${omitidas} duplicados omitidos` : ""}.`);
  };

  const eliminarVariante = (index) => {
    const variante = variantes[index];
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
    if (!window.confirm("Eliminar todos los productos generados?")) return;
    setSeleccion({});
    onUpdate("variantes", []);
    setMensaje("Productos limpiados.");
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
        ]
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

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => abrirBorrador("material")}>
          + Material
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => abrirBorrador("categoria")}>
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
                                    return (
                                      <div key={color.id} className="d-inline-flex">
                                        <button
                                          type="button"
                                          className={`btn btn-sm ${selected ? "btn-success" : "btn-outline-success"} ${color._pending ? "rounded-end-0" : ""}`}
                                          onClick={() => toggleColor(material.id, categoria.id, color.id)}
                                        >
                                          <span
                                            className="d-inline-block rounded-circle border me-1"
                                            style={{ width: "12px", height: "12px", backgroundColor: color.hex || "#ccc" }}
                                          />
                                          {color.codigo ? `[${color.codigo}] ` : ""}
                                          {color.nombre}
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
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Categoria</th>
                    <th>Color</th>
                    <th>Dimensiones</th>
                    <th>Peso (kg)</th>
                    <th>SKU</th>
                    <th>Descripcion corta</th>
                    <th>Peso volumetrico</th>
                    <th>Ancho</th>
                    <th>Alto</th>
                    <th>Fondo</th>
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
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={variante.dimensiones || ""}
                            onChange={(e) => actualizarVarianteCampo(indexReal, "dimensiones", e.target.value)}
                            placeholder="1.20 x 0.40 x 0.65 m"
                          />
                        </td>
                        <td style={{ minWidth: "130px" }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm text-end"
                            value={variante.pesoKg ?? ""}
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
                          <code>{variante.sku || "-"}</code>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={variante.descripcionCorta || ""}
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
                            onChange={(event) => actualizarVariante(indexReal, "fondo", event.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarVariante(indexReal)}
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
        onClose={() => {
          setModalBorrador("");
          setBorradorEditando(null);
        }}
        onSave={(borrador) => guardarBorradorRapido(modalBorrador, borrador)}
      />
    </div>
  );
}
