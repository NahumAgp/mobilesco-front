import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { obtenerProductos } from "../../services/productos";
import "./ProductosCalidadPage.css";

const FETCH_PAGE_SIZE = 200;
const FILTROS_DEFAULT = {
  busqueda: "",
  problema: "todos"
};

const PROBLEMAS = [
  { key: "imagen", label: "Sin imagen", icon: "bi-image", tone: "warning" },
  { key: "medidas", label: "Medidas incompletas", icon: "bi-rulers", tone: "danger" },
  { key: "peso", label: "Sin peso fisico", icon: "bi-speedometer", tone: "warning" },
  { key: "volumetrico", label: "Sin peso volumetrico", icon: "bi-box-arrow-in-up", tone: "warning" },
  { key: "familia", label: "Sin familia", icon: "bi-diagram-3", tone: "danger" },
  { key: "modelo", label: "Sin modelo", icon: "bi-boxes", tone: "danger" },
  { key: "nivel", label: "Sin nivel", icon: "bi-layers", tone: "danger" },
  { key: "material", label: "Sin material", icon: "bi-stack", tone: "danger" },
  { key: "color", label: "Sin color", icon: "bi-palette", tone: "danger" },
  { key: "descripcion", label: "Sin descripcion", icon: "bi-card-text", tone: "info" }
];

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.items)) return respuesta.items;
  return [];
};

const getProductoId = (producto) => producto?.id || producto?.productoId || producto?.id_producto || null;

const getTexto = (...valores) => {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number") return String(valor);
  }
  return "";
};

const normalizar = (valor = "") =>
  valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const tieneNumero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return false;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
};

const imagenActiva = (imagen) => imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const tieneImagen = (producto) => {
  if (producto?.imagenPrincipal?.url || producto?.imagenPrincipalUrl || producto?.imagenUrl || producto?.urlImagen) return true;
  if (!Array.isArray(producto?.imagenes)) return false;
  return producto.imagenes.some((imagen) => imagenActiva(imagen) && (imagen?.url || typeof imagen === "string"));
};

const getRuta = (producto) =>
  [
    getTexto(producto?.lineaNombre, producto?.linea?.nombre, producto?.modelo?.familia?.linea?.nombre),
    getTexto(producto?.familiaNombre, producto?.familia?.nombre, producto?.modelo?.familia?.nombre),
    getTexto(producto?.subfamiliaNombre, producto?.subfamilia?.nombre, producto?.modelo?.subfamilia?.nombre),
    getTexto(producto?.modeloNombre, producto?.nombre_modelo, producto?.productoBaseNombre, producto?.modelo?.nombre)
  ].filter(Boolean);

const evaluarProducto = (producto) => {
  const problemas = [];
  const add = (key) => {
    const problema = PROBLEMAS.find((item) => item.key === key);
    if (problema) problemas.push(problema);
  };

  if (!tieneImagen(producto)) add("imagen");
  if (![producto?.ancho, producto?.alto, producto?.fondo].every(tieneNumero)) add("medidas");
  if (!tieneNumero(producto?.pesoKg ?? producto?.peso_kg)) add("peso");
  if (!tieneNumero(producto?.pesoVolumetrico ?? producto?.peso_volumetrico)) add("volumetrico");
  if (!getTexto(producto?.familiaNombre, producto?.familia?.nombre, producto?.modelo?.familia?.nombre)) add("familia");
  if (!getTexto(producto?.modeloNombre, producto?.nombre_modelo, producto?.productoBaseNombre, producto?.modelo?.nombre)) add("modelo");
  if (!getTexto(producto?.nivelNombre, producto?.categoriaNombre, producto?.nombre_nivel, producto?.nivel?.nombre)) add("nivel");
  if (!getTexto(producto?.materialNombre, producto?.nombre_material, producto?.material?.nombre)) add("material");
  if (!getTexto(producto?.colorNombre, producto?.nombre_color, producto?.color?.nombre)) add("color");
  if (!getTexto(producto?.descripcionCorta, producto?.descripcion, producto?.description)) add("descripcion");

  return problemas;
};

