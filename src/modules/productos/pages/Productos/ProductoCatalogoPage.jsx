import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { API_BASE_URL } from "../../../../config/apiConfig";
import { getUser, hasPermission } from "../../../auth/services/authService.js";
import { obtenerProductos } from "../../services/productos";
import { organizarFamiliasCatalogo } from "../../utils/catalogoFamilias.js";
import { getColorHex, listarColoresModelo } from "../../utils/catalogoColores.js";
import { descargarPdfCatalogo } from "../../utils/catalogoPdf.js";
import "./ProductoCatalogoPage.css";

const LOAD_SIZE = 100;
const FILTROS_DEFAULT = {
  busqueda: "",
  soloActivos: true
};

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.items)) return respuesta.items;
  return [];
};

const cargarProductosCatalogo = async (parametros) => {
  const primeraPagina = await obtenerProductos({ ...parametros, page: 0, size: LOAD_SIZE });
  const totalPaginas = Math.max(Number(primeraPagina?.totalPages || 1), 1);
  const paginasRestantes = totalPaginas > 1
    ? await Promise.all(
        Array.from({ length: totalPaginas - 1 }, (_, index) =>
          obtenerProductos({ ...parametros, page: index + 1, size: LOAD_SIZE })
        )
      )
    : [];
  return [...getLista(primeraPagina), ...paginasRestantes.flatMap(getLista)];
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

const resolverUrlImagen = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const imagenActiva = (imagen) => imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenesProducto = (producto) => {
  const imagenes = [];
  const agregar = (imagen, origen = "producto") => {
    const url = resolverUrlImagen(imagen?.url || imagen);
    if (!url) return;
    if (imagenes.some((item) => item.url === url)) return;

    imagenes.push({
      id: imagen?.id || `${origen}-${imagenes.length}`,
      url,
      altTexto: imagen?.altTexto || imagen?.nombre || producto?.nombre || producto?.sku || "Producto",
      principal: Boolean(imagen?.esPrincipal || imagen?.principal),
      orden: Number(imagen?.orden || 0)
    });
  };

  if (producto?.imagenPrincipal) agregar(producto.imagenPrincipal, "principal");

  if (Array.isArray(producto?.imagenes)) {
    producto.imagenes
      .filter((imagen) => imagenActiva(imagen))
      .sort((a, b) => {
        const principalA = Number(Boolean(a?.esPrincipal || a?.principal));
        const principalB = Number(Boolean(b?.esPrincipal || b?.principal));
        if (principalA !== principalB) return principalB - principalA;
        return Number(a?.orden || 0) - Number(b?.orden || 0);
      })
      .forEach((imagen) => agregar(imagen, "galeria"));
  }

  agregar(producto?.imagenPrincipalUrl || producto?.imagenUrl || producto?.urlImagen, "directa");

  return imagenes;
};

const ordenarPorColor = (a, b) =>
  getTexto(a?.colorNombre, a?.nombre_color).localeCompare(getTexto(b?.colorNombre, b?.nombre_color), "es", {
    numeric: true,
    sensitivity: "base"
  });

const getModeloKey = (producto) => {
  const modelo =
    producto?.modeloId ||
    producto?.id_modelo ||
    producto?.modelo?.id ||
    producto?.modeloNombre ||
    producto?.nombre_modelo ||
    producto?.productoBaseNombre ||
    "modelo";
  return normalizar(modelo || "sin-modelo");
};

const getFamiliaNombre = (producto) =>
  getTexto(
    producto?.familiaNombre,
    producto?.nombre_familia,
    producto?.familia?.nombre,
    producto?.modelo?.familia?.nombre,
    "Sin familia"
  );

const getFamiliaKey = (producto) => {
  const familiaId =
    producto?.familiaId ||
    producto?.id_familia ||
    producto?.familia?.id ||
    producto?.modelo?.familia?.id;
  return familiaId ? `familia-${familiaId}` : normalizar(getFamiliaNombre(producto));
};

const getSubfamiliaNombre = (producto) =>
  getTexto(
    producto?.subfamiliaNombre,
    producto?.nombre_subfamilia,
    producto?.subfamilia?.nombre,
    producto?.modelo?.subfamilia?.nombre,
    producto?.productoBase?.subfamilia?.nombre,
    "Sin subfamilia"
  );

const getSubfamiliaKey = (producto) => {
  const subfamiliaId =
    producto?.subfamiliaId ||
    producto?.id_subfamilia ||
    producto?.subfamilia?.id ||
    producto?.modelo?.subfamilia?.id ||
    producto?.productoBase?.subfamilia?.id;
  return subfamiliaId ? `subfamilia-${subfamiliaId}` : normalizar(getSubfamiliaNombre(producto));
};

const getModeloInfo = (productos) => {
  const base = productos[0] || {};
  const modelo = getTexto(base?.modeloNombre, base?.nombre_modelo, base?.productoBaseNombre, base?.modelo?.nombre);

  return {
    titulo: modelo || base?.nombre || "Modelo",
    modelo: modelo || "Sin modelo",
    familia: getTexto(base?.familiaNombre, base?.familia?.nombre, base?.modelo?.familia?.nombre),
    subfamilia: getSubfamiliaNombre(base),
    linea: getTexto(base?.lineaNombre, base?.linea?.nombre, base?.modelo?.familia?.linea?.nombre)
  };
};

const getAtributo = (producto, tipo) => {
  const config = {
    material: {
      id: producto?.materialId || producto?.id_material || producto?.material?.id || producto?.material_id,
      nombre: getTexto(producto?.materialNombre, producto?.nombre_material, producto?.material?.nombre, "Sin material")
    },
    nivel: {
      id: producto?.nivelId || producto?.id_nivel || producto?.nivel?.id || producto?.categoriaId || producto?.nivel_id,
      nombre: getTexto(producto?.nivelNombre, producto?.nombre_nivel, producto?.categoriaNombre, producto?.nivel?.nombre, "Sin nivel")
    },
    color: {
      id: producto?.colorId || producto?.id_color || producto?.color?.id || producto?.color_id,
      nombre: getTexto(producto?.colorNombre, producto?.nombre_color, producto?.color?.nombre, "Sin color")
    }
  };

  const atributo = config[tipo] || {};
  const key = atributo.id !== undefined && atributo.id !== null && atributo.id !== ""
    ? String(atributo.id)
    : normalizar(atributo.nombre);

  return {
    key,
    id: atributo.id ?? null,
    nombre: atributo.nombre
  };
};

const getOpcionesUnicas = (productos, tipo) => {
  const mapa = new Map();
  productos.forEach((producto) => {
    const atributo = getAtributo(producto, tipo);
    if (!atributo.key || mapa.has(atributo.key)) return;
    mapa.set(atributo.key, atributo);
  });

  return Array.from(mapa.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" })
  );
};

const coincideAtributo = (producto, tipo, key) => !key || getAtributo(producto, tipo).key === key;

const buscarProductoCompatible = (productos, cambios = {}, actual = {}) => {
  const materialKey = cambios.material ?? getAtributo(actual, "material").key;
  const nivelKey = cambios.nivel ?? getAtributo(actual, "nivel").key;
  const colorKey = cambios.color ?? getAtributo(actual, "color").key;

  const candidatos = [
    (producto) => coincideAtributo(producto, "material", materialKey) && coincideAtributo(producto, "nivel", nivelKey) && coincideAtributo(producto, "color", colorKey),
    (producto) => coincideAtributo(producto, "material", materialKey) && coincideAtributo(producto, "nivel", nivelKey),
    (producto) => coincideAtributo(producto, "material", materialKey) && coincideAtributo(producto, "color", colorKey),
    (producto) => coincideAtributo(producto, "material", materialKey),
    (producto) => coincideAtributo(producto, "nivel", nivelKey),
    (producto) => coincideAtributo(producto, "color", colorKey)
  ];

  for (const filtro of candidatos) {
    const encontrado = productos.find(filtro);
    if (encontrado) return encontrado;
  }

  return productos[0] || null;
};

const getImagenPrincipalModelo = (productos) => {
  for (const producto of productos) {
    const urlModelo = resolverUrlImagen(
      producto?.modeloUrlImagen ||
      producto?.modelo?.urlImagen ||
      producto?.productoBase?.urlImagen ||
      producto?.imagenModeloUrl ||
      producto?.modeloImagenUrl ||
      ""
    );
    if (urlModelo) {
      return {
        url: urlModelo,
        altTexto: getTexto(producto?.modeloNombre, producto?.nombre_modelo, producto?.nombre, "Modelo")
      };
    }
  }

  return null;
};

const getImagenModelo = (productos) => getImagenPrincipalModelo(productos)
  || getImagenesProducto(productos[0] || {})[0] || null;

const construirModelos = (productos) => {
  const mapa = new Map();
  productos.forEach((producto) => {
    const key = getModeloKey(producto);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key).push(producto);
  });

  return Array.from(mapa.entries())
    .map(([key, lista]) => {
      const productosOrdenados = [...lista].sort(ordenarPorColor);
      return {
        key,
        ...getModeloInfo(productosOrdenados),
        productos: productosOrdenados,
        imagen: getImagenModelo(productosOrdenados),
        materiales: getOpcionesUnicas(productosOrdenados, "material"),
        niveles: getOpcionesUnicas(productosOrdenados, "nivel"),
        colores: listarColoresModelo(productosOrdenados)
      };
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { numeric: true, sensitivity: "base" }));
};

