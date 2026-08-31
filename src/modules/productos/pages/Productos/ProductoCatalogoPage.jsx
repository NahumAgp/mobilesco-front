import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { API_BASE_URL } from "../../../../config/apiConfig";
import { obtenerProductos } from "../../services/productos";
import "./ProductoCatalogoPage.css";

const LOAD_SIZE = 100;
const FILTROS_DEFAULT = {
  busqueda: "",
  soloActivos: true
};

const COLOR_FALLBACKS = [
  { pattern: /blanco|white/i, value: "#f8fafc" },
  { pattern: /negro|black/i, value: "#111827" },
  { pattern: /gris|gray|grey/i, value: "#94a3b8" },
  { pattern: /marron|cafe|chocolate/i, value: "#8b5e3c" },
  { pattern: /marr[oó]n|cafe|caf[eé]|chocolate/i, value: "#8b5e3c" },
  { pattern: /claro|arena|beige|natural|roble/i, value: "#c8aa7a" },
  { pattern: /oscuro|nogal|wenge/i, value: "#5f432d" },
  { pattern: /azul|blue/i, value: "#2563eb" },
  { pattern: /verde|green/i, value: "#16a34a" },
  { pattern: /rosa|pink|magenta/i, value: "#ec4899" },
  { pattern: /rojo|red/i, value: "#dc2626" },
  { pattern: /amarillo|yellow/i, value: "#facc15" },
  { pattern: /naranja|orange/i, value: "#f97316" }
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

const getColorHex = (producto) => {
  const directo = producto?.colorHex || producto?.color?.hex || producto?.hexColor || "";
  if (/^#[0-9a-f]{3,8}$/i.test(directo)) return directo;

  const nombre = normalizar(getTexto(producto?.colorNombre, producto?.nombre_color, producto?.color?.nombre));
  const match = COLOR_FALLBACKS.find((item) => item.pattern.test(nombre));
  if (match) return match.value;

  const seed = normalizar(nombre)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = seed % 360;
  return `hsl(${hue}, 42%, 62%)`;
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

const getImagenModelo = (productos) => {
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

  return getImagenesProducto(productos[0] || {})[0] || null;
};

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
        colores: getOpcionesUnicas(productosOrdenados, "color")
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

export default function ProductoCatalogoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        const primeraPagina = await obtenerProductos({ ...parametros, page: 0, size: LOAD_SIZE });
        const totalPaginas = Math.max(Number(primeraPagina?.totalPages || 1), 1);
        const paginasRestantes = totalPaginas > 1
          ? await Promise.all(
              Array.from({ length: totalPaginas - 1 }, (_, index) =>
                obtenerProductos({ ...parametros, page: index + 1, size: LOAD_SIZE })
              )
            )
          : [];
        setProductos([
          ...getLista(primeraPagina),
          ...paginasRestantes.flatMap((pagina) => getLista(pagina))
        ]);
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

  const productosDelModelo = modeloSeleccionado?.productos || [];
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

  const imagenes = useMemo(() => getImagenesProducto(productoSeleccionado || {}), [productoSeleccionado]);
  const imagenActual = imagenes[imagenSeleccionada] || imagenes[0] || null;

  useEffect(() => {
    setImagenSeleccionada(0);
  }, [productoSeleccionado?.id]);

  const cambiarProducto = (producto) => {
    const productoId = getProductoId(producto);
    if (productoId) navigate(`/productos/catalogo/${productoId}`);
  };

  const cambiarLinea = (linea) => {
    setLineaSeleccionada(linea.key);
    const primerProducto = productos.find((producto) => {
      const nombreLinea = normalizar(getTexto(producto?.lineaNombre, producto?.linea?.nombre, producto?.modelo?.familia?.linea?.nombre, "Sin línea"));
      return nombreLinea === linea.key;
    });
    if (primerProducto) cambiarProducto(primerProducto);
  };

  const cambiarFamilia = (familia) => {
    setFamiliaSeleccionada(familia.key);
    const primerProducto = familia.subfamilias[0]?.modelos[0]?.productos?.[0] || familia.productos[0];
    if (primerProducto) cambiarProducto(primerProducto);
  };

  const cambiarSubfamilia = (subfamilia) => {
    setSubfamiliaSeleccionada(subfamilia.key);
    const primerProducto = subfamilia.modelos[0]?.productos?.[0] || subfamilia.productos[0];
    if (primerProducto) cambiarProducto(primerProducto);
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
            <button className="btn productos-brand-outline" onClick={() => navigate("/productos")}>
              <i className="bi bi-table me-2"></i>
              Vista tabla
            </button>
            {productoSeleccionado && (
              <button className="btn productos-brand-primary" onClick={() => navigate(`/productos/${productoSeleccionado.id}`)}>
                <i className="bi bi-pencil-square me-2"></i>
                Editar producto
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

      {!loading && !error && lineas.length > 0 && (
        <nav className="producto-catalogo-lineas" aria-label="Líneas del catálogo">
          <div className="producto-catalogo-lineas-title">
            <span>Catálogo por línea</span>
            <small>Selecciona una línea para consultar sus familias</small>
          </div>
          <div className="producto-catalogo-lineas-list">
            {lineas.map((linea) => (
              <button
                key={linea.key}
                type="button"
                className={linea.key === lineaSeleccionada ? "is-active" : ""}
                onClick={() => cambiarLinea(linea)}
              >
                <strong>{linea.nombre}</strong>
                <span>{linea.familias} familias</span>
                <small>{linea.subfamilias} subfamilias · {linea.modelos} modelos · {linea.productos} productos</small>
              </button>
            ))}
          </div>
        </nav>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && !productoSeleccionado && (
        <div className="producto-catalogo-empty">
          <i className="bi bi-box"></i>
          <span>No hay productos para mostrar con los filtros actuales.</span>
        </div>
      )}

      {!loading && !error && productoSeleccionado && (
        <>
        <div className="producto-catalogo-shell">
          <aside className="producto-catalogo-groups" aria-label="Familias de productos">
            <div className="producto-catalogo-groups-heading">
              <h2>Familias</h2>
              <span>{familias.length}</span>
            </div>
            <div className="producto-catalogo-group-list">
              {familias.map((familia) => {
                const activo = familia.key === familiaSeleccionada;
                return (
                  <button
                    key={familia.key}
                    type="button"
                    className={`producto-catalogo-group ${activo ? "is-active" : ""}`}
                    onClick={() => cambiarFamilia(familia)}
                  >
                    {familia.imagen?.url ? (
                      <img src={familia.imagen.url} alt={familia.nombre} />
                    ) : (
                      <span className="producto-catalogo-group-fallback">
                        {familia.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="producto-catalogo-group-copy">
                      <strong>{familia.nombre}</strong>
                      <small>{familia.modelos.length} modelos</small>
                      <small>{familia.subfamilias.length} subfamilias</small>
                      <span>
                        {familia.productos.length} productos
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="producto-catalogo-content">
            <section className="producto-catalogo-subfamilias" aria-label={`Subfamilias de ${familiaActual?.nombre || "la familia"}`}>
              <div className="producto-catalogo-subfamilias-heading">
                <div>
                  <span>Familia seleccionada</span>
                  <h2>{familiaActual?.nombre || "Sin familia"}</h2>
                </div>
                <small>{subfamilias.length} subfamilias · {familiaActual?.modelos?.length || 0} modelos · {productosFamilia.length} productos</small>
              </div>
              <div className="producto-catalogo-subfamilias-list">
                {subfamilias.map((subfamilia) => {
                  const activo = subfamilia.key === subfamiliaActual?.key;
                  return (
                    <button
                      key={subfamilia.key}
                      type="button"
                      className={activo ? "is-active" : ""}
                      onClick={() => cambiarSubfamilia(subfamilia)}
                    >
                      {subfamilia.imagen?.url ? (
                        <img src={subfamilia.imagen.url} alt={subfamilia.nombre} />
                      ) : (
                        <span className="producto-catalogo-subfamilia-fallback">
                          {subfamilia.nombre.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <strong>{subfamilia.nombre}</strong>
                        <small>{subfamilia.modelos.length} modelos · {subfamilia.productos.length} productos</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="producto-catalogo-modelos" aria-label={`Modelos de ${familiaActual?.nombre || "la familia"}`}>
              <div className="producto-catalogo-modelos-heading">
                <div>
                  <span>Subfamilia seleccionada</span>
                  <h2>{subfamiliaActual?.nombre || "Sin subfamilia"}</h2>
                </div>
                <small>{modelos.length} modelos · {productosSubfamilia.length} productos</small>
              </div>
              <div className="producto-catalogo-modelos-list">
                {modelos.map((modelo) => {
                  const activo = modelo.key === modeloSeleccionado?.key;
                  return (
                    <button
                      key={modelo.key}
                      type="button"
                      className={activo ? "is-active" : ""}
                      onClick={() => cambiarProducto(modelo.productos[0])}
                    >
                      {modelo.imagen?.url ? (
                        <img src={modelo.imagen.url} alt={modelo.titulo} />
                      ) : (
                        <span className="producto-catalogo-modelo-fallback">
                          {(modelo.modelo || modelo.titulo).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <strong>{modelo.modelo || modelo.titulo}</strong>
                        <small>{modelo.productos.length} productos</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

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
                    const miniImagen = getImagenesProducto(producto)[0]?.url;
                    return (
                      <button
                        key={color.key}
                        type="button"
                        className={activo ? "is-active" : ""}
                        title={color.nombre}
                        onClick={() => cambiarProducto(producto)}
                      >
                        {miniImagen ? (
                          <img src={miniImagen} alt={color.nombre} />
                        ) : (
                          <span style={{ background: getColorHex(producto) }} />
                        )}
                        <small>{color.nombre}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="producto-catalogo-actions">
                <button
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
