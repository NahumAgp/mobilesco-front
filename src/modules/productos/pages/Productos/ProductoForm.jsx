import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  previsualizarReclasificacion,
  aplicarReclasificacion,
} from "../../services/productos.js";
import { obtenerModelos } from "../../../modelos/services/modelos.js";
import { obtenerLineasActivas } from "../../../lineas-producto/services/lineaProducto.js";
import { obtenerFamiliasActivas } from "../../../familias/services/familias.js";
import { obtenerSubfamiliasActivas } from "../../../subfamilias/services/subfamilias.js";
import { obtenerNiveles } from "../../services/niveles.js";
import { obtenerColores } from "../../../colores/services/color.js";
import { obtenerMaterialesActivos } from "../../../materiales/services/materiales.js";
import {
  obtenerImagenesPorProducto,
  obtenerImagenPrincipalPorProducto,
  subirImagenArchivo,
  actualizarImagen,
  eliminarImagen,
} from "../../services/imagenes.js";
import Toast from "../../../../components/ui/Toast.jsx";
import SearchableSelect from "../../../../components/ui/SearchableSelect.jsx";
import ClasificacionCatalogCreateModal from "./ClasificacionCatalogCreateModal.jsx";
import { API_BASE_URL } from "../../../../config/apiConfig.js";
import "./ProductoForm.css";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return respuesta?.content || respuesta?.data || respuesta?.items || [];
};

const normalizarTexto = (valor) =>
  String(valor || "").trim().toLocaleLowerCase("es-MX");

const encontrarEquivalente = (lista, actual) => {
  if (!actual) return null;
  const codigo = normalizarTexto(actual.codigo);
  const nombre = normalizarTexto(actual.nombre);
  return lista.find((item) =>
    (codigo && normalizarTexto(item.codigo) === codigo)
    || (nombre && normalizarTexto(item.nombre) === nombre)
  ) || null;
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
};

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calcularPesoVolumetrico = ({ ancho, alto, fondo }) => {
  const valores = [ancho, alto, fondo].map((valor) => Number(String(valor ?? "").replace(",", ".")));
  if (valores.some((valor) => !Number.isFinite(valor) || valor <= 0)) return "";
  return (valores[0] * valores[1] * valores[2] / 5000).toFixed(2);
};

const getArchivoNombre = (url) => {
  if (!url) return "Imagen";
  const partes = url.split("/");
  return decodeURIComponent(partes[partes.length - 1] || "Imagen");
};

const esImagenPrincipal = (imagen) => Boolean(imagen?.esPrincipal || imagen?.principal);