export default function ProductosCalidadPage() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = usePersistedState("productos-calidad:filtros", FILTROS_DEFAULT);
  const busquedaDebounced = useDebouncedValue(filtros.busqueda, 250);
  const problemaActivo = useMemo(
    () => filtros.problema === "completos" || PROBLEMAS.some((problema) => problema.key === filtros.problema)
      ? filtros.problema
      : "todos",
    [filtros.problema]
  );

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const acumulado = [];
      let pagina = 0;
      let totalPaginas = 1;

      do {
        const data = await obtenerProductos({
          page: pagina,
          size: FETCH_PAGE_SIZE,
          sortBy: "sku",
          direction: "asc"
        });

        acumulado.push(...getLista(data));
        totalPaginas = Number(data?.totalPages || 1);
        pagina += 1;
      } while (pagina < totalPaginas);

      setProductos(acumulado);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la calidad de datos de productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const productosEvaluados = useMemo(
    () =>
      productos.map((producto) => ({
        ...producto,
        _id: getProductoId(producto),
        _ruta: getRuta(producto),
        _problemas: evaluarProducto(producto)
      })),
    [productos]
  );

  const resumen = useMemo(() => {
    const conteos = PROBLEMAS.reduce((acc, item) => ({ ...acc, [item.key]: 0 }), {});
    let completos = 0;

    productosEvaluados.forEach((producto) => {
      if (!producto._problemas.length) {
        completos += 1;
        return;
      }
      producto._problemas.forEach((problema) => {
        conteos[problema.key] += 1;
      });
    });

    return {
      total: productosEvaluados.length,
      completos,
      incompletos: productosEvaluados.length - completos,
      conteos
    };
  }, [productosEvaluados]);

  const productosFiltrados = useMemo(() => {
    const termino = normalizar(busquedaDebounced);

    return productosEvaluados.filter((producto) => {
      const coincideProblema =
        problemaActivo === "todos" ||
        (problemaActivo === "completos" && producto._problemas.length === 0) ||
        producto._problemas.some((problema) => problema.key === problemaActivo);

      if (!coincideProblema) return false;
      if (!termino) return true;

      const texto = [
        producto?.sku,
        producto?.nombre,
        producto?.descripcion,
        producto?.descripcionCorta,
        ...producto._ruta,
        getTexto(producto?.materialNombre, producto?.nombre_material, producto?.material?.nombre),
        getTexto(producto?.colorNombre, producto?.nombre_color, producto?.color?.nombre)
      ].join(" ");

      return normalizar(texto).includes(termino);
    });
  }, [busquedaDebounced, problemaActivo, productosEvaluados]);

  const porcentajeCompleto = resumen.total ? Math.round((resumen.completos / resumen.total) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Calidad de datos"
        subtitle="Revision de productos incompletos para catalogo, costos y busqueda"
        actions={
          <button className="btn btn-outline-secondary" onClick={cargarProductos} disabled={loading}>
            <i className={`bi ${loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"} me-2`}></i>
            Actualizar
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="productos-calidad-score">
        <div>
          <span>Completitud</span>
          <strong>{porcentajeCompleto}%</strong>
        </div>
        <div className="productos-calidad-progress" aria-label={`Completitud ${porcentajeCompleto}%`}>
          <div style={{ width: `${porcentajeCompleto}%` }}></div>
        </div>
        <small>{resumen.completos} completos de {resumen.total} productos</small>
      </div>

      <div className="productos-calidad-metrics">
        <button
          type="button"
          className={`productos-calidad-metric ${problemaActivo === "todos" ? "is-active" : ""}`}
          onClick={() => setFiltros((current) => ({ ...current, problema: "todos" }))}
        >
          <i className="bi bi-list-check"></i>
          <span>Revisados</span>
          <strong>{resumen.total}</strong>
        </button>
        <button
          type="button"
          className={`productos-calidad-metric ${problemaActivo === "completos" ? "is-active" : ""}`}
          onClick={() => setFiltros((current) => ({ ...current, problema: "completos" }))}
        >
          <i className="bi bi-check2-circle"></i>
          <span>Completos</span>
          <strong>{resumen.completos}</strong>
        </button>
        {PROBLEMAS.map((problema) => (
          <button
            type="button"
            key={problema.key}
            className={`productos-calidad-metric tone-${problema.tone} ${problemaActivo === problema.key ? "is-active" : ""}`}
            onClick={() => setFiltros((current) => ({ ...current, problema: problema.key }))}
          >
            <i className={`bi ${problema.icon}`}></i>
            <span>{problema.label}</span>
            <strong>{resumen.conteos[problema.key]}</strong>
          </button>
        ))}
      </div>

      <div className="productos-calidad-toolbar">
        <div className="productos-calidad-search">
          <i className="bi bi-search"></i>
          <input
            type="search"
            value={filtros.busqueda}
            placeholder="Buscar por SKU, nombre, ruta, material o color"
            onChange={(event) => setFiltros((current) => ({ ...current, busqueda: event.target.value }))}
          />
        </div>
        <select className="form-select" value={problemaActivo} onChange={(event) => setFiltros((current) => ({ ...current, problema: event.target.value }))}>
          <option value="todos">Todos los productos</option>
          <option value="completos">Solo completos</option>
          {PROBLEMAS.map((problema) => (
            <option key={problema.key} value={problema.key}>{problema.label}</option>
          ))}
        </select>
        <span>{productosFiltrados.length} resultados</span>
      </div>

      <div className="productos-calidad-table">
        {!loading && productosFiltrados.length === 0 ? (
          <div className="productos-calidad-empty">No hay productos con esos filtros.</div>
        ) : (
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Ruta</th>
                <th>Atributos</th>
                <th>Faltantes</th>
                <th className="text-end">Accion</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => {
                const material = getTexto(producto?.materialNombre, producto?.nombre_material, producto?.material?.nombre, "-");
                const color = getTexto(producto?.colorNombre, producto?.nombre_color, producto?.color?.nombre, "-");
                const nivel = getTexto(producto?.nivelNombre, producto?.categoriaNombre, producto?.nombre_nivel, producto?.nivel?.nombre, "-");

                return (
                  <tr key={producto._id || producto.sku || producto.nombre}>
                    <td><strong>{producto.sku || "-"}</strong></td>
                    <td>
                      <div className="productos-calidad-name">{producto.nombre || "Producto sin nombre"}</div>
                      <small>{getTexto(producto.descripcionCorta, producto.descripcion, "Sin descripcion")}</small>
                    </td>
                    <td>
                      <div className="productos-calidad-route">
                        {producto._ruta.length ? producto._ruta.map((item) => <span key={item}>{item}</span>) : <span>Sin ruta</span>}
                      </div>
                    </td>
                    <td>
                      <div className="productos-calidad-attrs">
                        <span>{nivel}</span>
                        <span>{material}</span>
                        <span>{color}</span>
                      </div>
                    </td>
                    <td>
                      <div className="productos-calidad-badges">
                        {producto._problemas.length ? (
                          producto._problemas.map((problema) => (
                            <span key={problema.key} className={`badge text-bg-${problema.tone}`}>{problema.label}</span>
                          ))
                        ) : (
                          <span className="badge text-bg-success">Completo</span>
                        )}
                      </div>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={!producto._id}
                        onClick={() => navigate(`/productos/${producto._id}`)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
