import { useEffect, useMemo, useState } from "react";

import { obtenerNiveles, crearNivel } from "../../../../services/niveles.js";
import { obtenerColores, crearColor } from "../../../../services/color.js";
import { obtenerFamiliaPorId } from "../../../../services/familias.js";
import { obtenerLineaProductoPorId } from "../../../../services/lineaProducto.js";
import SearchableSelect from "../../../../components/ui/SearchableSelect.jsx";

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

const construirSku = ({ linea, familia, modelo, categoria, color }) => {
  const codigoLinea = tomarInicial(linea?.codigo || linea?.nombre, "X");
  const codigoFamilia = tomarInicial(familia?.codigo || familia?.nombre, "X");
  const codigoModelo = tomarInicial(modelo?.codigo || modelo?.nombre, "X");

  return `${codigoLinea}${codigoFamilia}${codigoModelo}-${construirCodigoCategoria(categoria)}-${construirCodigoColor(color)}`;
};

const getParKey = (categoriaId, colorId) => `${categoriaId}::${colorId}`;

export default function VariantesStep({ data, onUpdate }) {
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [familiaActual, setFamiliaActual] = useState(null);
  const [lineaActual, setLineaActual] = useState(null);

  const [categoriaId, setCategoriaId] = useState("");
  const [coloresSeleccionados, setColoresSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const variantes = Array.isArray(data.variantes) ? data.variantes : [];

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

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        await Promise.all([cargarCategorias(), cargarColores()]);
      } catch (error) {
        console.error("Error cargando catalogos de variantes:", error);
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

  const categoriaSeleccionada = useMemo(
    () => categorias.find((categoria) => String(categoria.id) === String(categoriaId)) || null,
    [categorias, categoriaId]
  );

  const coloresElegidos = useMemo(
    () => colores.filter((color) => coloresSeleccionados.includes(String(color.id))),
    [colores, coloresSeleccionados]
  );

  const variantesExistentes = useMemo(() => {
    const pares = new Set();
    const skus = new Set();
    variantes.forEach((variante) => {
      if (variante?.categoriaId && variante?.colorId) {
        pares.add(getParKey(variante.categoriaId, variante.colorId));
      }
      if (variante?.sku) {
        skus.add(variante.sku.trim().toUpperCase());
      }
    });
    return { pares, skus };
  }, [variantes]);

  const toggleColor = (colorId) => {
    const id = String(colorId);
    setColoresSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setMensaje("");
  };

  const seleccionarColoresActivos = () => {
    setColoresSeleccionados(colores.map((color) => String(color.id)));
    setMensaje("");
  };

  const agregarVariantesDelNivel = () => {
    if (!categoriaSeleccionada) {
      setMensaje("Selecciona un nivel/categoria.");
      return;
    }

    if (coloresElegidos.length === 0) {
      setMensaje("Selecciona uno o mas colores para este nivel.");
      return;
    }

    const nuevas = [...variantes];
    const pares = new Set(variantesExistentes.pares);
    const skus = new Set(variantesExistentes.skus);
    let agregadas = 0;
    let omitidas = 0;

    coloresElegidos.forEach((color) => {
      const parKey = getParKey(categoriaSeleccionada.id, color.id);
      const sku = construirSku({
        linea: lineaActual,
        familia: familiaActual,
        modelo: data?.modelo,
        categoria: categoriaSeleccionada,
        color
      }).toUpperCase();

      if (pares.has(parKey) || skus.has(sku)) {
        omitidas += 1;
        return;
      }

      nuevas.push({
        id: Date.now() + nuevas.length,
        categoriaId: Number(categoriaSeleccionada.id),
        categoriaNombre: categoriaSeleccionada.nombre || "",
        categoriaCodigo: categoriaSeleccionada.codigo || "",
        colorId: Number(color.id),
        colorNombre: color.nombre || "",
        colorCodigo: color.codigo || "",
        colorHex: color.hex || "",
        sku
      });

      pares.add(parKey);
      skus.add(sku);
      agregadas += 1;
    });

    onUpdate("variantes", nuevas);
    setMensaje(`${agregadas} variantes agregadas${omitidas ? `, ${omitidas} duplicadas omitidas` : ""}.`);
  };

  const eliminarVariante = (index) => {
    onUpdate("variantes", variantes.filter((_, i) => i !== index));
    setMensaje("");
  };

  const eliminarNivel = (nivelId) => {
    onUpdate("variantes", variantes.filter((variante) => String(variante.categoriaId) !== String(nivelId)));
    setMensaje("Nivel eliminado de la lista.");
  };

  const limpiarVariantes = () => {
    if (!window.confirm("Eliminar todas las variantes generadas?")) return;
    onUpdate("variantes", []);
    setMensaje("Variantes limpiadas.");
  };

  const crearCategoriaRapida = async () => {
    const nombre = window.prompt("Nombre de la categoria / nivel:");
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

      const actualizadas = await cargarCategorias();
      const creada = actualizadas.find((cat) => cat.nombre?.trim().toLowerCase() === nombre.trim().toLowerCase());
      if (creada?.id) setCategoriaId(String(creada.id));
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

      const actualizados = await cargarColores();
      const creado = actualizados.find((color) => color.nombre?.trim().toLowerCase() === nombre.trim().toLowerCase());
      if (creado?.id) toggleColor(creado.id);
    } catch (error) {
      console.error("Error creando color:", error);
      alert(error.message || "No se pudo crear el color.");
    }
  };

  const variantesPorNivel = useMemo(() => {
    const mapa = new Map();
    variantes.forEach((variante) => {
      const key = String(variante.categoriaId || "sin-nivel");
      if (!mapa.has(key)) {
        mapa.set(key, {
          id: key,
          nombre: variante.categoriaNombre || "Sin nivel",
          codigo: variante.categoriaCodigo || "",
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
        <p className="mb-0 mt-2">Cargando categorias y colores...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-palette me-2 text-primary"></i>
        Variantes del Producto
      </h4>

      <div className="alert alert-info py-2">
        Trabaja un nivel a la vez: elige el nivel y marca solo los colores que existan para ese nivel.
      </div>

      <div className="card bg-light mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-5">
              <SearchableSelect
                label="Nivel / categoria"
                value={categoriaId}
                options={categorias}
                onChange={(value) => {
                  setCategoriaId(value);
                  setMensaje("");
                }}
                placeholder="Seleccionar nivel..."
                searchPlaceholder="Escribe codigo, nombre o descripcion..."
                getOptionValue={(categoria) => categoria.id}
                getOptionLabel={(categoria) => `${categoria.codigo ? `[${categoria.codigo}] ` : ""}${categoria.nombre}`}
                getOptionSearchText={(categoria) =>
                  [categoria.codigo, categoria.nombre, categoria.descripcion].filter(Boolean).join(" ").toLowerCase()
                }
                actionNode={
                  <button type="button" className="btn btn-outline-secondary" onClick={crearCategoriaRapida}>
                    +
                  </button>
                }
              />
            </div>

            <div className="col-lg-7">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">Colores para este nivel</label>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={seleccionarColoresActivos}>
                    Todos
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setColoresSeleccionados([])}>
                    Limpiar
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={crearColorRapido}>
                    + Color
                  </button>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {colores.map((color) => {
                  const selected = coloresSeleccionados.includes(String(color.id));
                  return (
                    <button
                      key={color.id}
                      type="button"
                      className={`btn btn-sm ${selected ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => toggleColor(color.id)}
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
            </div>

            <div className="col-12 d-flex flex-wrap align-items-center gap-2">
              <button type="button" className="btn btn-primary" onClick={agregarVariantesDelNivel}>
                Agregar colores al nivel
              </button>
              {variantes.length > 0 && (
                <button type="button" className="btn btn-outline-danger" onClick={limpiarVariantes}>
                  Limpiar todo
                </button>
              )}
              {mensaje && <span className="text-muted">{mensaje}</span>}
            </div>
          </div>
        </div>
      </div>

      {variantesPorNivel.length > 0 ? (
        variantesPorNivel.map((grupo) => (
          <div key={grupo.id} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>
                {grupo.codigo ? `[${grupo.codigo}] ` : ""}
                {grupo.nombre}
              </strong>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarNivel(grupo.id)}>
                Quitar nivel
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
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
        <div className="text-muted">Aun no hay variantes. Agrega colores al nivel seleccionado.</div>
      )}
    </div>
  );
}