const ordenarImagenesPorCarrusel = (lista = []) =>
  lista
    .map((imagen, index) => ({ imagen, index }))
    .sort((a, b) => {
      const ordenA = Number.isFinite(Number(a.imagen?.orden)) ? Number(a.imagen.orden) : Number.MAX_SAFE_INTEGER;
      const ordenB = Number.isFinite(Number(b.imagen?.orden)) ? Number(b.imagen.orden) : Number.MAX_SAFE_INTEGER;
      if (ordenA !== ordenB) return ordenA - ordenB;
      if (esImagenPrincipal(a.imagen) !== esImagenPrincipal(b.imagen)) {
        return esImagenPrincipal(a.imagen) ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(({ imagen }) => imagen);

const moverImagen = (lista, origenIndex, destinoIndex) => {
  const siguiente = [...lista];
  const [movida] = siguiente.splice(origenIndex, 1);
  siguiente.splice(destinoIndex, 0, movida);
  return siguiente;
};

const normalizarOrdenImagenes = (lista = []) =>
  lista.map((imagen, index) => ({
    ...imagen,
    orden: index,
    esPrincipal: index === 0,
    principal: index === 0
  }));

function ProductoAccordionSection({ id, title, icon, children, defaultOpen = false }) {
  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id={`${id}-heading`}>
        <button
          className={`accordion-button producto-form-accordion-button ${defaultOpen ? "" : "collapsed"}`}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${id}-collapse`}
          aria-expanded={defaultOpen ? "true" : "false"}
          aria-controls={`${id}-collapse`}
        >
          <i className={`${icon} me-2`}></i>
          {title}
        </button>
      </h2>
      <div id={`${id}-collapse`} className={`accordion-collapse collapse ${defaultOpen ? "show" : ""}`} aria-labelledby={`${id}-heading`}>
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
}

function SectionFooter({ children }) {
  return <div className="producto-form-section-footer">{children}</div>;
}

const limpiarDecimal = (valor) => {
  const normalizado = String(valor || "").replace(",", ".");
  if (normalizado === "") return "";
  if (!/^\d*\.?\d{0,2}$/.test(normalizado)) return null;
  return normalizado;
};

function DecimalInput({ name, className, value, onValueChange, readOnly = false }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      name={name}
      className={className}
      value={value ?? ""}
      readOnly={readOnly}
      onChange={(event) => {
        const siguiente = limpiarDecimal(event.target.value);
        if (siguiente !== null) onValueChange(name, siguiente);
      }}
      onKeyDown={(event) => {
        const teclasPermitidas = [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End"
        ];
        if (teclasPermitidas.includes(event.key) || event.ctrlKey || event.metaKey) return;
        if (!/^\d$/.test(event.key) && event.key !== "." && event.key !== ",") {
          event.preventDefault();
        }
      }}
      placeholder="0.00"
      autoComplete="off"
    />
  );
}

function ProductoImageCarousel({ imagenes, imagenPrincipal, nombre }) {
  const imagenesCarrusel = useMemo(() => {
    const ordenadas = ordenarImagenesPorCarrusel(imagenes);
    return ordenadas.length ? ordenadas : imagenPrincipal ? [imagenPrincipal] : [];
  }, [imagenes, imagenPrincipal]);
  const [imagenActivaIndex, setImagenActivaIndex] = useState(0);
  const imagenActivaIndexSeguro = Math.min(
    imagenActivaIndex,
    Math.max(imagenesCarrusel.length - 1, 0)
  );
  const imagenActiva = imagenesCarrusel[imagenActivaIndexSeguro] || imagenPrincipal || null;

  const moverCarrusel = (direccion) => {
    if (!imagenesCarrusel.length) return;
    setImagenActivaIndex((actual) => {
      const siguiente = actual + direccion;
      if (siguiente < 0) return imagenesCarrusel.length - 1;
      if (siguiente >= imagenesCarrusel.length) return 0;
      return siguiente;
    });
  };

  return (
    <>
      <div className="producto-form-carousel">
        {imagenActiva ? (
          <img
            src={toPreviewUrl(imagenActiva.url)}
            alt={imagenActiva?.altTexto || imagenActiva?.nombre || nombre || "Producto"}
            className="producto-form-carousel-image"
          />
        ) : (
          <div className="producto-form-carousel-empty">
            <i className="bi bi-image"></i>
            <span>Sin imagen</span>
          </div>
        )}

        {imagenesCarrusel.length > 1 && (
          <>
            <button type="button" className="producto-form-carousel-control is-prev" onClick={() => moverCarrusel(-1)} aria-label="Imagen anterior">
              <i className="bi bi-chevron-left"></i>
            </button>
            <button type="button" className="producto-form-carousel-control is-next" onClick={() => moverCarrusel(1)} aria-label="Imagen siguiente">
              <i className="bi bi-chevron-right"></i>
            </button>
          </>
        )}
      </div>

      <div className="producto-form-carousel-meta">
        <span>{imagenesCarrusel.length ? `${imagenActivaIndexSeguro + 1} / ${imagenesCarrusel.length}` : "0 / 0"}</span>
        {imagenActiva && <span className="text-truncate">{imagenActiva.altTexto || imagenActiva.nombre || getArchivoNombre(imagenActiva.url)}</span>}
      </div>

      {imagenesCarrusel.length > 1 && (
        <div className="producto-form-carousel-dots">
          {imagenesCarrusel.map((imagen, index) => (
            <button
              key={imagen.id || imagen.url || index}
              type="button"
              className={index === imagenActivaIndexSeguro ? "is-active" : ""}
              onClick={() => setImagenActivaIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function ProductoForm({
  productoId,
  producto,
  onSave,
  costSummary = null,
  costDetails = null,
  errores: erroresExternos = {},
  canEliminarDefinitivo = false,
  onEliminarDefinitivo = null,
}) {
  const navigate = useNavigate();
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(productoId) || Boolean(producto);
  const idProducto = producto?.id || productoId;
  const accordionId = idProducto || "nuevo";

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [loading, setLoading] = useState(false);
  const [cargandoImagenes, setCargandoImagenes] = useState(false);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [reordenandoImagenes, setReordenandoImagenes] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagenArrastradaId, setImagenArrastradaId] = useState("");
  const [imagenDestinoId, setImagenDestinoId] = useState("");

  const [modelos, setModelos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState({
    lineaId: "",
    familiaId: "",
    subfamiliaId: "",
  });
  const [atributosOriginales, setAtributosOriginales] = useState({
    modeloId: "",
    nivelId: "",
    materialId: "",
    colorId: "",
  });
  const [previewReclasificacion, setPreviewReclasificacion] = useState(null);
  const [cargandoReclasificacion, setCargandoReclasificacion] = useState(false);
  const [guardandoReclasificacion, setGuardandoReclasificacion] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [errorImagenes, setErrorImagenes] = useState("");
  const [catalogoModal, setCatalogoModal] = useState(null);

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    descripcionCorta: "",
    pesoVolumetrico: "",
    ancho: "",
    alto: "",
    fondo: "",
    dimensiones: "",
    pesoKg: "",
    modeloId: "",
    nivelId: "",
    materialId: "",
    colorId: "",
    activo: true,
  });

  const modeloSeleccionado = useMemo(
    () => modelos.find((modelo) => String(modelo.id) === String(formData.modeloId)) || null,
    [formData.modeloId, modelos]
  );
  const familiasClasificacion = useMemo(
    () => familias.filter((familia) =>
      String(familia.lineaId || familia.linea?.id || "") === String(rutaSeleccionada.lineaId)),
    [familias, rutaSeleccionada.lineaId]
  );
  const subfamiliasClasificacion = useMemo(
    () => subfamilias.filter((subfamilia) =>
      String(subfamilia.familiaId || subfamilia.familia?.id || "") === String(rutaSeleccionada.familiaId)),
    [subfamilias, rutaSeleccionada.familiaId]
  );
  const rutaOriginal = useMemo(() => ({
    lineaId: String(modeloSeleccionado?.lineaId || ""),
    familiaId: String(modeloSeleccionado?.familiaId || ""),
    subfamiliaId: modeloSeleccionado?.subfamiliaId ? String(modeloSeleccionado.subfamiliaId) : "sin-subfamilia",
  }), [modeloSeleccionado]);
  const clasificacionCambio = esEdicion && Boolean(modeloSeleccionado)
    && (rutaSeleccionada.lineaId !== rutaOriginal.lineaId
      || rutaSeleccionada.familiaId !== rutaOriginal.familiaId
      || rutaSeleccionada.subfamiliaId !== rutaOriginal.subfamiliaId);
  const atributosCambio = esEdicion && (
    String(formData.modeloId) !== String(atributosOriginales.modeloId)
    || String(formData.nivelId) !== String(atributosOriginales.nivelId)
    || String(formData.materialId) !== String(atributosOriginales.materialId)
    || String(formData.colorId) !== String(atributosOriginales.colorId)
  );
  const hayCambiosClasificacion = clasificacionCambio || atributosCambio;
  const cambiosSkuPreview = useMemo(() => {
    const cambios = [...(previewReclasificacion?.cambiosSku || [])];
    cambios.sort((a, b) => {
      if (String(a.productoId) === String(idProducto)) return -1;
      if (String(b.productoId) === String(idProducto)) return 1;
      return String(a.skuAnterior || "").localeCompare(String(b.skuAnterior || ""));
    });
    return cambios.slice(0, 8);
  }, [previewReclasificacion, idProducto]);

  useEffect(() => {
    setFormData((prev) => {
      const calculado = calcularPesoVolumetrico({
        ancho: prev.ancho,
        alto: prev.alto,
        fondo: prev.fondo
      });
      return String(prev.pesoVolumetrico ?? "") === String(calculado)
        ? prev
        : { ...prev, pesoVolumetrico: calculado };
    });
  }, [formData.alto, formData.ancho, formData.fondo]);
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [modelosData, materialesData, coloresData, lineasData, familiasData, subfamiliasData] = await Promise.all([
          obtenerModelos(),
          obtenerMaterialesActivos(),
          obtenerColores(),
          obtenerLineasActivas(),
          obtenerFamiliasActivas(),
          obtenerSubfamiliasActivas(),
        ]);

        setModelos(getLista(modelosData));
        setMateriales(getLista(materialesData));
        setColores(getLista(coloresData));
        setLineas(getLista(lineasData));
        setFamilias(getLista(familiasData));
        setSubfamilias(getLista(subfamiliasData));
      } catch (error) {
        console.error("Error cargando catalogos:", error);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    const cargarNivelesModelo = async () => {
      if (!formData.modeloId) {
        setNiveles([]);
        return;
      }

      try {
        const data = await obtenerNiveles(formData.modeloId);
        const lista = getLista(data);
        setNiveles(lista);
        setFormData((prev) => ({
          ...prev,
          nivelId: lista.some((nivel) => String(nivel.id) === String(prev.nivelId))
            ? prev.nivelId
            : ""
        }));
      } catch (error) {
        console.error("Error cargando categorias del modelo:", error);
        setNiveles([]);
      }
    };

    cargarNivelesModelo();
  }, [formData.modeloId]);

  useEffect(() => {
    if (!modeloSeleccionado) return;
    setRutaSeleccionada({
      lineaId: String(modeloSeleccionado.lineaId || ""),
      familiaId: String(modeloSeleccionado.familiaId || ""),
      subfamiliaId: modeloSeleccionado.subfamiliaId
        ? String(modeloSeleccionado.subfamiliaId)
        : "sin-subfamilia",
    });
  }, [modeloSeleccionado]);

  useEffect(() => {
    let vigente = true;

    const cargarPreview = async () => {
      const subfamiliaValida = rutaSeleccionada.subfamiliaId === "sin-subfamilia"
        || Boolean(rutaSeleccionada.subfamiliaId);
      const completa = rutaSeleccionada.lineaId && rutaSeleccionada.familiaId && subfamiliaValida;
      const atributosCompletos = formData.modeloId && formData.nivelId
        && formData.materialId && formData.colorId;
      if (!esEdicion || !idProducto || !hayCambiosClasificacion || !completa || !atributosCompletos) {
        setPreviewReclasificacion(null);
        return;
      }

      try {
        setCargandoReclasificacion(true);
        const preview = await previsualizarReclasificacion(idProducto, {
          lineaId: Number(rutaSeleccionada.lineaId),
          familiaId: Number(rutaSeleccionada.familiaId),
          subfamiliaId: rutaSeleccionada.subfamiliaId === "sin-subfamilia"
            ? null
            : Number(rutaSeleccionada.subfamiliaId),
          modeloId: Number(formData.modeloId),
          nivelId: Number(formData.nivelId),
          materialId: Number(formData.materialId),
          colorId: Number(formData.colorId),
        });
        if (vigente) setPreviewReclasificacion(preview);
      } catch (error) {
        if (!vigente) return;
        setPreviewReclasificacion({
          permitido: false,
          motivoBloqueo: error.message || "No se pudo validar la reclasificación.",
          cambiosSku: [],
        });
      } finally {
        if (vigente) setCargandoReclasificacion(false);
      }
    };

    cargarPreview();
    return () => {
      vigente = false;
    };
  }, [
    esEdicion,
    idProducto,
    hayCambiosClasificacion,
    rutaSeleccionada.lineaId,
    rutaSeleccionada.familiaId,
    rutaSeleccionada.subfamiliaId,
    formData.modeloId,
    formData.nivelId,
    formData.materialId,
    formData.colorId,
  ]);

  const recargarImagenes = useCallback(async (productoActualId = idProducto, dataBase = null) => {
    if (!productoActualId) return;

    setCargandoImagenes(true);
    try {
      const respuestaLista = await obtenerImagenesPorProducto(productoActualId);
      const lista = getLista(respuestaLista);
      const principal =
        lista.find((img) => Boolean(img?.esPrincipal || img?.principal)) ||
        dataBase?.imagenPrincipal ||
        dataBase?.imagen ||
        null ||
        (await obtenerImagenPrincipalPorProducto(productoActualId).catch(() => null));

      setImagenes(ordenarImagenesPorCarrusel(lista));
      setImagenPrincipal(principal);
      setErrorImagenes("");
    } catch (error) {
      console.error("Error cargando imagenes:", error);
      setImagenes([]);
      setImagenPrincipal(null);
      setErrorImagenes("No se pudieron cargar las imagenes del producto.");
    } finally {
      setCargandoImagenes(false);
    }
  }, [idProducto]);

  useEffect(() => {
    const cargar = async () => {
      if (esModal && producto) {
        setFormData({
          sku: producto.sku || "",
          nombre: producto.nombre || "",
          descripcion: producto.descripcion || "",
          descripcionCorta: producto.descripcionCorta || producto.descripcion_corta || "",
          pesoVolumetrico: producto.pesoVolumetrico ?? producto.peso_volumetrico ?? "",
          ancho: producto.ancho ?? "",
          alto: producto.alto ?? "",
          fondo: producto.fondo ?? "",
          dimensiones: producto.dimensiones || producto.dimensiones_producto || "",
          pesoKg: producto.pesoKg ?? producto.peso_kg ?? "",
          modeloId: producto.id_modelo || producto.modeloId || "",
          nivelId: producto.id_nivel || producto.nivelId || "",
          materialId: producto.id_material || producto.materialId || "",
          colorId: producto.id_color || producto.colorId || "",
          activo: producto.activo ?? true,
        });
        setAtributosOriginales({
          modeloId: producto.id_modelo || producto.modeloId || "",
          nivelId: producto.id_nivel || producto.nivelId || "",
          materialId: producto.id_material || producto.materialId || "",
          colorId: producto.id_color || producto.colorId || "",
        });
        return;
      }

      if (!esModal && productoId) {
        try {
          setLoading(true);
          const data = await obtenerProductoPorId(productoId);
          setFormData({
            sku: data.sku || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            descripcionCorta: data.descripcionCorta || data.descripcion_corta || "",
            pesoVolumetrico: data.pesoVolumetrico ?? data.peso_volumetrico ?? "",
            ancho: data.ancho ?? "",
            alto: data.alto ?? "",
            fondo: data.fondo ?? "",
            dimensiones: data.dimensiones || data.dimensiones_producto || "",
            pesoKg: data.pesoKg ?? data.peso_kg ?? "",
            modeloId: data.id_modelo || data.modeloId || data.id_producto_base || data.productoBaseId || "",
            nivelId: data.id_nivel || data.nivelId || "",
            materialId: data.id_material || data.materialId || "",
            colorId: data.id_color || data.colorId || "",
            activo: data.activo ?? true,
          });
          setAtributosOriginales({
            modeloId: data.id_modelo || data.modeloId || data.id_producto_base || data.productoBaseId || "",
            nivelId: data.id_nivel || data.nivelId || "",
            materialId: data.id_material || data.materialId || "",
            colorId: data.id_color || data.colorId || "",
          });
          await recargarImagenes(productoId, data);
        } catch (error) {
          console.error("Error cargando producto:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    cargar();
  }, [productoId, producto, esModal, recargarImagenes]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "modeloId" ? { nivelId: "" } : {}),
    }));

    if (erroresBackend[name]) {
      setErroresBackend((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  };

  const handleRutaChange = (campo, value) => {
    setRutaSeleccionada((prev) => {
      if (campo === "lineaId") {
        const familiaActual = familias.find((item) => String(item.id) === String(prev.familiaId))
          || familias.find((item) => String(item.id) === rutaOriginal.familiaId);
        const familiasDestino = familias.filter((item) =>
          String(item.lineaId || item.linea?.id || "") === String(value));
        const familiaEquivalente = encontrarEquivalente(familiasDestino, familiaActual);
        if (!familiaEquivalente) {
          return { lineaId: value, familiaId: "", subfamiliaId: "" };
        }

        const subfamiliaActual = subfamilias.find((item) => String(item.id) === String(prev.subfamiliaId))
          || subfamilias.find((item) => String(item.id) === rutaOriginal.subfamiliaId);
        const subfamiliasDestino = subfamilias.filter((item) =>
          String(item.familiaId || item.familia?.id || "") === String(familiaEquivalente.id));
        const subfamiliaEquivalente = encontrarEquivalente(subfamiliasDestino, subfamiliaActual);
        return {
          lineaId: value,
          familiaId: String(familiaEquivalente.id),
          subfamiliaId: subfamiliaEquivalente
            ? String(subfamiliaEquivalente.id)
            : (prev.subfamiliaId === "sin-subfamilia" ? "sin-subfamilia" : ""),
        };
      }

      if (campo === "familiaId") {
        const subfamiliaActual = subfamilias.find((item) => String(item.id) === String(prev.subfamiliaId))
          || subfamilias.find((item) => String(item.id) === rutaOriginal.subfamiliaId);
        const subfamiliasDestino = subfamilias.filter((item) =>
          String(item.familiaId || item.familia?.id || "") === String(value));
        const subfamiliaEquivalente = encontrarEquivalente(subfamiliasDestino, subfamiliaActual);
        return {
          ...prev,
          familiaId: value,
          subfamiliaId: subfamiliaEquivalente
            ? String(subfamiliaEquivalente.id)
            : (prev.subfamiliaId === "sin-subfamilia" ? "sin-subfamilia" : ""),
        };
      }

      return { ...prev, [campo]: value };
    });
    setPreviewReclasificacion(null);
  };

  const handleCatalogoCreado = async ({ tipo, creado, nombre }) => {
    const respuestaCreada = creado?.data || creado;
    let lista = [];
    if (tipo === "linea") {
      lista = getLista(await obtenerLineasActivas());
      setLineas(lista);
    } else if (tipo === "familia") {
      lista = getLista(await obtenerFamiliasActivas());
      setFamilias(lista);
    } else {
      lista = getLista(await obtenerSubfamiliasActivas());
      setSubfamilias(lista);
    }

    const registro = lista.find((item) => String(item.id) === String(respuestaCreada?.id))
      || lista.find((item) => normalizarTexto(item.nombre) === normalizarTexto(nombre));
    if (!registro) {
      throw new Error("El registro se creó, pero no fue posible seleccionarlo automáticamente.");
    }

    if (tipo === "linea") {
      setRutaSeleccionada({
        lineaId: String(registro.id),
        familiaId: "",
        subfamiliaId: "",
      });
    } else if (tipo === "familia") {
      setRutaSeleccionada((prev) => ({
        ...prev,
        familiaId: String(registro.id),
        subfamiliaId: "",
      }));
    } else {
      setRutaSeleccionada((prev) => ({
        ...prev,
        subfamiliaId: String(registro.id),
      }));
    }

    setPreviewReclasificacion(null);
    setCatalogoModal(null);
    setToastType("success");
    setToastMessage(`${tipo === "linea" ? "Línea" : tipo === "familia" ? "Familia" : "Subfamilia"} creada y seleccionada.`);
  };

  const guardarReclasificacion = async () => {
    if (!hayCambiosClasificacion || !previewReclasificacion?.permitido) return;
    try {
      setGuardandoReclasificacion(true);
      const respuesta = await aplicarReclasificacion(idProducto, {
        lineaId: Number(rutaSeleccionada.lineaId),
        familiaId: Number(rutaSeleccionada.familiaId),
        subfamiliaId: rutaSeleccionada.subfamiliaId === "sin-subfamilia"
          ? null
          : Number(rutaSeleccionada.subfamiliaId),
        modeloId: Number(formData.modeloId),
        nivelId: Number(formData.nivelId),
        materialId: Number(formData.materialId),
        colorId: Number(formData.colorId),
      });
      const skuActual = respuesta?.cambiosSku?.find((item) =>
        String(item.productoId) === String(idProducto))?.skuNuevo;
      if (skuActual) setFormData((prev) => ({ ...prev, sku: skuActual }));
      setModelos((prev) => prev.map((modelo) => String(modelo.id) === String(formData.modeloId)
        ? {
            ...modelo,
            lineaId: Number(rutaSeleccionada.lineaId),
            lineaNombre: lineas.find((item) => String(item.id) === rutaSeleccionada.lineaId)?.nombre,
            familiaId: Number(rutaSeleccionada.familiaId),
            familiaNombre: familias.find((item) => String(item.id) === rutaSeleccionada.familiaId)?.nombre,
            subfamiliaId: rutaSeleccionada.subfamiliaId === "sin-subfamilia"
              ? null
              : Number(rutaSeleccionada.subfamiliaId),
            subfamiliaNombre: subfamilias.find((item) =>
              String(item.id) === rutaSeleccionada.subfamiliaId)?.nombre || null,
          }
        : modelo));
      setAtributosOriginales({
        modeloId: formData.modeloId,
        nivelId: formData.nivelId,
        materialId: formData.materialId,
        colorId: formData.colorId,
      });
      setToastType("success");
      setToastMessage(`Clasificación actualizada. Se recalcularon ${respuesta.variantesAfectadas} SKU(s) sin modificar existencias.`);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo actualizar la clasificación.");
    } finally {
      setGuardandoReclasificacion(false);
    }
  };

  const handleDecimalChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "ancho" || name === "alto" || name === "fondo"
        ? {
            pesoVolumetrico: calcularPesoVolumetrico({
              ...prev,
              [name]: value
            })
          }
        : {}),
    }));

    if (erroresBackend[name]) {
      setErroresBackend((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  };

  const validarImagenes = (files) => {
    const validas = files.filter((file) => file.type.startsWith("image/"));
    setErrorImagenes(validas.length !== files.length ? "Se omitieron archivos que no son imagen." : "");
    return validas;
  };

  const subirImagenes = async (files) => {
    if (!idProducto || !files.length) return;

    try {
      setSubiendoImagenes(true);
      const tienePrincipal = imagenes.some((img) => Boolean(img?.esPrincipal || img?.principal));

      for (let index = 0; index < files.length; index += 1) {
        await subirImagenArchivo({
          archivo: files[index],
          productoId: Number(idProducto),
          esPrincipal: !tienePrincipal && index === 0,
          orden: imagenes.length + index,
          altTexto: formData.nombre || formData.sku || "Imagen del producto",
        });
      }

      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error subiendo imagenes:", error);
      setErrorImagenes(error.message || "No se pudieron subir las imagenes.");
    } finally {
      setSubiendoImagenes(false);
    }
  };

  const handleFileChange = async (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    await subirImagenes(validarImagenes(archivos));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await subirImagenes(validarImagenes(Array.from(e.dataTransfer.files || [])));
  };

  const persistirOrdenImagenes = async (listaOrdenada) => {
    if (!idProducto) return;

    const normalizadas = normalizarOrdenImagenes(listaOrdenada);
    setImagenes(normalizadas);
    setImagenPrincipal(normalizadas[0] || null);
    setErrorImagenes("");

    if (normalizadas.length === 0) return;

    try {
      setReordenandoImagenes(true);
      const [primera, ...resto] = normalizadas;

      if (primera?.id) {
        await actualizarImagen(primera.id, {
          orden: 0,
          esPrincipal: true,
        });
      }

      await Promise.all(
        resto
          .filter((imagen) => imagen?.id)
          .map((imagen, index) => actualizarImagen(imagen.id, { orden: index + 1 }))
      );

      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error reordenando imagenes:", error);
      setErrorImagenes(error.message || "No se pudo guardar el orden de las imagenes.");
      await recargarImagenes(idProducto);
    } finally {
      setReordenandoImagenes(false);
    }
  };

  const reordenarImagenesPorIds = async (origenId, destinoId) => {
    if (!origenId || !destinoId || String(origenId) === String(destinoId)) return;

    const imagenesOrdenActual = ordenarImagenesPorCarrusel(imagenes);
    const origenIndex = imagenesOrdenActual.findIndex((imagen) => String(imagen.id) === String(origenId));
    const destinoIndex = imagenesOrdenActual.findIndex((imagen) => String(imagen.id) === String(destinoId));

    if (origenIndex < 0 || destinoIndex < 0) return;

    await persistirOrdenImagenes(moverImagen(imagenesOrdenActual, origenIndex, destinoIndex));
  };

  const marcarPrincipal = async (imagenId) => {
    if (!idProducto || !imagenId) return;

    const imagenesOrdenActual = ordenarImagenesPorCarrusel(imagenes);
    const origenIndex = imagenesOrdenActual.findIndex((imagen) => String(imagen.id) === String(imagenId));
    if (origenIndex < 0) return;

    const siguienteOrden = origenIndex === 0
      ? imagenesOrdenActual
      : moverImagen(imagenesOrdenActual, origenIndex, 0);

    await persistirOrdenImagenes(siguienteOrden);
  };

  const handleImagenDragStart = (event, imagenId) => {
    setImagenArrastradaId(String(imagenId));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(imagenId));
  };

  const handleImagenDragOver = (event, imagenId) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setImagenDestinoId(String(imagenId));
  };

  const handleImagenDrop = async (event, destinoId) => {
    event.preventDefault();
    event.stopPropagation();

    const origenId = event.dataTransfer.getData("text/plain") || imagenArrastradaId;
    setImagenArrastradaId("");
    setImagenDestinoId("");
    await reordenarImagenesPorIds(origenId, destinoId);
  };

  const handleImagenDragEnd = () => {
    setImagenArrastradaId("");
    setImagenDestinoId("");
  };

  const handleImagenDragLeave = (event, imagenId) => {
    event.preventDefault();
    event.stopPropagation();
    if (String(imagenDestinoId) === String(imagenId)) {
      setImagenDestinoId("");
    }
  };

  const borrarImagen = async (imagenId) => {
    if (!idProducto || !imagenId) return;
    if (!window.confirm("Eliminar esta imagen del producto?")) return;

    try {
      await eliminarImagen(imagenId);
      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      setErrorImagenes(error.message || "No se pudo eliminar la imagen.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.modeloId || !formData.nivelId || !formData.materialId || !formData.colorId) {
      alert("Completa los campos obligatorios: Nombre, Modelo, Categoría, Material y Color");
      return;
    }
    const dataToSend = {
      sku: formData.sku.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim() || null,
      descripcionCorta: formData.descripcionCorta?.trim() || null,
      pesoVolumetrico: parseOptionalNumber(formData.pesoVolumetrico),
      ancho: parseOptionalNumber(formData.ancho),
      alto: parseOptionalNumber(formData.alto),
      fondo: parseOptionalNumber(formData.fondo),
      dimensiones: formData.dimensiones?.trim() || null,
      pesoKg: (() => {
        if (formData.pesoKg === "" || formData.pesoKg === null || formData.pesoKg === undefined) return null;
        const parsed = Number(formData.pesoKg);
        return Number.isFinite(parsed) ? parsed : null;
      })(),
      id_modelo: Number(formData.modeloId),
      id_nivel: Number(formData.nivelId),
      id_material: Number(formData.materialId),
      id_color: Number(formData.colorId),
      activo: formData.activo,
    };

    try {
      setErroresBackend({});
      const respuesta = esEdicion
        ? await actualizarProducto(idProducto, dataToSend)
        : await crearProducto(dataToSend);
      if (respuesta?.sku) {
        setFormData((prev) => ({ ...prev, sku: respuesta.sku }));
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "Producto actualizado con exito." : "Producto registrado con exito.");
        if (!esEdicion) setTimeout(() => navigate("/productos"), 1200);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  };

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const imagenesOrdenadas = useMemo(() => ordenarImagenesPorCarrusel(imagenes), [imagenes]);

  const productoPrincipal = useMemo(
    () => imagenesOrdenadas[0] || imagenPrincipal || null,
    [imagenPrincipal, imagenesOrdenadas]
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border producto-form-spinner" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={esModal ? "" : "producto-form-wrap"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      <form onSubmit={handleSubmit} noValidate className="producto-form-shell">
        {costSummary && <div className="producto-form-cost-summary">{costSummary}</div>}

        <div className="producto-form-workspace">
          <div className="producto-form-workspace-main">
            <div className="accordion producto-form-accordion" id={`productoFormAccordion-${accordionId}`}>
              <ProductoAccordionSection id={`producto-info-${accordionId}`} title="Informacion Basica" icon="bi bi-info-circle" defaultOpen={!costDetails}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">SKU <span className="text-danger">*</span></label>
                <input type="text" name="sku" className={inputClass("sku")} value={formData.sku} readOnly placeholder="Se genera con la clasificación" />
                <small className="text-muted">Se calcula automáticamente con línea, familia, subfamilia, modelo, categoría, material y color</small>
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Nombre <span className="text-danger">*</span></label>
                <input type="text" name="nombre" className={inputClass("nombre")} value={formData.nombre} onChange={handleChange} placeholder="Formaica Prescolar Cafe" />
                <small className="text-muted">Descripcion comercial del producto</small>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Descripcion</label>
                <textarea name="descripcion" className={inputClass("descripcion")} rows="3" value={formData.descripcion} onChange={handleChange} placeholder="Silla en Formaica color cafe ..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Descripcion corta</label>
                <textarea
                  name="descripcionCorta"
                  className={inputClass("descripcionCorta")}
                  rows="2"
                  value={formData.descripcionCorta}
                  onChange={handleChange}
                  placeholder="Resumen corto del producto para tarjetas y listados"
                />
              </div>
              <div className="col-md-4 col-lg">
                <label className="form-label fw-semibold">Peso (kg)</label>
                <DecimalInput
                  name="pesoKg"
                  className={inputClass("pesoKg")}
                  value={formData.pesoKg}
                  onValueChange={handleDecimalChange}
                />
              </div>
              <div className="col-md-4 col-lg">
                <label className="form-label fw-semibold">Peso volumetrico</label>
                <input
                  type="text"
                  name="pesoVolumetrico"
                  className={`${inputClass("pesoVolumetrico")} bg-light text-secondary`}
                  value={formData.pesoVolumetrico}
                  readOnly
                  placeholder="Automatico"
                />
                <small className="text-muted">Se calcula con ancho × alto × fondo ÷ 5000</small>
              </div>
              <div className="col-md-4 col-lg">
                <label className="form-label fw-semibold">Ancho</label>
                <DecimalInput
                  name="ancho"
                  className={inputClass("ancho")}
                  value={formData.ancho}
                  onValueChange={handleDecimalChange}
                />
              </div>
              <div className="col-md-4 col-lg">
                <label className="form-label fw-semibold">Alto</label>
                <DecimalInput
                  name="alto"
                  className={inputClass("alto")}
                  value={formData.alto}
                  onValueChange={handleDecimalChange}
                />
              </div>
              <div className="col-md-4 col-lg">
                <label className="form-label fw-semibold">Fondo</label>
                <DecimalInput
                  name="fondo"
                  className={inputClass("fondo")}
                  value={formData.fondo}
                  onValueChange={handleDecimalChange}
                />
              </div>
              <div className="col-12">
                <div className="producto-form-status-box">
                  <div>
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} id="activoSwitch" />
                      <label className="form-check-label fw-semibold ms-2" htmlFor="activoSwitch">
                        Producto {formData.activo ? "Activo" : "Inactivo"}
                      </label>
                    </div>
                    <small className="text-muted">{formData.activo ? "Visible en el catalogo" : "Oculto del catalogo"}</small>
                  </div>
                  {esEdicion && canEliminarDefinitivo && (
                    <button
                      type="button"
                      className="btn producto-form-danger"
                      onClick={onEliminarDefinitivo}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <SectionFooter>
              <button type="submit" className="btn producto-form-primary">
                <i className="bi bi-save me-2"></i>
                Guardar informacion
              </button>
            </SectionFooter>
              </ProductoAccordionSection>

              <ProductoAccordionSection id={`producto-clasificacion-${accordionId}`} title="Clasificacion" icon="bi bi-tags">
            <div className="row g-3">
              {esEdicion ? (
                <>
                  <div className="col-md-4">
                    <SearchableSelect
                      label={<>Línea <span className="text-danger">*</span></>}
                      value={rutaSeleccionada.lineaId}
                      options={lineas}
                      onChange={(value) => handleRutaChange("lineaId", String(value || ""))}
                      placeholder="Seleccionar línea"
                      searchPlaceholder="Buscar línea..."
                      className="producto-clasificacion-select"
                      actionNode={(
                        <button
                          type="button"
                          className="producto-clasificacion-add"
                          onClick={() => setCatalogoModal("linea")}
                          aria-label="Crear línea"
                          title="Crear línea"
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      )}
                      renderOptionLabel={(linea) => (
                        <span className="producto-clasificacion-option">
                          <span className="producto-clasificacion-option-code">{linea.codigo || "L"}</span>
                          <span>{linea.nombre}</span>
                        </span>
                      )}
                    />
                  </div>
                  <div className="col-md-4">
                    <SearchableSelect
                      label={<>Familia <span className="text-danger">*</span></>}
                      value={rutaSeleccionada.familiaId}
                      options={familiasClasificacion}
                      onChange={(value) => handleRutaChange("familiaId", String(value || ""))}
                      disabled={!rutaSeleccionada.lineaId}
                      placeholder="Seleccionar familia"
                      searchPlaceholder="Buscar familia..."
                      className="producto-clasificacion-select"
                      actionNode={(
                        <button
                          type="button"
                          className="producto-clasificacion-add"
                          onClick={() => setCatalogoModal("familia")}
                          disabled={!rutaSeleccionada.lineaId}
                          aria-label="Crear familia"
                          title={rutaSeleccionada.lineaId ? "Crear familia" : "Selecciona una línea primero"}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      )}
                      renderOptionLabel={(familia) => (
                        <span className="producto-clasificacion-option">
                          <span className="producto-clasificacion-option-code">{familia.codigo || "F"}</span>
                          <span>{familia.nombre}</span>
                        </span>
                      )}
                    />
                    {rutaSeleccionada.lineaId && !familiasClasificacion.length && (
                      <div className="small text-danger mt-1">
                        Esta línea no tiene familias.
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                          onClick={() => setCatalogoModal("familia")}
                        >
                          Crear familia
                        </button>
                        <span className="text-muted"> o selecciona otra línea.</span>
                      </div>
                    )}
                    {rutaSeleccionada.lineaId && familiasClasificacion.length > 0 && !rutaSeleccionada.familiaId && (
                      <div className="small text-warning mt-1">
                        La familia anterior no existe en esta línea. Selecciona una de destino o
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                          onClick={() => setCatalogoModal("familia")}
                        >
                          crea una nueva
                        </button>.
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <SearchableSelect
                      label={<>Subfamilia <span className="text-danger">*</span></>}
                      value={rutaSeleccionada.subfamiliaId}
                      options={[
                        { id: "sin-subfamilia", codigo: "—", nombre: "Sin subfamilia" },
                        ...subfamiliasClasificacion,
                      ]}
                      onChange={(value) => handleRutaChange("subfamiliaId", String(value || ""))}
                      disabled={!rutaSeleccionada.familiaId}
                      placeholder="Seleccionar subfamilia"
                      searchPlaceholder="Buscar subfamilia..."
                      className="producto-clasificacion-select"
                      actionNode={(
                        <button
                          type="button"
                          className="producto-clasificacion-add"
                          onClick={() => setCatalogoModal("subfamilia")}
                          disabled={!rutaSeleccionada.familiaId}
                          aria-label="Crear subfamilia"
                          title={rutaSeleccionada.familiaId ? "Crear subfamilia" : "Selecciona una familia primero"}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      )}
                      renderOptionLabel={(subfamilia) => (
                        <span className="producto-clasificacion-option">
                          <span className="producto-clasificacion-option-code">{subfamilia.codigo || "SF"}</span>
                          <span>{subfamilia.nombre}</span>
                        </span>
                      )}
                    />
                    {rutaSeleccionada.familiaId && !subfamiliasClasificacion.length && (
                      <div className="small text-warning mt-1">
                        Esta familia no tiene subfamilias.
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                          onClick={() => setCatalogoModal("subfamilia")}
                        >
                          Crear subfamilia
                        </button>
                        <span className="text-muted"> o elige “Sin subfamilia”.</span>
                      </div>
                    )}
                    {rutaSeleccionada.familiaId && subfamiliasClasificacion.length > 0 && !rutaSeleccionada.subfamiliaId && (
                      <div className="small text-warning mt-1">
                        La subfamilia anterior no existe aquí. Selecciona una de destino o
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                          onClick={() => setCatalogoModal("subfamilia")}
                        >
                          crea una nueva
                        </button>.
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="producto-atributos-card">
                      <div className="producto-atributos-heading">
                        <div>
                          <div className="fw-semibold">Datos del producto</div>
                          <div className="small text-muted">Estos cambios afectan solo a este producto y actualizan su SKU.</div>
                        </div>
                        <i className="bi bi-box-seam"></i>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6 col-xl-3">
                          <SearchableSelect
                            label={<>Modelo <span className="text-danger">*</span></>}
                            value={formData.modeloId}
                            options={modelos}
                            onChange={(value) => handleChange({ target: { name: "modeloId", value: String(value || ""), type: "select-one" } })}
                            placeholder="Seleccionar modelo"
                            searchPlaceholder="Buscar modelo..."
                            className="producto-clasificacion-select"
                            getOptionLabel={(modelo) => `[${modelo.codigo}] ${modelo.nombre}`}
                          />
                        </div>
                        <div className="col-md-6 col-xl-3">
                          <SearchableSelect
                            label={<>Categoría <span className="text-danger">*</span></>}
                            value={formData.nivelId}
                            options={niveles}
                            onChange={(value) => handleChange({ target: { name: "nivelId", value: String(value || ""), type: "select-one" } })}
                            placeholder="Seleccionar categoría"
                            searchPlaceholder="Buscar categoría..."
                            disabled={!formData.modeloId}
                            className="producto-clasificacion-select"
                            getOptionLabel={(nivel) => `[${nivel.codigo}] ${nivel.nombre}`}
                          />
                        </div>
                        <div className="col-md-6 col-xl-3">
                          <SearchableSelect
                            label={<>Material <span className="text-danger">*</span></>}
                            value={formData.materialId}
                            options={materiales}
                            onChange={(value) => handleChange({ target: { name: "materialId", value: String(value || ""), type: "select-one" } })}
                            placeholder="Seleccionar material"
                            searchPlaceholder="Buscar material..."
                            className="producto-clasificacion-select"
                            getOptionLabel={(material) => `[${material.codigo}] ${material.nombre}`}
                          />
                        </div>
                        <div className="col-md-6 col-xl-3">
                          <SearchableSelect
                            label={<>Color <span className="text-danger">*</span></>}
                            value={formData.colorId}
                            options={colores}
                            onChange={(value) => handleChange({ target: { name: "colorId", value: String(value || ""), type: "select-one" } })}
                            placeholder="Seleccionar color"
                            searchPlaceholder="Buscar color..."
                            className="producto-clasificacion-select"
                            getOptionLabel={(color) => `[${color.codigo}] ${color.nombre}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                {hayCambiosClasificacion && (
                <div className="col-12">
                  <div className="producto-reclasificacion p-3 border rounded-3">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <div>
                        <div className="fw-semibold">Vista previa de cambios</div>
                        <div className="small text-muted">
                          Confirma la nueva clasificación y los datos del producto antes de guardar. Las existencias no se modifican.
                        </div>
                      </div>
                      <span className="badge text-bg-light border text-dark">
                        <i className="bi bi-shield-check me-1"></i>
                        Validación comercial
                      </span>
                    </div>
                    {cargandoReclasificacion && (
                      <div className="small text-muted mt-2">Calculando SKU y revisando historial...</div>
                    )}
                    {!cargandoReclasificacion && previewReclasificacion && (
                      <div className={`alert ${previewReclasificacion.permitido ? "alert-info" : "alert-danger"} mt-3 mb-0 py-2`}>
                        {previewReclasificacion.permitido ? (
                          <>
                            <div className="small text-muted">{previewReclasificacion.rutaDestino}</div>
                            <div className="small fw-semibold mb-1">
                              Se recalcularán {previewReclasificacion.variantesAfectadas} SKU(s).
                            </div>
                            {cambiosSkuPreview.map((cambio) => (
                              <div className="text-break" key={cambio.productoId}>
                                <span className="text-muted">{cambio.skuAnterior}</span>
                                <i className="bi bi-arrow-right mx-2"></i>
                                <strong>{cambio.skuNuevo}</strong>
                              </div>
                            ))}
                            {(previewReclasificacion.cambiosSku || []).length > cambiosSkuPreview.length && (
                              <div className="small text-muted mt-1">
                                Y {(previewReclasificacion.cambiosSku || []).length - cambiosSkuPreview.length} variante(s) más.
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="fw-semibold">No se puede guardar esta clasificación.</div>
                            <div className="small">{previewReclasificacion.motivoBloqueo}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
                </>
              ) : (
                <>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Producto base <span className="text-danger">*</span></label>
                    <select name="modeloId" className={selectClass("modeloId")} value={formData.modeloId} onChange={handleChange}>
                      <option value="">Seleccionar producto base...</option>
                      {modelos.map((modelo) => (
                        <option key={modelo.id} value={modelo.id}>
                          {modelo.lineaNombre} / {modelo.familiaNombre} / {modelo.subfamiliaNombre || "Sin subfamilia"} / {modelo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Categoría <span className="text-danger">*</span></label>
                    <select name="nivelId" className={selectClass("nivelId")} value={formData.nivelId} onChange={handleChange}>
                      <option value="">Seleccionar categoría...</option>
                      {niveles.map((nivel) => <option key={nivel.id} value={nivel.id}>[{nivel.codigo}] {nivel.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Material <span className="text-danger">*</span></label>
                    <select name="materialId" className={selectClass("materialId")} value={formData.materialId} onChange={handleChange}>
                      <option value="">Seleccionar material...</option>
                      {materiales.map((material) => <option key={material.id} value={material.id}>[{material.codigo}] {material.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Color <span className="text-danger">*</span></label>
                    <select name="colorId" className={selectClass("colorId")} value={formData.colorId} onChange={handleChange}>
                      <option value="">Seleccionar color...</option>
                      {colores.map((color) => <option key={color.id} value={color.id}>[{color.codigo}] {color.nombre}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <SectionFooter>
              {esEdicion ? (
                <button
                  type="button"
                  className="btn producto-form-primary"
                  onClick={guardarReclasificacion}
                  disabled={guardandoReclasificacion || cargandoReclasificacion || !hayCambiosClasificacion || !previewReclasificacion?.permitido}
                >
                  <i className="bi bi-save me-2"></i>
                  {guardandoReclasificacion ? "Guardando..." : "Guardar"}
                </button>
              ) : (
                <button type="submit" className="btn producto-form-primary">
                  <i className="bi bi-save me-2"></i>
                  Guardar clasificación
                </button>
              )}
            </SectionFooter>
              </ProductoAccordionSection>

              <ProductoAccordionSection id={`producto-imagenes-${accordionId}`} title="Imagenes" icon="bi bi-images">
            {esEdicion ? (
              <>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div className="text-muted">Estas imagenes pertenecen solo a este producto.</div>
                  <div className="d-flex gap-2">
                    <span className="badge producto-form-count-badge">{imagenes.length}</span>
                    {reordenandoImagenes && (
                      <span className="badge producto-form-count-badge">Guardando orden...</span>
                    )}
                    <span className={`badge ${productoPrincipal ? "producto-form-success-badge" : "text-bg-secondary"}`}>
                      {productoPrincipal ? "Con principal" : "Sin principal"}
                    </span>
                  </div>
                </div>

                {errorImagenes && <div className="alert alert-warning py-2">{errorImagenes}</div>}

                {cargandoImagenes ? (
                  <div className="text-muted py-3">Cargando imagenes...</div>
                ) : (
                  <>
                    <div
                      className={`producto-form-dropzone ${dragActive ? "is-active" : ""}`}
                      onClick={() => document.getElementById("producto-images-input")?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input id="producto-images-input" type="file" accept="image/*" multiple className="d-none" onChange={handleFileChange} />
                      <i className="bi bi-cloud-upload fs-2"></i>
                      <p className="mt-2 mb-0">Arrastra imagenes aqui o haz clic para seleccionar</p>
                      <small>Se aplicaran solo a este producto.</small>
                      {subiendoImagenes && <div className="mt-2 fw-semibold">Subiendo...</div>}
                    </div>

                    <div className="row g-3">
                      {imagenesOrdenadas.length > 0 ? (
                        imagenesOrdenadas.map((imagen, index) => {
                          const esPrincipalImagen = index === 0;
                          const imagenUrl = toPreviewUrl(imagen?.url);
                          const imagenKey = String(imagen.id);
                          const estaArrastrando = imagenArrastradaId === imagenKey;
                          const esDestino = imagenDestinoId === imagenKey && imagenArrastradaId !== imagenKey;

                          return (
                            <div className="col-6 col-md-4 col-xl-3" key={imagen.id}>
                              <div
                                className={`card h-100 producto-form-image-card producto-form-image-card-draggable ${estaArrastrando ? "is-dragging" : ""} ${esDestino ? "is-drop-target" : ""}`}
                                draggable={!reordenandoImagenes}
                                onDragStart={(event) => handleImagenDragStart(event, imagen.id)}
                                onDragOver={(event) => handleImagenDragOver(event, imagen.id)}
                                onDragLeave={(event) => handleImagenDragLeave(event, imagen.id)}
                                onDrop={(event) => handleImagenDrop(event, imagen.id)}
                                onDragEnd={handleImagenDragEnd}
                                title="Arrastra para ordenar"
                              >
                                <img src={imagenUrl} alt={imagen?.altTexto || imagen?.nombre || formData.nombre || "Producto"} className="card-img-top producto-form-thumb-image" />
                                <div className="card-body p-2 d-flex flex-column gap-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex flex-wrap align-items-center gap-1">
                                      <span className="badge producto-form-order-badge">{index + 1}</span>
                                      {esPrincipalImagen ? (
                                        <span className="badge producto-form-success-badge">
                                          <i className="bi bi-star-fill me-1"></i>Principal
                                        </span>
                                      ) : (
                                        <button type="button" className="btn btn-sm producto-form-outline" onClick={() => marcarPrincipal(imagen.id)}>
                                          Principal
                                        </button>
                                      )}
                                    </div>
                                    <button type="button" className="btn btn-sm producto-form-danger" onClick={() => borrarImagen(imagen.id)}>
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                  <small className="text-muted text-truncate" title={imagen?.altTexto || imagen?.nombre || ""}>
                                    {imagen?.altTexto || imagen?.nombre || getArchivoNombre(imagen?.url)}
                                  </small>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-12 text-muted">Todavia no hay imagenes para este producto.</div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-muted">Guarda el producto para comenzar a subir imagenes.</div>
            )}
            <SectionFooter>
              <button type="submit" className="btn producto-form-primary">
                <i className="bi bi-save me-2"></i>
                Guardar imagenes
              </button>
            </SectionFooter>
              </ProductoAccordionSection>

              {costDetails}
            </div>
          </div>

          <aside className="producto-form-workspace-preview">
            <div className="producto-form-preview-panel">
              <div className="producto-form-preview-header">
                <div>
                  <div className="producto-form-preview-label">Imagen del producto</div>
                  <h5>{formData.nombre || "Sin nombre"}</h5>
                  <span>{formData.sku || "Sin SKU"}</span>
                </div>
                <span className={`badge ${formData.activo ? "producto-form-success-badge" : "text-bg-secondary"}`}>
                  {formData.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <ProductoImageCarousel imagenes={imagenes} imagenPrincipal={productoPrincipal} nombre={formData.nombre} />
            </div>
          </aside>
        </div>
      </form>

      {catalogoModal && (
        <ClasificacionCatalogCreateModal
          tipo={catalogoModal}
          lineaId={rutaSeleccionada.lineaId}
          lineaNombre={lineas.find((item) =>
            String(item.id) === String(rutaSeleccionada.lineaId))?.nombre || "Sin línea"}
          familiaId={rutaSeleccionada.familiaId}
          familiaNombre={familias.find((item) =>
            String(item.id) === String(rutaSeleccionada.familiaId))?.nombre || "Sin familia"}
          onClose={() => setCatalogoModal(null)}
          onCreated={handleCatalogoCreado}
        />
      )}
    </div>
  );
}