const construirSubfamilias = (productos) => {
  const mapa = new Map();
  productos.forEach((producto) => {
    const key = getSubfamiliaKey(producto);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key).push(producto);
  });

  return Array.from(mapa.entries())
    .map(([key, lista]) => {
      const modelos = construirModelos(lista);
      return {
        key,
        nombre: getSubfamiliaNombre(lista[0]),
        productos: lista,
        modelos,
        imagen: getImagenModelo(lista)
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }));
};

const construirFamilias = (productos) => {
  const mapa = new Map();
  productos.forEach((producto) => {
    const key = getFamiliaKey(producto);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key).push(producto);
  });

  return Array.from(mapa.entries())
    .map(([key, lista]) => {
      const modelos = construirModelos(lista);
      const subfamilias = construirSubfamilias(lista);
      return {
        key,
        nombre: getFamiliaNombre(lista[0]),
        productos: lista,
        modelos,
        subfamilias,
        imagen: getImagenModelo(lista)
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }));
};

async function generarPdfCompleto() {
  const activos = await cargarProductosCatalogo({
    activo: true,
    sortBy: "modeloNombre",
    direction: "asc"
  });
  const productosPdf = activos.map((producto) => ({
    id: getProductoId(producto),
    activo: Boolean(producto.activo),
    sku: getTexto(producto.sku),
    nombre: getTexto(producto.nombre, "Producto Mobilesco"),
    descripcion: getTexto(producto.descripcionCorta, producto.descripcion),
    linea: getTexto(producto.lineaNombre, producto.linea?.nombre, producto.modelo?.familia?.linea?.nombre),
    familia: getFamiliaNombre(producto),
    modeloId: producto.modeloId || producto.id_modelo || producto.modelo?.id,
    modelo: getTexto(producto.modeloNombre, producto.modelo?.nombre),
    modeloImagenUrl: resolverUrlImagen(producto.modeloUrlImagen || producto.modelo?.urlImagen || producto.productoBase?.urlImagen),
    imagenUrl: getImagenesProducto(producto)[0]?.url || "",
    colorId: producto.colorId || producto.id_color || producto.color?.id,
    colorNombre: getTexto(producto.colorNombre, producto.nombre_color, producto.color?.nombre),
    colorHex: producto.colorHex || producto.color?.hex || "",
  }));
  return descargarPdfCatalogo(productosPdf, {
    urlCatalogo: `${window.location.origin}/productos/catalogo`,
  });
}

