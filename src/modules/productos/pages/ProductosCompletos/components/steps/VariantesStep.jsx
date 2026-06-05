import { useEffect, useMemo, useState } from "react";

import { obtenerNiveles, crearNivel } from "../../../../services/niveles.js";
import { obtenerColores, crearColor } from "../../../../../colores/services/color.js";
import { obtenerMaterialesActivos, crearMaterial } from "../../../../../materiales/services/materiales.js";
import { obtenerFamiliaPorId } from "../../../../../familias/services/familias.js";
import { obtenerLineaProductoPorId } from "../../../../../lineas-producto/services/lineaProducto.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
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

export default function VariantesStep({ data, onUpdate }) {
  const [categorias, setCategorias] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [familiaActual, setFamiliaActual] = useState(null);
  const [lineaActual, setLineaActual] = useState(null);
  const [seleccion, setSeleccion] = useState({});
  const [mensaje, setMensaje] = useState("");

  const variantes = useMemo(
    () => (Array.isArray(data.variantes) ? data.variantes : []),
    [data.variantes]
  );

  const cargarCategorias = async () => {
    const lista = getLista(await obtenerNiveles());
    setCategorias(lista);
    return lista;
  };

  const cargarColores = async () => {
    const lista = getLista(await obtenerColores());
    setColores(lista);
    return lista;
  };

  const cargarMateriales = async () => {
    const lista = getLista(await obtenerMaterialesActivos());
    setMateriales(lista);
    return lista;
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        await Promise.all([cargarCategorias(), cargarMateriales(), cargarColores()]);
      } catch (error) {
        console.error("Error cargando catalogos de productos:", error);
      } finally {
        setCargandoCatalogos(false);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    const cargarContextoSku = async () => {
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
  }, [data?.modelo?.familiaId]);

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

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [String(categoria.id), categoria])),
    [categorias]
  );

  const materialesPorId = useMemo(
    () => new Map(materiales.map((material) => [String(material.id), material])),
    [materiales]
  );

  const coloresPorId = useMemo(
    () => new Map(colores.map((color) => [String(color.id), color])),
    [colores]
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
    const todos = colores.map((color) => getColorKey(color.id));

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
            categoriaId: Number(categoria.id),
            categoriaNombre: categoria.nombre || "",
            categoriaCodigo: categoria.codigo || "",
            materialId: Number(material.id),
            materialNombre: material.nombre || "",
            materialCodigo: material.codigo || "",
            colorId: Number(color.id),
            colorNombre: color.nombre || "",
            colorCodigo: color.codigo || "",
            colorHex: color.hex || "",
            sku
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

  const limpiarVariantes = () => {
    if (!window.confirm("Eliminar todos los productos generados?")) return;
    setSeleccion({});
    onUpdate("variantes", []);
    setMensaje("Productos limpiados.");
  };

  const crearMaterialRapido = async () => {
    const nombre = window.prompt("Nombre del material:");
    if (!nombre || !nombre.trim()) return;

    const codigoSugerido = nombre
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
      .join("")
      .slice(0, 3)
      .padEnd(3, "X");

    const codigo = window.prompt("Codigo corto de material (ej: NAT, FOR):", codigoSugerido);

    try {
      await crearMaterial({
        codigo: (codigo || codigoSugerido).trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: "Creado desde wizard de producto"
      });

      await cargarMateriales();
    } catch (error) {
      console.error("Error creando material:", error);
      alert(error.message || "No se pudo crear el material.");
    }
  };

  const crearCategoriaRapida = async () => {
    const nombre = window.prompt("Nombre de la categoria:");
    if (!nombre || !nombre.trim()) return;

    const codigoSugerido = String(categorias.length + 1).padStart(2, "0");
    const codigo = window.prompt("Codigo corto de categoria (ej: 01):", codigoSugerido);

    try {
      await crearNivel({
        codigo: (codigo || codigoSugerido).trim(),
        nombre: nombre.trim(),
        descripcion: "Creada desde wizard de producto",
        activo: true
      });

      await cargarCategorias();
    } catch (error) {
      console.error("Error creando categoria:", error);
      alert(error.message || "No se pudo crear la categoria.");
    }
  };

  const crearColorRapido = async () => {
    const nombre = window.prompt("Nombre del color:");
    if (!nombre || !nombre.trim()) return;

    const codigoSugerido = nombre
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .padEnd(2, "X");

    const codigo = window.prompt("Codigo corto de color (ej: AE):", codigoSugerido);
    const hex = window.prompt("HEX del color (ej: #1E90FF):", "#808080");

    try {
      await crearColor({
        codigo: (codigo || codigoSugerido).trim().toUpperCase(),
        nombre: nombre.trim(),
        hex: (hex || "#808080").trim().toUpperCase()
      });

      await cargarColores();
    } catch (error) {
      console.error("Error creando color:", error);
      alert(error.message || "No se pudo crear el color.");
    }
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
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={crearMaterialRapido}>
          + Material
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={crearCategoriaRapida}>
          + Categoria
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={crearColorRapido}>
          + Color
        </button>
      </div>

      <div className="accordion mb-4" id="accordion-materiales-producto">
        {materiales.map((material) => {
          const materialKey = getMaterialKey(material.id);
          const materialActivo = Boolean(seleccion[materialKey]);
          const categoriasSeleccionadas = seleccion[materialKey]?.categorias || {};
          const totalMaterial = Object.values(categoriasSeleccionadas).reduce(
            (total, colorIds) => total + (Array.isArray(colorIds) ? colorIds.length : 0),
            0
          );

          return (
            <div className="accordion-item" key={material.id}>
              <h2 className="accordion-header">
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
                  {totalMaterial > 0 && <span className="badge bg-primary ms-3">{totalMaterial} productos</span>}
                </button>
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
                      {categorias.map((categoria) => {
                        const categoriaKey = getCategoriaKey(categoria.id);
                        const categoriaActiva = Object.prototype.hasOwnProperty.call(categoriasSeleccionadas, categoriaKey);
                        const coloresCategoria = categoriasSeleccionadas[categoriaKey] || [];

                        return (
                          <div className="col-12" key={categoria.id}>
                            <div className="border rounded p-3">
                              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
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
                                  {colores.map((color) => {
                                    const selected = coloresCategoria.includes(getColorKey(color.id));
                                    return (
                                      <button
                                        key={color.id}
                                        type="button"
                                        className={`btn btn-sm ${selected ? "btn-success" : "btn-outline-success"}`}
                                        onClick={() => toggleColor(material.id, categoria.id, color.id)}
                                      >
                                        <span
                                          className="d-inline-block rounded-circle border me-1"
                                          style={{ width: "12px", height: "12px", backgroundColor: color.hex || "#ccc" }}
                                        />
                                        {color.codigo ? `[${color.codigo}] ` : ""}
                                        {color.nombre}
                                      </button>
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
                        <td>
                          <code>{variante.sku || "-"}</code>
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
    </div>
  );
}
