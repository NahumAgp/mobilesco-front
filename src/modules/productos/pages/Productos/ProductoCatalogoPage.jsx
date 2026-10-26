import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { API_BASE_URL } from "../../../../config/apiConfig";
import { getUser, hasPermission } from "../../../auth/services/authService.js";
import { obtenerProductoCotizable } from "../../../cotizaciones/services/cotizaciones.js";
import CatalogoCotizacionProvider from "./CatalogoCotizacionCart.jsx";
import { useCatalogoCotizacion } from "./catalogoCotizacionContext.js";
import {
  obtenerFamiliasActivasCatalogo,
  obtenerFichaCatalogoPublico,
  obtenerModelosCatalogoPublico,
  obtenerProductos
} from "../../services/productos";
import { organizarFamiliasCatalogo } from "../../utils/catalogoFamilias.js";
import { getColorHex, listarColoresModelo } from "../../utils/catalogoColores.js";
import { descargarPdfCatalogo } from "../../utils/catalogoPdf.js";
import "./ProductoCatalogoPage.css";

const LOAD_SIZE = 100;
const FILTROS_DEFAULT = {
  busqueda: ""
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

const cargarCatalogoYFamiliasActivas = async (parametros) => {
  const [productos, familiasActivas] = await Promise.all([
    cargarProductosCatalogo({ ...parametros, activo: true }),
    obtenerFamiliasActivasCatalogo().then(getLista)
  ]);
  const idsFamiliasActivas = new Set(familiasActivas.map((familia) => String(familia.id)));
  return {
    familiasActivas,
    productos: productos.filter((producto) => {
      const familiaId = producto.familiaId || producto.id_familia;
      return familiaId != null && idsFamiliasActivas.has(String(familiaId));
    })
  };
};

const cargarProductosFamiliaCatalogo = async (familia) => {
  const modelos = getLista(await obtenerModelosCatalogoPublico({ familiaId: familia.id }));
  const fichas = await Promise.all(modelos
    .filter((modelo) => modelo.modeloId != null)
    .map((modelo) => obtenerFichaCatalogoPublico(modelo.modeloId)));

  return fichas.flatMap((ficha) => (ficha.variantes || [])
    .filter((variante) => variante.activo !== false)
    .map((variante) => ({
      id: variante.productoId,
      productoId: variante.productoId,
      sku: variante.sku,
      nombre: [ficha.nombre, variante.nivelNombre, variante.colorNombre].filter(Boolean).join(" "),
      descripcion: ficha.descripcion || "",
      modeloId: ficha.modeloId,
      modeloNombre: ficha.nombre,
      modeloUrlImagen: ficha.urlImagenModelo,
      modelo: { id: ficha.modeloId, nombre: ficha.nombre, urlImagen: ficha.urlImagenModelo },
      familiaId: ficha.familiaId,
      familiaNombre: ficha.familiaNombre || familia.nombre,
      lineaNombre: familia.lineaNombre,
      subfamiliaId: ficha.subfamiliaId,
      subfamiliaNombre: ficha.subfamiliaNombre,
      colorId: variante.colorId,
      colorNombre: variante.colorNombre,
      colorHex: variante.colorHex,
      nivelId: variante.nivelId,
      nivelNombre: variante.nivelNombre,
      materialId: variante.materialId,
      materialNombre: variante.materialNombre,
      dimensiones: variante.dimensiones,
      ancho: variante.ancho,
      alto: variante.alto,
      fondo: variante.fondo,
      imagenPrincipalUrl: variante.imagenPrincipalUrl,
      activo: variante.activo !== false
    })));
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

const buscarProductoPorAtributo = (productos, tipo, key, actual) => {
  const otrosAtributos = ["material", "nivel", "color"].filter((otroTipo) => otroTipo !== tipo);
  return productos
    .filter((producto) => getAtributo(producto, tipo).key === key)
    .sort((a, b) => {
      const coincidenciasA = otrosAtributos.filter((otroTipo) =>
        getAtributo(a, otroTipo).key === getAtributo(actual, otroTipo).key
      ).length;
      const coincidenciasB = otrosAtributos.filter((otroTipo) =>
        getAtributo(b, otroTipo).key === getAtributo(actual, otroTipo).key
      ).length;
      return coincidenciasB - coincidenciasA;
    })[0] || null;
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
  const { productos: activos } = await cargarCatalogoYFamiliasActivas({
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
    nivelNombre: getTexto(producto.nivelNombre, producto.nombre_nivel, producto.nivel?.nombre),
    materialNombre: getTexto(producto.materialNombre, producto.nombre_material, producto.material?.nombre),
    colorId: producto.colorId || producto.id_color || producto.color?.id,
    colorNombre: getTexto(producto.colorNombre, producto.nombre_color, producto.color?.nombre),
    colorHex: producto.colorHex || producto.color?.hex || "",
  }));
  return descargarPdfCatalogo(productosPdf, {
    urlCatalogo: "mobilesco.com.mx",
  });
}

const getLineaNombre = (producto) => getTexto(
  producto?.lineaNombre, producto?.linea?.nombre,
  producto?.modelo?.familia?.linea?.nombre, "Sin línea"
);

const UTILIDADES_CATALOGO = [40, 50, 60, 80];
const monedaCatalogo = (cantidad) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 2
}).format(Number(cantidad || 0));