const getLineaNombre = (producto) => getTexto(
  producto?.lineaNombre, producto?.linea?.nombre,
  producto?.modelo?.familia?.linea?.nombre, "Sin línea"
);

function CatalogoFamiliasPage() {
  const { familiaSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajePdf, setMensajePdf] = useState("");
  const [filtros, setFiltros] = usePersistedState("productos-catalogo:indice", FILTROS_DEFAULT);
  const busqueda = normalizar(filtros.busqueda);

  useEffect(() => {
    let vigente = true;
    cargarProductosCatalogo({ sortBy: "modeloNombre", direction: "asc" })
      .then((lista) => { if (vigente) setProductos(lista); })
      .catch((err) => { if (vigente) setError(err?.message || "No se pudo cargar el catálogo."); })
      .finally(() => { if (vigente) setLoading(false); });
    return () => { vigente = false; };
  }, []);

  const paginas = useMemo(() => organizarFamiliasCatalogo(
    productos
      .filter((producto) => !filtros.soloActivos || producto.activo)
      .map((producto) => ({
        ...producto,
        linea: getLineaNombre(producto),
        familia: getFamiliaNombre(producto),
      })),
    { incluirVacias: true }
  ), [filtros.soloActivos, productos]);
  const paginaActual = paginas.find((pagina) => pagina.slug === familiaSlug) || null;
  const coincideBusqueda = (producto) => !busqueda || normalizar([
    producto.nombre, producto.sku, producto.modeloNombre, getSubfamiliaNombre(producto),
    producto.materialNombre, producto.colorNombre, producto.familia, producto.linea,
  ].filter(Boolean).join(" ")).includes(busqueda);
  const paginasVisibles = paginas.filter((pagina) =>
    !busqueda || normalizar(pagina.titulo).includes(busqueda) || pagina.productos.some(coincideBusqueda)
  );
  const productosPagina = paginaActual?.productos.filter(coincideBusqueda) || [];
  const subfamilias = construirSubfamilias(productosPagina);
  const modelosPagina = construirModelos(productosPagina);
  const subfamiliaKey = searchParams.get("subfamilia") || "";
  const subfamiliasVisibles = subfamiliaKey
    ? subfamilias.filter((subfamilia) => subfamilia.key === subfamiliaKey)
    : subfamilias;

  const descargarCatalogo = async () => {
    setGenerandoPdf(true);
    setMensajePdf("Preparando el catálogo PDF...");
    try {
      const resultado = await generarPdfCompleto();
      setMensajePdf(`Catálogo descargado: ${resultado.paginas} páginas.${resultado.imagenesOmitidas ? ` ${resultado.imagenesOmitidas} imágenes no pudieron incluirse.` : ""}`);
    } catch (err) {
      setMensajePdf(err?.message || "No se pudo generar el catálogo PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <>
      <PageHeader
        title={paginaActual?.titulo || "Catálogo visual"}
        subtitle={paginaActual ? "Explora sus subfamilias y modelos para cotizar" : "Elige una familia para explorar sus modelos"}
        actions={<div className="producto-catalogo-header-actions">
          <button type="button" className="btn productos-brand-outline" disabled={generandoPdf} onClick={descargarCatalogo}>
            <i className="bi bi-file-earmark-pdf me-2"></i>{generandoPdf ? "Generando PDF..." : "Descargar catálogo PDF"}
          </button>
          <button type="button" className="btn productos-brand-outline" onClick={() => navigate("/productos")}>
            <i className="bi bi-table me-2"></i>Vista tabla
          </button>
        </div>}
      />
      <section className="producto-catalogo-editorial producto-catalogo-editorial-index">
        <div>
          <span>CATÁLOGO MOBILESCO / {paginaActual ? "FAMILIA" : "ÍNDICE"}</span>
          <h2>{paginaActual?.titulo || "Encuentra tu espacio"}</h2>
          <p>{paginaActual ? "Selecciona una subfamilia y descubre los modelos disponibles." : "Sillas, mesas, pupitres y más. Una página para cada familia."}</p>
        </div>
        <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
      </section>
      <div className="producto-catalogo-index-body">
        {familiaSlug && <button type="button" className="producto-catalogo-back" onClick={() => navigate("/productos/catalogo")}>
          <i className="bi bi-arrow-left"></i> Todas las familias
        </button>}
        <section className="producto-catalogo-toolbar" aria-label="Filtros del catálogo">
          <div className="producto-catalogo-search">
            <i className="bi bi-search"></i>
            <input type="search" aria-label="Buscar en el catálogo" value={filtros.busqueda}
              onChange={(event) => setFiltros((actual) => ({ ...actual, busqueda: event.target.value }))}
              placeholder="Buscar familia, subfamilia o modelo..." />
          </div>
          <select className="producto-catalogo-family-select" aria-label="Ir a familia"
            value={familiaSlug || ""} onChange={(event) => navigate(event.target.value
              ? `/productos/catalogo/familias/${event.target.value}` : "/productos/catalogo")}>
            <option value="">Todas las familias</option>
            {paginas.map((pagina) => <option key={pagina.slug} value={pagina.slug}>{pagina.titulo}</option>)}
          </select>
          <label className="producto-catalogo-toggle">
            <input type="checkbox" checked={filtros.soloActivos}
              onChange={(event) => setFiltros((actual) => ({ ...actual, soloActivos: event.target.checked }))} />
            <span>Solo activos</span>
          </label>
        </section>
        {mensajePdf && <div className="producto-catalogo-pdf-status" role="status">{mensajePdf}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {loading && <div className="producto-catalogo-empty">Cargando familias...</div>}
        {!loading && !error && !familiaSlug && <>
          <div className="producto-catalogo-section-heading">
            <span>EXPLORA POR FAMILIA</span>
            <h2>Índice del catálogo</h2>
            <p>Primero las colecciones más buscadas; después, las demás en orden alfabético.</p>
          </div>
          <div className="producto-catalogo-family-grid">
            {paginasVisibles.map((pagina, indice) => {
              const imagen = getImagenModelo(pagina.productos);
              const modelos = construirModelos(pagina.productos);
              return <button type="button" key={pagina.slug} className="producto-catalogo-family-card"
                onClick={() => navigate(`/productos/catalogo/familias/${pagina.slug}`)}>
                <span className="producto-catalogo-family-number">{String(indice + 1).padStart(2, "0")}</span>
                <span className="producto-catalogo-family-image">
                  {imagen?.url ? <img src={imagen.url} alt="" /> : <i className="bi bi-image" aria-hidden="true"></i>}
                </span>
                <span className="producto-catalogo-family-info">
                  <small>{pagina.linea}</small>
                  <strong>{pagina.titulo}</strong>
                  <em>{modelos.length ? `${modelos.length} modelo${modelos.length === 1 ? "" : "s"}` : "Sin modelos todavía"}</em>
                  <span>Ver familia <i className="bi bi-arrow-up-right"></i></span>
                </span>
              </button>;
            })}
          </div>
          {!paginasVisibles.length && <div className="producto-catalogo-empty">No hay familias que coincidan con la búsqueda.</div>}
        </>}
        {!loading && !error && familiaSlug && !paginaActual &&
          <div className="producto-catalogo-empty">Esta familia no existe en el catálogo.</div>}
        {!loading && !error && paginaActual && <>
          <div className="producto-catalogo-section-heading">
            <span>{paginaActual.linea.toUpperCase()} / {paginaActual.familia.toUpperCase()}</span>
            <h2>Modelos de {paginaActual.titulo}</h2>
            <p>{paginaActual.productos.length ? `${modelosPagina.length} modelo${modelosPagina.length === 1 ? "" : "s"} disponible${modelosPagina.length === 1 ? "" : "s"} en esta familia.` : "Todavía no hay productos en esta familia."}</p>
          </div>
          {subfamilias.length > 0 && <nav className="producto-catalogo-subfamily-tabs" aria-label="Subfamilias">
            <button type="button" className={!subfamiliaKey ? "is-active" : ""} onClick={() => setSearchParams({})}>Todas</button>
            {subfamilias.map((subfamilia) => <button type="button" key={subfamilia.key}
              className={subfamilia.key === subfamiliaKey ? "is-active" : ""}
              onClick={() => setSearchParams({ subfamilia: subfamilia.key })}>{subfamilia.nombre}</button>)}
          </nav>}
          {subfamiliasVisibles.map((subfamilia) => <section key={subfamilia.key} className="producto-catalogo-subfamily-section">
            <div className="producto-catalogo-subfamily-heading">
              <div><span>SUBFAMILIA</span><h3>{subfamilia.nombre}</h3></div>
              <small>{subfamilia.modelos.length} modelos</small>
            </div>
            <div className="producto-catalogo-model-grid">
              {subfamilia.modelos.map((modelo) => <article key={modelo.key} className="producto-catalogo-model-card">
                <div className="producto-catalogo-model-card-image">
                  {modelo.imagen?.url ? <img src={modelo.imagen.url} alt={modelo.modelo} /> : <i className="bi bi-image" aria-hidden="true"></i>}
                </div>
                <div className="producto-catalogo-model-card-info">
                  <small>{subfamilia.nombre}</small>
                  <h4>{modelo.modelo}</h4>
                  <p>{modelo.materiales.length} material{modelo.materiales.length === 1 ? "" : "es"} · {modelo.colores.length} color{modelo.colores.length === 1 ? "" : "es"}</p>
                  <div className="producto-catalogo-model-swatches" aria-label={`Colores de ${modelo.modelo}`}>
                    {modelo.colores.map((color) => <button type="button" key={color.key}
                      className="producto-catalogo-swatch" style={{ backgroundColor: color.hex }}
                      title={color.nombre} aria-label={`Ver ${modelo.modelo} en ${color.nombre}`}
                      onClick={() => navigate(`/productos/catalogo/${color.productoId}`)} />)}
                  </div>
                  <div>
                    <button type="button" onClick={() => navigate(`/productos/catalogo/${getProductoId(modelo.productos[0])}`)}>Ver modelo y cotizar</button>
                  </div>
                </div>
              </article>)}
            </div>
          </section>)}
          {!subfamiliasVisibles.length && <div className="producto-catalogo-empty">No hay modelos para mostrar en esta selección.</div>}
        </>}
      </div>
    </>
  );
}

function ProductoCatalogoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const puedeCotizar = hasPermission(user, "VIEW_QUOTES") && hasPermission(user, "ACTION_QUOTES_CREATE");
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajePdf, setMensajePdf] = useState("");
  const [errorPdf, setErrorPdf] = useState("");
  const [filtros, setFiltros] = usePersistedState("productos-catalogo:filtros", FILTROS_DEFAULT);
  const busquedaDebounced = useDebouncedValue(filtros.busqueda, 350);
  const [lineaSeleccionada, setLineaSeleccionada] = useState("");
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState("");
  const [subfamiliaSeleccionada, setSubfamiliaSeleccionada] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError("");
        const parametros = {
          busqueda: busquedaDebounced,
          activo: filtros.soloActivos ? true : undefined,
          sortBy: "modeloNombre",
          direction: "asc"
        };
        setProductos(await cargarProductosCatalogo(parametros));
      } catch (err) {
        setError(err?.message || "No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [busquedaDebounced, filtros.soloActivos]);

  const lineas = useMemo(() => {
    const mapa = new Map();
    productos.forEach((producto) => {
      const nombre = getTexto(producto?.lineaNombre, producto?.linea?.nombre, producto?.modelo?.familia?.linea?.nombre, "Sin línea");
      const key = normalizar(nombre || "sin-linea");
      if (!mapa.has(key)) mapa.set(key, { key, nombre, productos: 0, familias: new Set(), modelos: new Set() });
      const linea = mapa.get(key);
      linea.productos += 1;
      linea.familias.add(getFamiliaKey(producto));
      linea.subfamilias = linea.subfamilias || new Set();
      linea.subfamilias.add(getSubfamiliaKey(producto));
      linea.modelos.add(getModeloKey(producto));
    });
    return Array.from(mapa.values())
      .map((linea) => ({
        ...linea,
        familias: linea.familias.size,
        subfamilias: linea.subfamilias?.size || 0,
        modelos: linea.modelos.size
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }, [productos]);

  useEffect(() => {
    if (!lineas.length) {
      setLineaSeleccionada("");
      return;
    }
    const productoRuta = productos.find((producto) => String(getProductoId(producto)) === String(id));
    const lineaRuta = productoRuta
      ? normalizar(getTexto(productoRuta?.lineaNombre, productoRuta?.linea?.nombre, productoRuta?.modelo?.familia?.linea?.nombre, "Sin línea"))
      : "";
    setLineaSeleccionada((actual) => {
      if (lineaRuta && lineas.some((linea) => linea.key === lineaRuta)) return lineaRuta;
      if (lineas.some((linea) => linea.key === actual)) return actual;
      return lineas[0].key;
    });
  }, [id, lineas, productos]);

  const productosFiltrados = useMemo(
    () => productos.filter((producto) => {
      const linea = normalizar(getTexto(producto?.lineaNombre, producto?.linea?.nombre, producto?.modelo?.familia?.linea?.nombre, "Sin línea"));
      return !lineaSeleccionada || linea === lineaSeleccionada;
    }),
    [lineaSeleccionada, productos]
  );
  const familias = useMemo(() => construirFamilias(productosFiltrados), [productosFiltrados]);

  useEffect(() => {
    if (!familias.length) {
      setFamiliaSeleccionada("");
      return;
    }
    const productoRuta = productosFiltrados.find((producto) => String(getProductoId(producto)) === String(id));
    const familiaRuta = productoRuta ? getFamiliaKey(productoRuta) : "";
    setFamiliaSeleccionada((actual) => {
      if (familiaRuta && familias.some((familia) => familia.key === familiaRuta)) return familiaRuta;
      if (familias.some((familia) => familia.key === actual)) return actual;
      return familias[0].key;
    });
  }, [familias, id, productosFiltrados]);

  const familiaActual = useMemo(
    () => familias.find((familia) => familia.key === familiaSeleccionada) || null,
    [familiaSeleccionada, familias]
  );
  const productosFamilia = useMemo(() => familiaActual?.productos || [], [familiaActual]);
  const modelosFamilia = useMemo(() => construirModelos(productosFamilia), [productosFamilia]);
  const subfamilias = useMemo(() => familiaActual?.subfamilias || [], [familiaActual]);

  useEffect(() => {
    if (!subfamilias.length) {
      setSubfamiliaSeleccionada("");
      return;
    }
    const productoRuta = productosFamilia.find((producto) => String(getProductoId(producto)) === String(id));
    const subfamiliaRuta = productoRuta ? getSubfamiliaKey(productoRuta) : "";
    setSubfamiliaSeleccionada((actual) => {
      if (subfamiliaRuta && subfamilias.some((subfamilia) => subfamilia.key === subfamiliaRuta)) return subfamiliaRuta;
      if (subfamilias.some((subfamilia) => subfamilia.key === actual)) return actual;
      return subfamilias[0].key;
    });
  }, [id, productosFamilia, subfamilias]);

  const subfamiliaActual = useMemo(
    () => subfamilias.find((subfamilia) => subfamilia.key === subfamiliaSeleccionada) || null,
    [subfamiliaSeleccionada, subfamilias]
  );
  const productosSubfamilia = useMemo(() => subfamiliaActual?.productos || [], [subfamiliaActual]);
  const modelos = useMemo(() => subfamiliaActual?.modelos || [], [subfamiliaActual]);
  const productoSeleccionado = useMemo(() => {
    const porRuta = productosSubfamilia.find((producto) => String(getProductoId(producto)) === String(id));
    if (porRuta) return porRuta;
    return modelos[0]?.productos?.[0] || null;
  }, [id, modelos, productosSubfamilia]);

  const modeloSeleccionado = useMemo(() => {
    if (!productoSeleccionado) return null;
    const key = getModeloKey(productoSeleccionado);
    return modelos.find((modelo) => modelo.key === key) || null;
  }, [modelos, productoSeleccionado]);

  const paginaFamilia = productoSeleccionado ? organizarFamiliasCatalogo([{
    linea: getLineaNombre(productoSeleccionado), familia: getFamiliaNombre(productoSeleccionado)
  }])[0] : null;
  const modeloSeleccionadoKey = modeloSeleccionado?.key || "";
  const productosDelModelo = useMemo(() => modeloSeleccionado?.productos || [], [modeloSeleccionado]);
  const materialActual = getAtributo(productoSeleccionado, "material");
  const nivelActual = getAtributo(productoSeleccionado, "nivel");
  const colorActualData = getAtributo(productoSeleccionado, "color");
  const opcionesMaterial = modeloSeleccionado?.materiales || [];
  const opcionesNivel = getOpcionesUnicas(
    productosDelModelo.filter((producto) => coincideAtributo(producto, "material", materialActual.key)),
    "nivel"
  );
  const opcionesColor = getOpcionesUnicas(
    productosDelModelo.filter(
      (producto) =>
        coincideAtributo(producto, "material", materialActual.key) &&
        coincideAtributo(producto, "nivel", nivelActual.key)
    ),
    "color"
  );

  const imagenes = useMemo(() => {
    const principal = getImagenPrincipalModelo(productosDelModelo);
    return principal ? [principal] : getImagenesProducto(productoSeleccionado || {});
  }, [productoSeleccionado, productosDelModelo]);
  const imagenActual = imagenes[imagenSeleccionada] || imagenes[0] || null;

  useEffect(() => {
    setImagenSeleccionada(0);
  }, [productoSeleccionado?.id]);

  const cambiarProducto = (producto) => {
    const productoId = getProductoId(producto);
    if (productoId) navigate(`/productos/catalogo/${productoId}`);
  };

  const cambiarSubfamilia = (subfamilia) => {
    setSubfamiliaSeleccionada(subfamilia.key);
    const primerProducto = subfamilia.modelos[0]?.productos?.[0] || subfamilia.productos[0];
    if (primerProducto) cambiarProducto(primerProducto);
  };

  const cambiarSubfamiliaPorKey = (key) => {
    const subfamilia = subfamilias.find((item) => item.key === key);
    if (subfamilia) cambiarSubfamilia(subfamilia);
  };

  const cambiarModeloPorKey = (key) => {
    const modelo = modelos.find((item) => item.key === key);
    if (modelo?.productos?.[0]) cambiarProducto(modelo.productos[0]);
  };

  const cambiarAtributo = (tipo, key) => {
    const siguiente = buscarProductoCompatible(productosDelModelo, { [tipo]: key }, productoSeleccionado);
    if (siguiente) cambiarProducto(siguiente);
  };

  const navegarImagen = (direccion) => {
    if (imagenes.length <= 1) return;
    setImagenSeleccionada((actual) => {
      const siguiente = actual + direccion;
      if (siguiente < 0) return imagenes.length - 1;
      if (siguiente >= imagenes.length) return 0;
      return siguiente;
    });
  };

  const descargarCatalogo = async () => {
    setGenerandoPdf(true);
    setMensajePdf("Preparando el catálogo PDF con los productos activos...");
    setErrorPdf("");
    try {
      const resultado = await generarPdfCompleto();
      setMensajePdf(`Catálogo descargado: ${resultado.paginas} páginas.${resultado.imagenesOmitidas ? ` ${resultado.imagenesOmitidas} imágenes no pudieron incluirse.` : ""}`);
    } catch (err) {
      setMensajePdf("");
      setErrorPdf(err?.message || "No se pudo generar el catálogo PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  };

  const colorActual = colorActualData.nombre;
  const descripcion = getTexto(productoSeleccionado?.descripcion, "Sin descripcion capturada.");
  const sku = getTexto(productoSeleccionado?.sku, "-");

  return (
    <>
      <PageHeader
        title="Catalogo visual"
        subtitle="Explora por línea, familia y modelo; después elige material, nivel y color"
        actions={
          <div className="producto-catalogo-header-actions">
            <button type="button" className="btn productos-brand-outline" onClick={() => navigate("/productos/catalogo")}>
              <i className="bi bi-grid me-2"></i>Familias
            </button>
            <button type="button" className="btn productos-brand-outline" disabled={generandoPdf} onClick={descargarCatalogo}>
              <i className="bi bi-file-earmark-pdf me-2"></i>
              {generandoPdf ? "Generando PDF..." : "Descargar catálogo PDF"}
            </button>
            <button className="btn productos-brand-outline" onClick={() => navigate("/productos")}>
              <i className="bi bi-table me-2"></i>
              Vista tabla
            </button>
            {productoSeleccionado && puedeCotizar && (
              <button
                type="button"
                className="btn productos-brand-primary producto-catalogo-quote-btn"
                disabled={!productoSeleccionado.activo}
                onClick={() => navigate(`/cotizaciones/nueva?productoId=${encodeURIComponent(getProductoId(productoSeleccionado))}`)}
              >
                <i className="bi bi-receipt me-2"></i>
                Cotizar selección
              </button>
            )}
          </div>
        }
      />

      <section className="producto-catalogo-toolbar">
        <div className="producto-catalogo-search">
          <i className="bi bi-search"></i>
          <input
            type="search"
            value={filtros.busqueda}
            onChange={(event) => setFiltros((current) => ({ ...current, busqueda: event.target.value }))}
            placeholder="Buscar por SKU, modelo, familia, color o material..."
          />
        </div>
        <label className="producto-catalogo-toggle">
          <input
            type="checkbox"
            checked={filtros.soloActivos}
            onChange={(event) => setFiltros((current) => ({ ...current, soloActivos: event.target.checked }))}
          />
          <span>Solo activos</span>
        </label>
        <div className="producto-catalogo-count">
          {familias.length} familias / {subfamilias.length} subfamilias / {modelos.length} modelos / {productosSubfamilia.length} productos
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}
      {errorPdf && <div className="alert alert-danger" role="alert">{errorPdf}</div>}
      {mensajePdf && <div className="producto-catalogo-pdf-status" role="status">{mensajePdf}</div>}

      {!loading && !error && !productoSeleccionado && (
        <div className="producto-catalogo-empty">
          <i className="bi bi-box"></i>
          <span>No hay productos para mostrar con los filtros actuales.</span>
        </div>
      )}

      {!loading && !error && productoSeleccionado && (
        <>
        <button type="button" className="producto-catalogo-back producto-catalogo-detail-back"
          onClick={() => navigate(`/productos/catalogo/familias/${paginaFamilia.slug}`)}>
          <i className="bi bi-arrow-left"></i> Volver a {paginaFamilia.titulo}
        </button>
        <section className="producto-catalogo-editorial" aria-label="Colección actual">
          <div>
            <span>CATÁLOGO MOBILESCO / FAMILIA</span>
            <h2>{paginaFamilia?.titulo || "Nuestra colección"}</h2>
            <p>Explora cada modelo, elige la variante ideal y prepara tu cotización en línea.</p>
          </div>
          <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
        </section>
        <section className="producto-catalogo-overview" aria-label="Modelos de la colección">
          <div className="producto-catalogo-overview-heading">
            <div>
              <span>EXPLORA LA COLECCIÓN</span>
              <h3>Modelos de {paginaFamilia?.titulo || "Mobilesco"}</h3>
            </div>
            <small>{modelosFamilia.length} modelos disponibles</small>
          </div>
          <div className="producto-catalogo-overview-list">
            {modelosFamilia.map((modelo) => (
              <button
                key={modelo.key}
                type="button"
                className={modelo.key === modeloSeleccionadoKey ? "is-active" : ""}
                onClick={() => cambiarProducto(modelo.productos[0])}
              >
                {modelo.imagen?.url ? <img src={modelo.imagen.url} alt={modelo.modelo} /> : <span className="producto-catalogo-overview-fallback"><i className="bi bi-image"></i></span>}
                <span className="producto-catalogo-overview-caption">
                  <small>{modelo.familia || "Modelo Mobilesco"}</small>
                  <strong>{modelo.modelo}</strong>
                  <em>{modelo.colores.length} colores disponibles</em>
                  <span className="producto-catalogo-overview-swatches" aria-hidden="true">
                    {modelo.colores.map((color) => <span key={color.key} style={{ backgroundColor: color.hex }} />)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <div className="producto-catalogo-shell">
          <aside className="producto-catalogo-nav" aria-label="Navegación del catálogo">
            <div className="producto-catalogo-nav-heading">
              <span>Catálogo</span>
              <strong>{paginaFamilia?.titulo || "Sin familia"}</strong>
            </div>

            <div className="producto-catalogo-nav-selectors">
              <div className="producto-catalogo-nav-field">
                <label htmlFor="catalogo-subfamilia">Subfamilia</label>
                <select
                  id="catalogo-subfamilia"
                  value={subfamiliaSeleccionada}
                  onChange={(event) => cambiarSubfamiliaPorKey(event.target.value)}
                >
                  {subfamilias.map((subfamilia) => (
                    <option key={subfamilia.key} value={subfamilia.key}>
                      {subfamilia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="producto-catalogo-nav-field">
                <label htmlFor="catalogo-modelo">Modelo</label>
                <select id="catalogo-modelo" value={modeloSeleccionadoKey} onChange={(event) => cambiarModeloPorKey(event.target.value)}>
                  {modelos.map((modelo) => (
                    <option key={modelo.key} value={modelo.key}>
                      {modelo.modelo || modelo.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="producto-catalogo-nav-summary" aria-label="Resumen de selección">
              <div>
                <span>Familias</span>
                <strong>{familias.length}</strong>
              </div>
              <div>
                <span>Subfamilias</span>
                <strong>{subfamilias.length}</strong>
              </div>
              <div>
                <span>Modelos</span>
                <strong>{modelos.length}</strong>
              </div>
              <div>
                <span>Productos</span>
                <strong>{productosSubfamilia.length}</strong>
              </div>
            </div>
          </aside>

          <div className="producto-catalogo-content">
          <main className="producto-catalogo-detail">
            <section className="producto-catalogo-model-hero">
              {modeloSeleccionado?.imagen?.url ? (
                <img src={modeloSeleccionado.imagen.url} alt={modeloSeleccionado.titulo} />
              ) : (
                <span className="producto-catalogo-model-fallback">
                  {(modeloSeleccionado?.modelo || "M").charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <span>Modelo</span>
                <strong>{modeloSeleccionado?.modelo || "-"}</strong>
                <small>
                  {[modeloSeleccionado?.linea, modeloSeleccionado?.familia, modeloSeleccionado?.subfamilia].filter(Boolean).join(" - ") || "Sin clasificacion"}
                </small>
              </div>
              <div className="producto-catalogo-model-stats">
                <span>{productosDelModelo.length} productos</span>
                <span>{opcionesMaterial.length} materiales</span>
                <span>{modeloSeleccionado?.niveles?.length || 0} niveles</span>
                <span>{modeloSeleccionado?.colores?.length || 0} colores</span>
              </div>
            </section>

            <section className="producto-catalogo-gallery" aria-label="Galeria del producto">
              <div className="producto-catalogo-thumbs">
                {imagenes.length > 0 ? (
                  imagenes.map((imagen, index) => (
                    <button
                      key={`${imagen.id}-${index}`}
                      type="button"
                      className={index === imagenSeleccionada ? "is-active" : ""}
                      onClick={() => setImagenSeleccionada(index)}
                    >
                      <img src={imagen.url} alt={imagen.altTexto} />
                    </button>
                  ))
                ) : (
                  <div className="producto-catalogo-thumb-empty">
                    <i className="bi bi-image"></i>
                  </div>
                )}
              </div>

              <div className="producto-catalogo-stage">
                {imagenActual?.url ? (
                  <img src={imagenActual.url} alt={imagenActual.altTexto} />
                ) : (
                  <div className="producto-catalogo-image-empty">
                    <i className="bi bi-image"></i>
                    <span>Sin imagen</span>
                  </div>
                )}

                {imagenes.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="producto-catalogo-carousel-btn is-prev"
                      onClick={() => navegarImagen(-1)}
                      aria-label="Imagen anterior"
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      className="producto-catalogo-carousel-btn is-next"
                      onClick={() => navegarImagen(1)}
                      aria-label="Imagen siguiente"
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                    <span className="producto-catalogo-image-count">
                      {imagenSeleccionada + 1} / {imagenes.length}
                    </span>
                  </>
                )}
              </div>
            </section>

            <section className="producto-catalogo-info">
              <div className="producto-catalogo-store">
                <span className={productoSeleccionado?.activo ? "is-active" : "is-inactive"}>
                  {productoSeleccionado?.activo ? "Activo" : "Inactivo"}
                </span>
                <span>SKU {sku}</span>
              </div>

              <h1>{productoSeleccionado.nombre || modeloSeleccionado?.titulo || "Producto"}</h1>
              <p className="producto-catalogo-description">{descripcion}</p>

              <div className="producto-catalogo-meta">
                <div>
                  <span>Linea</span>
                  <strong>{modeloSeleccionado?.linea || "-"}</strong>
                </div>
                <div>
                  <span>Familia</span>
                  <strong>{modeloSeleccionado?.familia || "-"}</strong>
                </div>
                <div>
                  <span>Subfamilia</span>
                  <strong>{modeloSeleccionado?.subfamilia || "-"}</strong>
                </div>
                <div>
                  <span>Modelo</span>
                  <strong>{modeloSeleccionado?.modelo || "-"}</strong>
                </div>
                <div>
                  <span>Material</span>
                  <strong>{materialActual.nombre || "-"}</strong>
                </div>
                <div>
                  <span>Nivel</span>
                  <strong>{nivelActual.nombre || "-"}</strong>
                </div>
              </div>

              <div className="producto-catalogo-selector-panel">
                <div className="producto-catalogo-selector-title">
                  <span>Material:</span>
                  <strong>{materialActual.nombre}</strong>
                </div>
                <div className="producto-catalogo-choice-list">
                  {opcionesMaterial.map((material) => (
                    <button
                      key={material.key}
                      type="button"
                      className={material.key === materialActual.key ? "is-active" : ""}
                      onClick={() => cambiarAtributo("material", material.key)}
                    >
                      {material.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="producto-catalogo-selector-panel">
                <div className="producto-catalogo-selector-title">
                  <span>Nivel / tamano:</span>
                  <strong>{nivelActual.nombre}</strong>
                </div>
                <div className="producto-catalogo-choice-list">
                  {opcionesNivel.map((nivel) => (
                    <button
                      key={nivel.key}
                      type="button"
                      className={nivel.key === nivelActual.key ? "is-active" : ""}
                      onClick={() => cambiarAtributo("nivel", nivel.key)}
                    >
                      {nivel.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="producto-catalogo-selector-panel">
                <div className="producto-catalogo-selector-title">
                  <span>Color:</span>
                  <strong>{colorActual}</strong>
                </div>

                <div className="producto-catalogo-colors">
                  {opcionesColor.map((color) => {
                    const producto = buscarProductoCompatible(
                      productosDelModelo,
                      {
                        material: materialActual.key,
                        nivel: nivelActual.key,
                        color: color.key
                      },
                      productoSeleccionado
                    );
                    const productoId = getProductoId(producto);
                    const activo = productoId === getProductoId(productoSeleccionado);
                    return (
                      <button
                        key={color.key}
                        type="button"
                        className={activo ? "is-active" : ""}
                        title={color.nombre}
                        onClick={() => cambiarProducto(producto)}
                      >
                        <span style={{ background: getColorHex(producto) }} />
                        <small>{color.nombre}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="producto-catalogo-actions">
                {puedeCotizar && (
                  <button
                    type="button"
                    className="btn productos-brand-primary producto-catalogo-quote-btn"
                    disabled={!productoSeleccionado.activo}
                    onClick={() => navigate(`/cotizaciones/nueva?productoId=${encodeURIComponent(getProductoId(productoSeleccionado))}`)}
                  >
                    <i className="bi bi-receipt me-2"></i>
                    Cotizar este producto
                  </button>
                )}
                <button
                  type="button"
                  className="btn productos-brand-primary"
                  onClick={() => navigate(`/productos/${getProductoId(productoSeleccionado)}`)}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Editar producto
                </button>
              </div>
            </section>
          </main>
          </div>
        </div>
        </>
      )}
    </>
  );
}

export default function ProductoCatalogoPage() {
  const { id } = useParams();
  return id ? <ProductoCatalogoDetalle /> : <CatalogoFamiliasPage />;
}
