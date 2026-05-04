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

export default function VariantesStep({ data, onUpdate }) {
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [varianteForm, setVarianteForm] = useState({
    categoriaId: "",
    colorId: ""
  });

  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [familiaActual, setFamiliaActual] = useState(null);
  const [lineaActual, setLineaActual] = useState(null);

  const variantes = Array.isArray(data.variantes) ? data.variantes : [];

  const cargarCategorias = async () => {
    const respuesta = await obtenerNiveles();
    const lista = getLista(respuesta);
    setCategorias(lista);
    return lista;
  };

  const cargarColores = async () => {
    const respuesta = await obtenerColores();
    const lista = getLista(respuesta);
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
        if (!lineaId) {
          setLineaActual(null);
          return;
        }

        const linea = await obtenerLineaProductoPorId(lineaId);
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
    () => categorias.find((categoria) => String(categoria.id) === String(varianteForm.categoriaId)),
    [categorias, varianteForm.categoriaId]
  );

  const colorSeleccionado = useMemo(
    () => colores.find((color) => String(color.id) === String(varianteForm.colorId)),
    [colores, varianteForm.colorId]
  );

  const skuGenerado = useMemo(
    () =>
      construirSku({
        linea: lineaActual,
        familia: familiaActual,
        modelo: data?.modelo,
        categoria: categoriaSeleccionada,
        color: colorSeleccionado
      }),
    [lineaActual, familiaActual, data?.modelo, categoriaSeleccionada, colorSeleccionado]
  );

  const resetForm = () => {
    setVarianteForm({ categoriaId: "", colorId: "" });
    setEditandoIndex(null);
  };

  const agregarOActualizarVariante = () => {
    if (!varianteForm.categoriaId || !varianteForm.colorId) {
      alert("Selecciona categoria y color para generar la variante.");
      return;
    }

    const nuevaVariante = {
      id: editandoIndex !== null ? variantes[editandoIndex]?.id : Date.now(),
      categoriaId: Number(varianteForm.categoriaId),
      categoriaNombre: categoriaSeleccionada?.nombre || "",
      categoriaCodigo: categoriaSeleccionada?.codigo || "",
      colorId: Number(varianteForm.colorId),
      colorNombre: colorSeleccionado?.nombre || "",
      colorCodigo: colorSeleccionado?.codigo || "",
      colorHex: colorSeleccionado?.hex || "",
      sku: skuGenerado
    };

    const nuevasVariantes = [...variantes];
    if (editandoIndex !== null) {
      nuevasVariantes[editandoIndex] = nuevaVariante;
    } else {
      nuevasVariantes.push(nuevaVariante);
    }

    onUpdate("variantes", nuevasVariantes);
    resetForm();
  };

  const editarVariante = (index) => {
    const variante = variantes[index];
    if (!variante) return;

    setEditandoIndex(index);
    setVarianteForm({
      categoriaId: variante.categoriaId ? String(variante.categoriaId) : "",
      colorId: variante.colorId ? String(variante.colorId) : ""
    });
  };

  const eliminarVariante = (index) => {
    const nuevasVariantes = variantes.filter((_, i) => i !== index);
    onUpdate("variantes", nuevasVariantes);

    if (editandoIndex === index) {
      resetForm();
    }
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

      const categoriasActualizadas = await cargarCategorias();

      const categoriaRecienCreada = categoriasActualizadas.find(
        (cat) => cat.nombre?.trim().toLowerCase() === nombre.trim().toLowerCase()
      );

      if (categoriaRecienCreada?.id) {
        setVarianteForm((prev) => ({ ...prev, categoriaId: String(categoriaRecienCreada.id) }));
      }
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

      const coloresActualizados = await cargarColores();

      const colorRecienCreado = coloresActualizados.find(
        (color) => color.nombre?.trim().toLowerCase() === nombre.trim().toLowerCase()
      );

      if (colorRecienCreado?.id) {
        setVarianteForm((prev) => ({ ...prev, colorId: String(colorRecienCreado.id) }));
      }
    } catch (error) {
      console.error("Error creando color:", error);
      alert(error.message || "No se pudo crear el color.");
    }
  };

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

      <div className="card bg-light mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <SearchableSelect
                label="Categoria / Nivel *"
                value={varianteForm.categoriaId}
                options={categorias}
                onChange={(value) => setVarianteForm((prev) => ({ ...prev, categoriaId: value }))}
                placeholder="Seleccionar categoria..."
                searchPlaceholder="Escribe código, nombre o descripción..."
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

            <div className="col-md-5">
              <SearchableSelect
                label="Color *"
                value={varianteForm.colorId}
                options={colores}
                onChange={(value) => setVarianteForm((prev) => ({ ...prev, colorId: value }))}
                placeholder="Seleccionar color..."
                searchPlaceholder="Escribe código, nombre o hex..."
                getOptionValue={(color) => color.id}
                getOptionLabel={(color) => `${color.codigo ? `[${color.codigo}] ` : ""}${color.nombre}`}
                getOptionSearchText={(color) =>
                  [color.codigo, color.nombre, color.descripcion, color.hex].filter(Boolean).join(" ").toLowerCase()
                }
                actionNode={
                  <button type="button" className="btn btn-outline-secondary" onClick={crearColorRapido}>
                    +
                  </button>
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold">Vista color</label>
              <div
                className="border rounded"
                style={{
                  width: "100%",
                  height: "38px",
                  backgroundColor: colorSeleccionado?.hex || "#f8f9fa"
                }}
              ></div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">SKU (automatico)</label>
              <input type="text" className="form-control bg-white" value={skuGenerado} readOnly />
              <small className="text-muted">
                Formato: Linea + Familia + Modelo - Categoria - Color (ej: ESF-01-AE)
              </small>
            </div>

            <div className="col-md-6">
              <button className="btn btn-primary me-2" onClick={agregarOActualizarVariante}>
                <i className={`bi ${editandoIndex !== null ? "bi-pencil" : "bi-plus"} me-1`}></i>
                {editandoIndex !== null ? "Actualizar" : "Agregar"} Variante
              </button>

              {editandoIndex !== null && (
                <button className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {variantes.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Categoria</th>
                <th>Color</th>
                <th>SKU</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variantes.map((variante, index) => (
                <tr key={variante.id || index}>
                  <td className="fw-semibold">
                    {variante.categoriaCodigo ? `[${variante.categoriaCodigo}] ` : ""}
                    {variante.categoriaNombre || "-"}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle border"
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: variante.colorHex || "#ccc"
                        }}
                      ></div>
                      <span>
                        {variante.colorCodigo ? `[${variante.colorCodigo}] ` : ""}
                        {variante.colorNombre || "Sin color"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <code>{variante.sku || "-"}</code>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editarVariante(index)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarVariante(index)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