function CatalogoAgregarModal({ modelo, initialProduct, onClose, onAdd, validandoIds }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState(initialProduct || modelo?.productos?.[0] || null);
  const [cantidad, setCantidad] = useState("0");
  const [errorCantidad, setErrorCantidad] = useState("");
  const [utilidadManual, setUtilidadManual] = useState("");
  const [costo, setCosto] = useState(null);
  const [cargandoCosto, setCargandoCosto] = useState(false);
  const [errorCosto, setErrorCosto] = useState("");
  const [errorAgregar, setErrorAgregar] = useState("");
  const [agregando, setAgregando] = useState(false);
  const productos = modelo?.productos || [];
  const productoId = getProductoId(productoSeleccionado);
  const imagen = getImagenesProducto(productoSeleccionado || {})[0] || modelo?.imagen || null;
  const opciones = useMemo(() => Object.fromEntries(["material", "nivel", "color"].map((tipo) => {
    const otrosAtributos = ["material", "nivel", "color"].filter((otroTipo) => otroTipo !== tipo);
    const compatibles = productos.filter((producto) => otrosAtributos.every((otroTipo) =>
      getAtributo(producto, otroTipo).key === getAtributo(productoSeleccionado, otroTipo).key
    ));
    return [tipo, getOpcionesUnicas(compatibles, tipo)];
  })), [productos, productoSeleccionado]);
  const porcentajeManual = Number(utilidadManual);
  const puedeAgregarManual = Number.isFinite(porcentajeManual) && porcentajeManual > 0 && porcentajeManual <= 95;
  const cantidadNumerica = /^([1-9]\d{0,3})$/.test(cantidad) ? Number(cantidad) : 0;
  const costoTotal = Number(costo?.costoTotal || 0);
  const cotizable = Boolean(costo?.cotizable) && Number.isFinite(costoTotal) && costoTotal > 0;

  useEffect(() => {
    if (!productoId) return undefined;
    let vigente = true;
    setCosto(null);
    setErrorCosto("");
    setCargandoCosto(true);
    obtenerProductoCotizable(productoId)
      .then((resultado) => {
        if (!vigente) return;
        setCosto(resultado);
        if (!resultado?.cotizable || !(Number(resultado?.costoTotal) > 0)) {
          const faltantes = resultado?.faltantes?.filter(Boolean).join(", ");
          setErrorCosto(faltantes || "Este producto todavía no tiene costos completos para cotizar.");
        }
      })
      .catch((error) => {
        if (vigente) setErrorCosto(error?.message || "No se pudieron validar los costos de este producto.");
      })
      .finally(() => { if (vigente) setCargandoCosto(false); });
    return () => { vigente = false; };
  }, [productoId]);

  useEffect(() => {
    const cerrarConEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  const cambiarAtributo = (tipo, key) => {
    const siguiente = buscarProductoPorAtributo(productos, tipo, key, productoSeleccionado);
    if (siguiente) {
      setProductoSeleccionado(siguiente);
      setErrorAgregar("");
    }
  };

  const agregarConUtilidad = async (utilidad) => {
    if (!cotizable || agregando || validandoIds.has(String(productoId))) return;
    if (!cantidadNumerica || cantidadNumerica > 9999) {
      setErrorCantidad("Escribe una cantidad entera entre 1 y 9,999 piezas.");
      return;
    }
    setAgregando(true);
    setErrorAgregar("");
    setErrorCantidad("");
    const agregado = await onAdd(productoSeleccionado, utilidad, cantidadNumerica);
    setAgregando(false);
    if (agregado) onClose();
    else setErrorAgregar("No se pudo agregar. Revisa que el producto siga activo y tenga costos completos.");
  };

  if (!modelo) return null;
  return <div className="catalogo-add-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="catalogo-add-modal" role="dialog" aria-modal="true" aria-labelledby="catalogo-add-title">
      <header className="catalogo-add-heading">
        <div><span>CONFIGURA TU PRODUCTO</span><h2 id="catalogo-add-title">{modelo.modelo || modelo.titulo}</h2></div>
        <button type="button" className="catalogo-add-close" aria-label="Cerrar selector" onClick={onClose}>
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>
      <div className="catalogo-add-content">
        <div className="catalogo-add-product">
          <div className="catalogo-add-image">
            {imagen?.url ? <img src={imagen.url} alt={imagen.altTexto || modelo.modelo} /> : <i className="bi bi-image" aria-hidden="true"></i>}
          </div>
          <div className="catalogo-add-product-details">
            <div className="catalogo-add-product-info">
              <small>{getTexto(productoSeleccionado?.sku, "MODELO MOBILESCO")}</small>
              <h3>{getTexto(productoSeleccionado?.nombre, modelo.modelo)}</h3>
              <p>{getTexto(productoSeleccionado?.descripcionCorta, productoSeleccionado?.descripcion, "Selecciona las características de tu producto.")}</p>
              <span>{[getAtributo(productoSeleccionado, "material").nombre, getAtributo(productoSeleccionado, "nivel").nombre, getAtributo(productoSeleccionado, "color").nombre].filter((item) => item && !item.startsWith("Sin ")).join(" · ")}</span>
            </div>

            <div className="catalogo-add-options" aria-label="Características del producto">
              {["color", "nivel", "material"].map((tipo) => <fieldset key={tipo}>
                <legend>{tipo === "nivel" ? "Nivel / tamaño" : tipo === "material" ? "Material" : `Color · ${getAtributo(productoSeleccionado, "color").nombre}`}</legend>
                <div className={tipo === "color" ? "catalogo-add-chips is-colors" : "catalogo-add-chips is-attributes"}>
                  {opciones[tipo].map((opcion) => {
                    const actual = getAtributo(productoSeleccionado, tipo);
                    const activo = opcion.key === actual.key;
                    return <button key={opcion.key} type="button" className={activo ? "is-selected" : ""}
                      aria-label={`${tipo === "color" ? "Color" : tipo === "nivel" ? "Nivel o tamaño" : "Material"}: ${opcion.nombre}`}
                      title={opcion.nombre} aria-pressed={activo} onClick={() => cambiarAtributo(tipo, opcion.key)}>
                      {tipo === "color"
                        ? <span style={{ backgroundColor: getColorHex(productos.find((item) => getAtributo(item, "color").key === opcion.key)) }} aria-hidden="true" />
                        : opcion.nombre}
                    </button>;
                  })}
                </div>
              </fieldset>)}
            </div>

            <div className="catalogo-add-quantity">
              <label htmlFor="catalogo-add-quantity-input"><span>CANTIDAD</span><strong>¿Cuántas piezas necesitas?</strong></label>
              <div className="catalogo-add-quantity-entry">
                <button type="button" className="catalogo-add-quantity-step" aria-label="Disminuir cantidad"
                  disabled={(Number.parseInt(cantidad, 10) || 0) <= 0}
                  onClick={() => { setCantidad(String(Math.max(0, (Number.parseInt(cantidad, 10) || 0) - 1))); setErrorCantidad(""); }}>
                  <i className="bi bi-dash" aria-hidden="true"></i>
                </button>
                <input id="catalogo-add-quantity-input" type="text" inputMode="numeric" pattern="[0-9]*"
                  maxLength={4} autoComplete="off" aria-label="Cantidad de unidades" aria-invalid={Boolean(errorCantidad)}
                  aria-describedby={errorCantidad ? "catalogo-add-quantity-error" : undefined}
                  className={errorCantidad ? "is-invalid" : ""} value={cantidad}
                  onChange={(event) => {
                    const valor = event.target.value.replace(/\D/g, "").slice(0, 4).replace(/^0+(?=\d)/, "");
                    setCantidad(valor);
                    setErrorCantidad("");
                  }} />
                <button type="button" className="catalogo-add-quantity-step" aria-label="Aumentar cantidad"
                  disabled={(Number.parseInt(cantidad, 10) || 0) >= 9999}
                  onClick={() => { setCantidad(String(Math.min(9999, (Number.parseInt(cantidad, 10) || 0) + 1))); setErrorCantidad(""); }}>
                  <i className="bi bi-plus" aria-hidden="true"></i>
                </button>
                <span>piezas</span>
                {errorCantidad && <small id="catalogo-add-quantity-error" role="alert">{errorCantidad}</small>}
              </div>
            </div>
          </div>
        </div>

        <section className="catalogo-add-utilities" aria-label="Opciones de utilidad">
          <div className="catalogo-add-utility-heading"><div><span>PRECIO DE VENTA ESTIMADO</span><h3>Elige la utilidad</h3></div>
            {cotizable && <strong>Costo {monedaCatalogo(costoTotal)}</strong>}
          </div>
          {cargandoCosto && <div className="catalogo-add-cost-state"><span className="catalogo-cart-spinner" />Validando costos del producto...</div>}
          {!cargandoCosto && errorCosto && <div className="catalogo-add-cost-error" role="alert">
            <i className="bi bi-exclamation-circle" aria-hidden="true"></i><span>{errorCosto}</span>
          </div>}
          {!cargandoCosto && cotizable && <>
            <div className="catalogo-add-utility-grid">
              {UTILIDADES_CATALOGO.map((utilidad) => <article className="catalogo-add-utility" key={utilidad}>
                <span>{utilidad}%</span><small>Utilidad</small>
                <strong>{monedaCatalogo(costoTotal * (1 + utilidad / 100))}</strong>
                <button type="button" disabled={agregando || validandoIds.has(String(productoId))}
                  onClick={() => agregarConUtilidad(utilidad)}>
                  {agregando || validandoIds.has(String(productoId)) ? "Validando..." : "Agregar"}
                </button>
              </article>)}
              <article className="catalogo-add-utility is-manual">
                <label htmlFor="catalogo-add-manual">Utilidad manual</label>
                <div><input id="catalogo-add-manual" type="number" min="0.01" max="95" step="0.01"
                  value={utilidadManual} onChange={(event) => setUtilidadManual(event.target.value)} placeholder="Ej. 72.5" /><span>%</span></div>
                <strong>{puedeAgregarManual ? monedaCatalogo(costoTotal * (1 + porcentajeManual / 100)) : "Captura un porcentaje"}</strong>
                <button type="button" disabled={!puedeAgregarManual || agregando || validandoIds.has(String(productoId))}
                  onClick={() => agregarConUtilidad(porcentajeManual)}>
                  {agregando || validandoIds.has(String(productoId)) ? "Validando..." : "Agregar"}
                </button>
              </article>
            </div>
          </>}
          {errorAgregar && <div className="catalogo-add-cost-error" role="alert">{errorAgregar}</div>}
        </section>
      </div>
    </section>
  </div>;
}

function CatalogoFamiliasPage() {
  const { familiaSlug } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [familiaProductosId, setFamiliaProductosId] = useState(null);
  const [familiasActivas, setFamiliasActivas] = useState([]);
  const [familiasCargadas, setFamiliasCargadas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [mensajePdf, setMensajePdf] = useState("");
  const [modeloParaAgregar, setModeloParaAgregar] = useState(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false);
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [filtros, setFiltros] = usePersistedState("productos-catalogo:indice", FILTROS_DEFAULT);
  const cacheFamiliasRef = useRef(new Map());
  const { agregar, validandoIds } = useCatalogoCotizacion();
  const puedeCotizar = hasPermission(getUser(), "VIEW_QUOTES") && hasPermission(getUser(), "ACTION_QUOTES_CREATE");
  const busqueda = normalizar(filtros.busqueda);
  const busquedaGlobalDebounced = useDebouncedValue(filtros.busqueda.trim(), 350);

  useEffect(() => {
    let vigente = true;
    obtenerFamiliasActivasCatalogo()
      .then(getLista)
      .then((activas) => { if (vigente) setFamiliasActivas(activas); })
      .catch((err) => { if (vigente) setError(err?.message || "No se pudo cargar el índice del catálogo."); })
      .finally(() => { if (vigente) setFamiliasCargadas(true); });
    return () => { vigente = false; };
  }, []);

  const paginas = useMemo(() => organizarFamiliasCatalogo(
    [],
    { incluirVacias: true, familiasActivas }
  ).map((pagina) => {
    const familia = familiasActivas.find((item) =>
      normalizar(item.nombre) === normalizar(pagina.familia)
      && normalizar(item.lineaNombre) === normalizar(pagina.linea)
    );
    return { ...pagina, familiaId: familia?.id };
  }), [familiasActivas]);
  const paginaCatalogo = paginas.find((pagina) => pagina.slug === familiaSlug) || (!familiaSlug ? paginas[0] : null);
  const productosDePagina = String(familiaProductosId) === String(paginaCatalogo?.familiaId) ? productos : [];
  const paginaActual = paginaCatalogo ? { ...paginaCatalogo, productos: productosDePagina } : null;
  const cargandoPagina = loading || Boolean(paginaCatalogo?.familiaId
    && String(familiaProductosId) !== String(paginaCatalogo.familiaId) && !error);
  const indicePaginaActual = paginaActual ? paginas.findIndex((pagina) => pagina.slug === paginaActual.slug) : -1;
  const paginaAnterior = indicePaginaActual > 0 ? paginas[indicePaginaActual - 1] : null;
  const paginaSiguiente = indicePaginaActual >= 0 && indicePaginaActual < paginas.length - 1
    ? paginas[indicePaginaActual + 1]
    : null;
  const coincideBusqueda = (producto) => !busqueda || normalizar([
    producto.nombre, producto.sku, producto.modeloNombre, getSubfamiliaNombre(producto),
    producto.materialNombre, producto.colorNombre, producto.nivelNombre,
    producto.familiaNombre, producto.lineaNombre, producto.familia, producto.linea,
  ].filter(Boolean).join(" ")).includes(busqueda);
  const productosPagina = paginaActual?.productos.filter(coincideBusqueda) || [];
  const subfamilias = construirSubfamilias(productosPagina);

  useEffect(() => {
    const termino = busquedaGlobalDebounced.trim();
    if (termino.length < 2 || !familiasCargadas) {
      setResultadosBusqueda([]);
      setBuscandoCatalogo(false);
      return undefined;
    }

    let vigente = true;
    const idsFamiliasActivas = new Set(familiasActivas.map((familia) => String(familia.id)));
    setBuscandoCatalogo(true);
    cargarProductosCatalogo({ activo: true, busqueda: termino, sortBy: "sku", direction: "asc" })
      .then((lista) => {
        if (!vigente) return;
        const terminoNormalizado = normalizar(termino);
        const resultados = lista
          .filter((producto) => idsFamiliasActivas.has(String(producto.familiaId || producto.id_familia)))
          .map((producto) => {
            const sku = normalizar(producto.sku);
            const modelo = normalizar(getTexto(producto.modeloNombre, producto.nombre_modelo, producto.nombre));
            const familia = normalizar(getTexto(producto.familiaNombre, producto.familia?.nombre));
            const linea = normalizar(getTexto(producto.lineaNombre, producto.linea?.nombre));
            const camposPrincipales = [sku, modelo, familia, linea];
            const relevancia = camposPrincipales.some((campo) => campo.startsWith(terminoNormalizado))
              ? 0
              : camposPrincipales.some((campo) => campo.includes(terminoNormalizado)) ? 1 : 2;
            return { producto, relevancia };
          })
          .sort((a, b) => a.relevancia - b.relevancia
            || getTexto(a.producto.sku).localeCompare(getTexto(b.producto.sku), "es", { numeric: true, sensitivity: "base" }))
          .slice(0, 8)
          .map(({ producto }) => producto);
        setResultadosBusqueda(resultados);
      })
      .catch(() => { if (vigente) setResultadosBusqueda([]); })
      .finally(() => { if (vigente) setBuscandoCatalogo(false); });

    return () => { vigente = false; };
  }, [busquedaGlobalDebounced, familiasActivas, familiasCargadas]);

  const abrirResultadoBusqueda = (producto) => {
    const pagina = paginas.find((item) => String(item.familiaId) === String(producto.familiaId || producto.id_familia));
    if (!pagina) return;
    setBusquedaAbierta(false);
    navigate(`/productos/catalogo/familias/${pagina.slug}`);
  };

  useEffect(() => {
    if (familiasCargadas && !familiaSlug && paginas.length) {
      navigate(`/productos/catalogo/familias/${paginas[0].slug}`, { replace: true });
    }
  }, [familiaSlug, familiasCargadas, navigate, paginas]);

  useEffect(() => {
    if (!familiasCargadas) return undefined;
    if (!familiaSlug) {
      setLoading(false);
      return undefined;
    }

    const pagina = paginas.find((item) => item.slug === familiaSlug);
    if (!pagina?.familiaId) {
      setProductos([]);
      setFamiliaProductosId(null);
      setLoading(false);
      return undefined;
    }

    const cacheKey = String(pagina.familiaId);
    const productosEnCache = cacheFamiliasRef.current.get(cacheKey);
    if (Array.isArray(productosEnCache)) {
      setProductos(productosEnCache);
      setFamiliaProductosId(pagina.familiaId);
      setError("");
      setLoading(false);
      return undefined;
    }

    let vigente = true;
    setLoading(true);
    setError("");
    setProductos([]);
    let solicitud = productosEnCache;
    if (!solicitud) {
      solicitud = cargarProductosFamiliaCatalogo({
        id: pagina.familiaId,
        nombre: pagina.familia,
        lineaNombre: pagina.linea
      });
      cacheFamiliasRef.current.set(cacheKey, solicitud);
    }

    solicitud
      .then((lista) => {
        cacheFamiliasRef.current.set(cacheKey, lista);
        if (vigente) {
          setProductos(lista);
          setFamiliaProductosId(pagina.familiaId);
        }
      })
      .catch((err) => {
        if (cacheFamiliasRef.current.get(cacheKey) === solicitud) cacheFamiliasRef.current.delete(cacheKey);
        if (vigente) setError(err?.message || "No se pudo cargar esta familia del catálogo.");
      })
      .finally(() => { if (vigente) setLoading(false); });

    return () => { vigente = false; };
  }, [familiaSlug, familiasActivas, familiasCargadas, paginas]);

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
        subtitle={paginaActual ? `Página ${String(indicePaginaActual + 1).padStart(2, "0")} · Explora sus modelos` : "Explora nuestras familias de muebles"}
        actions={<div className="producto-catalogo-header-actions">
          <button type="button" className="btn productos-brand-outline" disabled={generandoPdf} onClick={descargarCatalogo}>
            <i className="bi bi-file-earmark-pdf me-2"></i>{generandoPdf ? "Generando PDF..." : "Descargar catálogo PDF"}
          </button>
          <button type="button" className="btn productos-brand-outline" onClick={() => navigate("/productos")}>
            <i className="bi bi-table me-2"></i>Vista tabla
          </button>
        </div>}
      />
      <div className="producto-catalogo-index-body">
        <section className="producto-catalogo-toolbar" aria-label="Búsqueda general e índice del catálogo">
          <div className="producto-catalogo-search">
            <i className="bi bi-search"></i>
            <input type="search" aria-label="Buscar en el catálogo" value={filtros.busqueda}
              onFocus={() => setBusquedaAbierta(true)}
              onBlur={() => setBusquedaAbierta(false)}
              onKeyDown={(event) => { if (event.key === "Escape") setBusquedaAbierta(false); }}
              onChange={(event) => setFiltros((actual) => ({ ...actual, busqueda: event.target.value }))}
              placeholder="Buscar en todo el catálogo: modelo, SKU, familia, color..." />
            {filtros.busqueda && <button type="button" className="producto-catalogo-search-clear"
              aria-label="Limpiar búsqueda" onClick={() => setFiltros((actual) => ({ ...actual, busqueda: "" }))}>
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>}
            {busquedaAbierta && busquedaGlobalDebounced.trim().length >= 2 && <div className="producto-catalogo-search-results" role="listbox" aria-label="Resultados de todo el catálogo">
              {buscandoCatalogo && <div className="producto-catalogo-search-message"><span className="catalogo-cart-spinner" />Buscando en todo el catálogo...</div>}
              {!buscandoCatalogo && resultadosBusqueda.map((producto) => <button type="button" role="option" key={getProductoId(producto)}
                className="producto-catalogo-search-result" onMouseDown={(event) => event.preventDefault()}
                onClick={() => abrirResultadoBusqueda(producto)}>
                <span className="producto-catalogo-search-result-copy">
                  <strong>{getTexto(producto.modeloNombre, producto.nombre_modelo, producto.nombre, producto.sku)}</strong>
                  <small>{[producto.sku, producto.colorNombre || producto.nombre_color, producto.nivelNombre || producto.nombre_nivel, producto.materialNombre || producto.nombre_material].filter(Boolean).join(" · ")}</small>
                </span>
                <span className="producto-catalogo-search-result-family">{getTexto(producto.familiaNombre, producto.familia?.nombre, "Catálogo")}</span>
              </button>)}
              {!buscandoCatalogo && !resultadosBusqueda.length && <div className="producto-catalogo-search-message">No encontramos coincidencias activas en el catálogo.</div>}
            </div>}
          </div>
          <div className="producto-catalogo-index-picker">
            <i className="bi bi-list-nested" aria-hidden="true"></i>
            <label htmlFor="producto-catalogo-index-select">Índice rápido</label>
            <select id="producto-catalogo-index-select" className="producto-catalogo-family-select" aria-label="Ir a familia"
              value={paginaActual?.slug || ""} onChange={(event) => navigate(`/productos/catalogo/familias/${event.target.value}`)}>
              {paginas.map((pagina, indice) => <option key={pagina.slug} value={pagina.slug}>
                {String(indice + 1).padStart(2, "0")} · {pagina.titulo}
              </option>)}
            </select>
            <i className="bi bi-chevron-down producto-catalogo-index-chevron" aria-hidden="true"></i>
          </div>
        </section>
        <section className="producto-catalogo-editorial producto-catalogo-editorial-index">
          <div>
            <span>CATÁLOGO MOBILESCO / PÁGINA {String(Math.max(indicePaginaActual + 1, 1)).padStart(2, "0")}</span>
            <h2>{paginaActual?.titulo || "Encuentra tu espacio"}</h2>
            <p>{paginaActual ? "Explora los modelos de esta familia. Usa las flechas laterales para pasar de página." : "Sillas, mesas, pupitres y más. Una página para cada familia."}</p>
          </div>
          <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
        </section>
        {mensajePdf && <div className="producto-catalogo-pdf-status" role="status">{mensajePdf}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {cargandoPagina && <div className="producto-catalogo-empty">Cargando esta familia...</div>}
        {!cargandoPagina && !error && familiaSlug && !paginaActual &&
          <div className="producto-catalogo-empty">Esta familia no existe en el catálogo.</div>}
        {!cargandoPagina && !error && paginaActual && <>
          {subfamilias.map((subfamilia) => <section key={subfamilia.key} className="producto-catalogo-subfamily-section">
            <div className="producto-catalogo-subfamily-heading">
              <div><span>SUBFAMILIA</span><h3>{subfamilia.nombre}</h3></div>
              <small>{subfamilia.modelos.length} modelos</small>
            </div>
            <div className="producto-catalogo-model-grid">
              {subfamilia.modelos.map((modelo) => {
                const productoCarrito = modelo.productos[0];
                const imagenTarjeta = getImagenesProducto(productoCarrito)[0] || modelo.imagen;
                const productoIdCarrito = getProductoId(productoCarrito);
                const agregando = validandoIds.has(String(productoIdCarrito));
                return <article key={modelo.key} className="producto-catalogo-model-card">
                <div className="producto-catalogo-model-card-image">
                  {imagenTarjeta?.url ? <img src={imagenTarjeta.url} alt={modelo.modelo} loading="lazy" /> : <i className="bi bi-image" aria-hidden="true"></i>}
                </div>
                <div className="producto-catalogo-model-card-info">
                  <h4>{modelo.modelo}</h4>
                  <div className="producto-catalogo-model-options" aria-label={`Variantes disponibles de ${modelo.modelo}`}>
                    <div className="producto-catalogo-model-option">
                      <span className="producto-catalogo-model-option-label">Colores</span>
                      <div className="producto-catalogo-model-option-values producto-catalogo-model-color-values">
                        {modelo.colores.map((color) => <span className="producto-catalogo-model-color" key={color.key}
                          title={color.nombre} aria-label={color.nombre}>
                          <i aria-hidden="true" style={{ backgroundColor: color.hex }}></i>
                        </span>)}
                      </div>
                    </div>
                    <div className="producto-catalogo-model-option">
                      <span className="producto-catalogo-model-option-label">Tamaños / niveles</span>
                      <div className="producto-catalogo-model-option-values">
                        {modelo.niveles.length ? modelo.niveles.map((nivel) => <span className="producto-catalogo-model-chip" key={nivel.key}>{nivel.nombre}</span>) : <span className="producto-catalogo-model-option-empty">Sin opciones</span>}
                      </div>
                    </div>
                  </div>
                  {puedeCotizar && <button type="button" className="producto-catalogo-add-cart"
                    disabled={!productoCarrito?.activo || !productoIdCarrito || agregando}
                    onClick={() => setModeloParaAgregar(modelo)}>
                    <i className={`bi ${agregando ? "bi-hourglass-split" : "bi-bag-plus"}`} aria-hidden="true"></i>
                    {agregando ? "Validando costos..." : "Agregar"}
                  </button>}
                </div>
              </article>;
              })}
            </div>
          </section>)}
          {!subfamilias.length && <div className="producto-catalogo-empty">No hay modelos coincidentes en esta familia.</div>}
        </>}
      </div>
      {!cargandoPagina && !error && paginaActual && <nav className="producto-catalogo-page-turns" aria-label="Navegación por páginas del catálogo">
        <button type="button" className="producto-catalogo-page-turn is-previous" disabled={!paginaAnterior}
          aria-label={paginaAnterior ? `Sección anterior: ${paginaAnterior.titulo}` : "Primera sección"}
          onClick={() => paginaAnterior && navigate(`/productos/catalogo/familias/${paginaAnterior.slug}`)}>
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
          <span><small>Anterior</small><strong>{paginaAnterior?.titulo || "Inicio"}</strong></span>
        </button>
        <span className="producto-catalogo-page-count" aria-live="polite">
          {String(indicePaginaActual + 1).padStart(2, "0")} <i>/</i> {String(paginas.length).padStart(2, "0")}
        </span>
        <button type="button" className="producto-catalogo-page-turn is-next" disabled={!paginaSiguiente}
          aria-label={paginaSiguiente ? `Sección siguiente: ${paginaSiguiente.titulo}` : "Última sección"}
          onClick={() => paginaSiguiente && navigate(`/productos/catalogo/familias/${paginaSiguiente.slug}`)}>
          <span><small>Siguiente</small><strong>{paginaSiguiente?.titulo || "Fin"}</strong></span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </button>
      </nav>}
      {puedeCotizar && modeloParaAgregar && <CatalogoAgregarModal
        key={modeloParaAgregar.key}
        modelo={modeloParaAgregar}
        initialProduct={modeloParaAgregar.productos[0]}
        onClose={() => setModeloParaAgregar(null)}
        onAdd={agregar}
        validandoIds={validandoIds}
      />}
    </>
  );
}

function ProductoCatalogoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const puedeCotizar = hasPermission(user, "VIEW_QUOTES") && hasPermission(user, "ACTION_QUOTES_CREATE");
  const { agregar, validandoIds, items: carrito } = useCatalogoCotizacion();
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
  const [configurarCotizacion, setConfigurarCotizacion] = useState(false);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError("");
        const parametros = {
          busqueda: busquedaDebounced,
          activo: true,
          sortBy: "modeloNombre",
          direction: "asc"
        };
        const { productos: productosActivos } = await cargarCatalogoYFamiliasActivas(parametros);
        setProductos(productosActivos);
      } catch (err) {
        setError(err?.message || "No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [busquedaDebounced]);

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
  const productoEnCarrito = carrito.some((item) => String(item.id) === String(getProductoId(productoSeleccionado)));

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
                    className="btn productos-brand-primary producto-catalogo-add-cart"
                    disabled={!productoSeleccionado.activo}
                    onClick={() => setConfigurarCotizacion(true)}
                  >
                    <i className="bi bi-bag-plus me-2"></i>
                    {productoEnCarrito ? "Agregar otra pieza" : "Agregar a mi cotización"}
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
      {puedeCotizar && configurarCotizacion && modeloSeleccionado && <CatalogoAgregarModal
        key={`${modeloSeleccionado.key}-${getProductoId(productoSeleccionado)}`}
        modelo={modeloSeleccionado}
        initialProduct={productoSeleccionado}
        onClose={() => setConfigurarCotizacion(false)}
        onAdd={agregar}
        validandoIds={validandoIds}
      />}
    </>
  );
}

export default function ProductoCatalogoPage() {
  const { id } = useParams();
  const user = getUser();
  const puedeCotizar = hasPermission(user, "VIEW_QUOTES") && hasPermission(user, "ACTION_QUOTES_CREATE");
  return <CatalogoCotizacionProvider enabled={puedeCotizar}>
    {id ? <ProductoCatalogoDetalle /> : <CatalogoFamiliasPage />}
  </CatalogoCotizacionProvider>;
}
