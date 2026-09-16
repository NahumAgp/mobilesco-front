import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import InsumoForm from "../../insumos/pages/InsumoForm.jsx";
import ConjuntosDialog from "../../insumos/components/ConjuntosDialog.jsx";
import DespieceResumen from "../../insumos/components/DespieceResumen.jsx";
import { obtenerConjuntos, conjuntoComoInsumo } from "../../insumos/services/conjuntos.js";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { sincronizarInsumosVariantes, sincronizarMedidasVariantes, sincronizarOperacionesVariantes } from "../services/modelos.js";
import OperacionForm from "../../operaciones/pages/OperacionForm.jsx";
import { obtenerOperacionesActivas } from "../../operaciones/services/operaciones.js";
import { getUser, hasPermission } from "../../auth/services/authService.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getId = (item) => item?.id ?? item?.insumoId ?? item?.operacionId ?? item?.insumo_id ?? item?.operacion_id ?? null;
const getMaterialId = (item) => item?.id ?? item?.materialId ?? item?.material_id ?? item?.id_material ?? null;
const getMaterialLabel = (item) => `${item?.codigo ? `[${item.codigo}] ` : ""}${item?.nombre || "Material"}`;
const getUnidad = (item) => item?.unidadMedida?.simbolo ?? item?.unidadMedida ?? item?.unidad_medida ?? "";
const getTipoInsumo = (item) => item?.tipoInsumo ?? item?.tipo_insumo ?? item?.tipo ?? "";
const getDesperdicio = (item) => item?.desperdicioPorcentaje ?? item?.desperdicio_porcentaje ?? item?.desperdicio ?? 0;
const getCostoCotizacion = (item) => item?.costoCotizacion ?? item?.costo_cotizacion ?? item?.costo_cotizar ?? item?.costo ?? 0;
const getTiempoOperacion = (item) => item?.tiempoOperacion ?? item?.tiempo_operacion ?? item?.minutos ?? 0;
const getCostoMinutoOperacion = (item) => item?.costoMinuto ?? item?.costo_minuto ?? 0;
const INSUMOS_CLIPBOARD_KEY = "mobilesco:modelos:insumosClipboard";
const OPERACIONES_CLIPBOARD_KEY = "mobilesco:modelos:operacionesClipboard";

const mergePorId = (...listas) => {
  const mapa = new Map();
  listas.flat().forEach((item) => {
    const id = getId(item);
    if (id !== null && id !== undefined) {
      mapa.set(String(id), item);
    }
  });
  return Array.from(mapa.values());
};

const getCategoriaKey = (categoria, index) =>
  String(categoria?.categoriaId ?? categoria?.categoria_id ?? categoria?.id ?? `categoria-${index}`);

const getInsumoMaterialId = (item) => item?.materialId ?? item?.material_id ?? item?.id_material ?? item?.material?.id ?? null;
const getInsumoScopeKey = (item) => `${getInsumoMaterialId(item) ?? "comun"}::${getId(item) ?? ""}`;
const getSectionKey = (categoria, categoriaIndex, materialId = null) =>
  `${getCategoriaKey(categoria, categoriaIndex)}::${materialId ?? "comunes"}`;
const getProductoNivelId = (item) => item?.nivelId ?? item?.id_nivel ?? item?.nivel_id ?? item?.nivel?.id ?? null;
const getProductoMaterialId = (item) => item?.materialId ?? item?.id_material ?? item?.material_id ?? item?.material?.id ?? null;
const getMedidasKey = (materialId = null) => String(materialId ?? "comunes");
const TONES_CATEGORIA = [
  { bg: "#f4f8f6", border: "#bfd6cc", ink: "#21443b" },
  { bg: "#fff8f1", border: "#efd0ad", ink: "#5b3b1f" },
  { bg: "#f4f7fb", border: "#c8d7ed", ink: "#233a56" },
  { bg: "#f9f5fb", border: "#dac9e6", ink: "#432c55" }
];
const TONES_MATERIAL = [
  { bg: "#eef7f3", border: "#b9d9cc" },
  { bg: "#fff4e8", border: "#edc498" },
  { bg: "#eef4ff", border: "#bfd0ee" },
  { bg: "#f8f0f8", border: "#d9c0dc" },
  { bg: "#f4f7ec", border: "#ccd9ab" }
];
const getTone = (tones, index) => tones[index % tones.length];
const MEDIDAS_DEFAULT = {
  ancho: "",
  alto: "",
  fondo: "",
  pesoKg: "",
  pesoVolumetrico: "",
  dimensiones: ""
};

const getValorMedida = (item, key) => {
  const aliases = {
    pesoKg: ["pesoKg", "peso_kg"],
    pesoVolumetrico: ["pesoVolumetrico", "peso_volumetrico"]
  };
  const keys = aliases[key] || [key];
  for (const alias of keys) {
    const valor = item?.[alias];
    if (valor !== null && valor !== undefined) return valor;
  }
  return "";
};

const normalizarMedidas = (item = {}) => ({
  ancho: getValorMedida(item, "ancho"),
  alto: getValorMedida(item, "alto"),
  fondo: getValorMedida(item, "fondo"),
  pesoKg: getValorMedida(item, "pesoKg"),
  pesoVolumetrico: getValorMedida(item, "pesoVolumetrico"),
  dimensiones: item?.dimensiones ?? ""
});

const toNumeroONull = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const formatNumero = (valor, decimales = 2) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "-";
  return numero.toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
};

const formatCurrency = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "-";
  return numero.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const calcularSubtotalOperacion = (item) => {
  const tiempoOperacion = Number(getTiempoOperacion(item));
  const costoMinuto = Number(getCostoMinutoOperacion(item));
  const cantidad = Number(item?.cantidad ?? 1);
  if (!Number.isFinite(tiempoOperacion) || !Number.isFinite(costoMinuto) || !Number.isFinite(cantidad)) return 0;
  return tiempoOperacion * costoMinuto * cantidad;
};

const calcularMinutosOperacion = (item) => {
  const tiempoOperacion = Number(getTiempoOperacion(item));
  const cantidad = Number(item?.cantidad ?? 1);
  if (!Number.isFinite(tiempoOperacion) || !Number.isFinite(cantidad)) return 0;
  return tiempoOperacion * cantidad;
};

const formatTipoInsumo = (item) => {
  if (item?.conjunto) return "Conjunto";
  const tipo = String(getTipoInsumo(item) || "").trim();
  if (!tipo) return "-";

  const labels = {
    HERRAJES: "Herrajes",
    HERRERIA: "Herreria",
    PLASTICOS: "Plasticos",
    CARPINTERIA: "Carpinteria",
    PINTURA: "Pintura",
    TAPICERIA: "Tapiceria"
  };
  const key = tipo.toUpperCase().replaceAll(" ", "_");
  if (labels[key]) return labels[key];

  return tipo
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const normalizarInsumoParaCopiar = (item) => ({
  id: getId(item),
  codigo: item?.codigo ?? "",
  nombre: item?.nombre ?? "",
  unidadMedida: getUnidad(item),
  tipoInsumo: getTipoInsumo(item),
  materialId: getInsumoMaterialId(item),
  cantidad: item?.cantidad ?? "",
  desperdicioPorcentaje: getDesperdicio(item),
  costoCotizacion: getCostoCotizacion(item),
  costoCotizacionOriginal: item?.costoCotizacionOriginal ?? getCostoCotizacion(item),
  ...(item?.conjunto ? { conjunto: true, componentes: item.componentes || [] } : {})
});

const normalizarOperacionParaCopiar = (item) => ({
  id: getId(item),
  codigo: item?.codigo ?? "",
  nombre: item?.nombre ?? "",
  centroTrabajoNombre: item?.centroTrabajoNombre ?? item?.centro_trabajo_nombre ?? "",
  tiempoOperacion: getTiempoOperacion(item),
  costoMinuto: getCostoMinutoOperacion(item),
  cantidad: item?.cantidad ?? 1
});

const leerClipboardInsumos = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(INSUMOS_CLIPBOARD_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter((item) => getId(item) !== null && getId(item) !== undefined);
  } catch {
    return [];
  }
};

const leerClipboardOperaciones = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(OPERACIONES_CLIPBOARD_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter((item) => getId(item) !== null && getId(item) !== undefined);
  } catch {
    return [];
  }
};

function CatalogModal({ show, title, onClose, children }) {
  if (!show) return null;

  return createPortal(
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.55)", zIndex: 1120 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ModeloPlantillaProductivaFields({ modeloId, categorias = [], materiales = [], variantes = [], onCategoriasChange }) {
  const [catalogoInsumos, setCatalogoInsumos] = useState([]);
  const [insumosBuscados, setInsumosBuscados] = useState([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [catalogoOperaciones, setCatalogoOperaciones] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [cargandoBusquedaInsumos, setCargandoBusquedaInsumos] = useState(false);
  const [modalInsumoIndex, setModalInsumoIndex] = useState(null);
  const [modalOperacionIndex, setModalOperacionIndex] = useState(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState({});
  const [clipboardInsumos, setClipboardInsumos] = useState(() => leerClipboardInsumos());
  const [operacionesSeleccionadas, setOperacionesSeleccionadas] = useState({});
  const [clipboardOperaciones, setClipboardOperaciones] = useState(() => leerClipboardOperaciones());
  const [mensajePegado, setMensajePegado] = useState({});
  const [mensajeOperaciones, setMensajeOperaciones] = useState({});
  const [sincronizandoCategoria, setSincronizandoCategoria] = useState(null);
  const [sincronizandoMedidas, setSincronizandoMedidas] = useState(null);
  const [sincronizandoOperaciones, setSincronizandoOperaciones] = useState(null);
  const [operacionArrastrada, setOperacionArrastrada] = useState(null);
  const [panelesAbiertos, setPanelesAbiertos] = useState({});
  const [conjuntos, setConjuntos] = useState([]);
  const [modalConjuntos, setModalConjuntos] = useState(null);
  const [errorConjuntos, setErrorConjuntos] = useState("");
  const currentUser = getUser();
  const puedeVerConjuntos = hasPermission(currentUser, "VIEW_INPUT_SETS");
  const puedeCrearConjuntos = hasPermission(currentUser, "ACTION_INPUT_SETS_CREATE");
  const puedeEditarConjuntos = hasPermission(currentUser, "ACTION_INPUT_SETS_EDIT");

  useEffect(() => {
    if (!puedeVerConjuntos) {
      setConjuntos([]);
      setErrorConjuntos("");
      return undefined;
    }
    let vigente = true;
    const cargar = () => obtenerConjuntos().then((items) => {
      if (vigente) { setConjuntos(items.map(conjuntoComoInsumo)); setErrorConjuntos(""); }
    }).catch((e) => { if (vigente) setErrorConjuntos(e.message || "No se pudieron cargar los conjuntos"); });
    cargar();
    window.addEventListener("focus", cargar);
    return () => { vigente = false; window.removeEventListener("focus", cargar); };
  }, [puedeVerConjuntos]);

  useEffect(() => {
    let activo = true;
    Promise.all([
      obtenerInsumos({ activo: true, page: 0, size: 100, sortBy: "nombre", direction: "asc" }),
      obtenerOperacionesActivas()
    ])
      .then(([insumosRespuesta, operacionesRespuesta]) => {
        if (!activo) return;
        setCatalogoInsumos(getLista(insumosRespuesta));
        setCatalogoOperaciones(getLista(operacionesRespuesta));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const termino = busquedaInsumo.trim();
    if (!termino) {
      setInsumosBuscados([]);
      setCargandoBusquedaInsumos(false);
      return undefined;
    }

    let cancelado = false;
    const timer = window.setTimeout(async () => {
      try {
        setCargandoBusquedaInsumos(true);
        const data = await obtenerInsumos({
          activo: true,
          busqueda: termino,
          page: 0,
          size: 100,
          sortBy: "nombre",
          direction: "asc"
        });
        if (!cancelado) {
          const lista = getLista(data);
          setInsumosBuscados(lista);
          setCatalogoInsumos((actual) => mergePorId(actual, lista));
        }
      } catch (errorBusqueda) {
        if (!cancelado) {
          console.error("Error buscando insumos:", errorBusqueda);
          setInsumosBuscados([]);
        }
      } finally {
        if (!cancelado) setCargandoBusquedaInsumos(false);
      }
    }, 250);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [busquedaInsumo]);

  const catalogoInsumosDisponible = useMemo(
    () => mergePorId(catalogoInsumos, insumosBuscados, conjuntos),
    [catalogoInsumos, insumosBuscados, conjuntos]
  );

  const actualizarCategoria = (index, updater) => {
    onCategoriasChange?.(
      categorias.map((categoria, actualIndex) => (actualIndex === index ? updater(categoria) : categoria))
    );
  };

  const getSeleccionadosCategoria = (categoria, categoriaIndex, materialId = null) => {
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    return insumosSeleccionados[sectionKey] || {};
  };

  const limpiarSeleccionCategoria = (categoria, categoriaIndex, materialId = null) => {
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    setInsumosSeleccionados((prev) => {
      if (!prev[sectionKey]) return prev;
      const siguiente = { ...prev };
      delete siguiente[sectionKey];
      return siguiente;
    });
  };

  const getOperacionesKey = (categoria, categoriaIndex) => getCategoriaKey(categoria, categoriaIndex);

  const getSeleccionOperaciones = (categoria, categoriaIndex) => {
    const sectionKey = getOperacionesKey(categoria, categoriaIndex);
    return operacionesSeleccionadas[sectionKey] || {};
  };

  const limpiarSeleccionOperaciones = (categoria, categoriaIndex) => {
    const sectionKey = getOperacionesKey(categoria, categoriaIndex);
    setOperacionesSeleccionadas((prev) => {
      if (!prev[sectionKey]) return prev;
      const siguiente = { ...prev };
      delete siguiente[sectionKey];
      return siguiente;
    });
  };

  const toggleInsumoSeleccionado = (categoria, categoriaIndex, item, materialId = null) => {
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const insumoKey = getInsumoScopeKey(item);

    setInsumosSeleccionados((prev) => {
      const seleccionCategoria = { ...(prev[sectionKey] || {}) };
      if (seleccionCategoria[insumoKey]) {
        delete seleccionCategoria[insumoKey];
      } else {
        seleccionCategoria[insumoKey] = true;
      }

      return {
        ...prev,
        [sectionKey]: seleccionCategoria
      };
    });
  };

  const toggleTodosInsumos = (categoria, categoriaIndex, insumos, materialId = null) => {
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const seleccionCategoria = insumosSeleccionados[sectionKey] || {};
    const todosSeleccionados =
      insumos.length > 0 && insumos.every((item) => seleccionCategoria[getInsumoScopeKey(item)]);

    setInsumosSeleccionados((prev) => ({
      ...prev,
      [sectionKey]: todosSeleccionados
        ? {}
        : Object.fromEntries(insumos.map((item) => [getInsumoScopeKey(item), true]).filter(([key]) => key))
    }));
  };

  const toggleOperacionSeleccionada = (categoria, categoriaIndex, item) => {
    const sectionKey = getOperacionesKey(categoria, categoriaIndex);
    const operacionKey = String(getId(item));

    setOperacionesSeleccionadas((prev) => {
      const seleccionCategoria = { ...(prev[sectionKey] || {}) };
      if (seleccionCategoria[operacionKey]) {
        delete seleccionCategoria[operacionKey];
      } else {
        seleccionCategoria[operacionKey] = true;
      }

      return {
        ...prev,
        [sectionKey]: seleccionCategoria
      };
    });
  };

  const toggleTodasOperaciones = (categoria, categoriaIndex, operaciones) => {
    const sectionKey = getOperacionesKey(categoria, categoriaIndex);
    const seleccionCategoria = operacionesSeleccionadas[sectionKey] || {};
    const todasSeleccionadas =
      operaciones.length > 0 && operaciones.every((item) => seleccionCategoria[String(getId(item))]);

    setOperacionesSeleccionadas((prev) => ({
      ...prev,
      [sectionKey]: todasSeleccionadas
        ? {}
        : Object.fromEntries(operaciones.map((item) => [String(getId(item)), true]).filter(([key]) => key))
    }));
  };

  const copiarInsumosSeleccionados = (categoria, categoriaIndex, materialId = null) => {
    const seleccionCategoria = getSeleccionadosCategoria(categoria, categoriaIndex, materialId);
    const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
    const insumosSeccion = insumos.filter((item) => String(getInsumoMaterialId(item) ?? "") === String(materialId ?? ""));
    const copiados = insumos
      .filter((item) => insumosSeccion.includes(item) && seleccionCategoria[getInsumoScopeKey(item)])
      .map(normalizarInsumoParaCopiar);

    if (!copiados.length) return;

    try {
      window.localStorage.setItem(INSUMOS_CLIPBOARD_KEY, JSON.stringify(copiados));
    } catch {
      // Si el navegador bloquea localStorage, el portapapeles sigue vivo en memoria.
    }

    setClipboardInsumos(copiados);
    setMensajePegado((prev) => ({
      ...prev,
      [getSectionKey(categoria, categoriaIndex, materialId)]: `${copiados.length} insumo${copiados.length === 1 ? "" : "s"} copiado${copiados.length === 1 ? "" : "s"}.`
    }));
  };

  const pegarInsumos = (categoriaIndex, materialId = null) => {
    const copiados = clipboardInsumos.length ? clipboardInsumos : leerClipboardInsumos();
    const categoriaActual = categorias[categoriaIndex];
    const sectionKey = getSectionKey(categoriaActual, categoriaIndex, materialId);

    if (!copiados.length) return;

    let agregados = 0;
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.insumos) ? categoria.insumos : [];
      const idsActuales = new Set(
        actuales
          .filter((item) => String(getInsumoMaterialId(item) ?? "") === String(materialId ?? ""))
          .map((item) => String(getId(item)))
      );
      const nuevos = copiados
        .filter((item) => !idsActuales.has(String(getId(item))))
        .map((item) => ({
          ...item,
          id: getId(item),
          materialId,
          conjunto: Boolean(item.conjunto),
          tipoInsumo: getTipoInsumo(item),
          cantidad: item.cantidad ?? "",
          desperdicioPorcentaje: getDesperdicio(item),
          costoCotizacion: getCostoCotizacion(item),
          costoCotizacionOriginal: item.costoCotizacionOriginal ?? getCostoCotizacion(item)
        }));

      agregados = nuevos.length;
      if (!agregados) return categoria;

      return {
        ...categoria,
        insumos: [...actuales, ...nuevos]
      };
    });

    setClipboardInsumos(copiados);
    setMensajePegado((prev) => ({
      ...prev,
      [sectionKey]: agregados
        ? `${agregados} insumo${agregados === 1 ? "" : "s"} pegado${agregados === 1 ? "" : "s"}.`
        : "No se pego ningun insumo porque ya estaban en esta categoria."
    }));

    if (agregados) {
      limpiarSeleccionCategoria(categoriaActual, categoriaIndex, materialId);
    }
  };

  const copiarOperacionesSeleccionadas = (categoria, categoriaIndex) => {
    const seleccionCategoria = getSeleccionOperaciones(categoria, categoriaIndex);
    const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
    const copiados = operaciones
      .filter((item) => seleccionCategoria[String(getId(item))])
      .map(normalizarOperacionParaCopiar);

    if (!copiados.length) return;

    try {
      window.localStorage.setItem(OPERACIONES_CLIPBOARD_KEY, JSON.stringify(copiados));
    } catch {
      // Si el navegador bloquea localStorage, el portapapeles sigue vivo en memoria.
    }

    setClipboardOperaciones(copiados);
    setMensajeOperaciones((prev) => ({
      ...prev,
      [categoriaIndex]: `${copiados.length} operacion${copiados.length === 1 ? "" : "es"} copiada${copiados.length === 1 ? "" : "s"}.`
    }));
  };

  const pegarOperaciones = (categoriaIndex) => {
    const copiados = clipboardOperaciones.length ? clipboardOperaciones : leerClipboardOperaciones();
    const categoriaActual = categorias[categoriaIndex];

    if (!copiados.length) return;

    let agregadas = 0;
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
      const idsActuales = new Set(actuales.map((item) => String(getId(item))));
      const nuevas = copiados
        .filter((item) => !idsActuales.has(String(getId(item))))
        .map((item) => ({
          ...item,
          id: getId(item),
          centroTrabajoNombre: item.centroTrabajoNombre ?? item.centro_trabajo_nombre ?? "",
          tiempoOperacion: getTiempoOperacion(item),
          costoMinuto: getCostoMinutoOperacion(item),
          cantidad: item.cantidad ?? 1
        }));

      agregadas = nuevas.length;
      if (!agregadas) return categoria;

      return {
        ...categoria,
        operaciones: [...actuales, ...nuevas]
      };
    });

    setClipboardOperaciones(copiados);
    setMensajeOperaciones((prev) => ({
      ...prev,
      [categoriaIndex]: agregadas
        ? `${agregadas} operacion${agregadas === 1 ? "" : "es"} pegada${agregadas === 1 ? "" : "s"}.`
        : "No se pego ninguna operacion porque ya estaba en esta categoria."
    }));

    if (agregadas) {
      limpiarSeleccionOperaciones(categoriaActual, categoriaIndex);
    }
  };

  const agregarInsumo = (categoriaIndex, id, opcion, materialId = null) => {
    if (categoriaIndex === null || categoriaIndex === undefined || !id) return;
    const insumo = opcion || catalogoInsumosDisponible.find((item) => String(getId(item)) === String(id)) || { id };
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.insumos) ? categoria.insumos : [];
      if (actuales.some((item) =>
        String(getId(item)) === String(getId(insumo)) && String(getInsumoMaterialId(item) ?? "") === String(materialId ?? "")
      )) return categoria;
      return {
        ...categoria,
        insumos: [...actuales, {
          ...insumo,
          id: getId(insumo),
          materialId,
          conjunto: Boolean(insumo.conjunto),
          tipoInsumo: getTipoInsumo(insumo),
          cantidad: insumo.cantidad ?? (insumo.conjunto ? 1 : ""),
          desperdicioPorcentaje: getDesperdicio(insumo),
          costoCotizacion: getCostoCotizacion(insumo),
          costoCotizacionOriginal: insumo.costoCotizacionOriginal ?? getCostoCotizacion(insumo)
        }]
      };
    });
    setSelecciones((prev) => ({ ...prev, [`insumo-${categoriaIndex}-${materialId ?? "comunes"}`]: "" }));
  };

  const agregarOperacion = (categoriaIndex, id, opcion) => {
    if (categoriaIndex === null || categoriaIndex === undefined || !id) return;
    const operacion = opcion || catalogoOperaciones.find((item) => String(getId(item)) === String(id)) || { id };
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
      if (actuales.some((item) => String(getId(item)) === String(getId(operacion)))) return categoria;
      return {
        ...categoria,
        operaciones: [...actuales, { ...operacion, id: getId(operacion), cantidad: operacion.cantidad ?? 1 }]
      };
    });
    setSelecciones((prev) => ({ ...prev, [`operacion-${categoriaIndex}`]: "" }));
  };

  const actualizarCantidadInsumo = (categoriaIndex, insumoId, cantidad, materialId = null) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) && String(getInsumoMaterialId(item) ?? "") === String(materialId ?? "") ? { ...item, cantidad } : item
      )
    }));
  };

  const actualizarDesperdicioInsumo = (categoriaIndex, insumoId, desperdicioPorcentaje, materialId = null) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) && String(getInsumoMaterialId(item) ?? "") === String(materialId ?? "") ? { ...item, desperdicioPorcentaje } : item
      )
    }));
  };

  const actualizarCostoInsumo = (categoriaIndex, insumoId, costoCotizacion, materialId = null) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) && String(getInsumoMaterialId(item) ?? "") === String(materialId ?? "") ? { ...item, costoCotizacion } : item
      )
    }));
  };

  const obtenerMedidasSeccion = (categoria, materialId = null) => {
    const key = getMedidasKey(materialId);
    const medidasGuardadas = categoria?.medidasPorMaterial?.[key];
    if (medidasGuardadas) return { ...MEDIDAS_DEFAULT, ...medidasGuardadas };

    const variante = variantes.find((item) =>
      String(getProductoNivelId(item) ?? "") === String(categoria?.id ?? "")
      && String(getProductoMaterialId(item) ?? "") === String(materialId ?? "")
    );

    return variante ? normalizarMedidas(variante) : MEDIDAS_DEFAULT;
  };

  const actualizarMedidaSeccion = (categoriaIndex, materialId, campo, valor) => {
    actualizarCategoria(categoriaIndex, (categoria) => {
      const key = getMedidasKey(materialId);
      const actuales = obtenerMedidasSeccion(categoria, materialId);

      return {
        ...categoria,
        medidasPorMaterial: {
          ...(categoria.medidasPorMaterial || {}),
          [key]: {
            ...actuales,
            [campo]: valor
          }
        }
      };
    });
  };

  const actualizarCantidadOperacion = (categoriaIndex, operacionId, cantidad) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      operaciones: (categoria.operaciones || []).map((item) =>
        String(getId(item)) === String(operacionId) ? { ...item, cantidad } : item
      )
    }));
  };

  const quitarInsumo = (categoriaIndex, insumoId, materialId = null) => {
    const categoriaActual = categorias[categoriaIndex];
    const sectionKey = getSectionKey(categoriaActual, categoriaIndex, materialId);
    const insumoKey = `${materialId ?? "comun"}::${insumoId}`;
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).filter((item) =>
        !(String(getId(item)) === String(insumoId) && String(getInsumoMaterialId(item) ?? "") === String(materialId ?? ""))
      )
    }));
    setInsumosSeleccionados((prev) => {
      if (!prev[sectionKey]?.[insumoKey]) return prev;
      const seleccionCategoria = { ...prev[sectionKey] };
      delete seleccionCategoria[insumoKey];
      return {
        ...prev,
        [sectionKey]: seleccionCategoria
      };
    });
  };

  const quitarOperacion = (categoriaIndex, operacionId) => {
    const categoriaActual = categorias[categoriaIndex];
    const sectionKey = getOperacionesKey(categoriaActual, categoriaIndex);
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      operaciones: (categoria.operaciones || []).filter((item) => String(getId(item)) !== String(operacionId))
    }));
    setOperacionesSeleccionadas((prev) => {
      if (!prev[sectionKey]?.[String(operacionId)]) return prev;
      const seleccionCategoria = { ...prev[sectionKey] };
      delete seleccionCategoria[String(operacionId)];
      return {
        ...prev,
        [sectionKey]: seleccionCategoria
      };
    });
  };

  const sincronizarVariantes = async (categoria, categoriaIndex, materialId = null, titulo = "Insumos comunes") => {
    const nivelId = categoria?.id;
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
    const payload = insumos
      .map((item) => ({
        id: Number(getId(item)),
        materialId: getInsumoMaterialId(item) ? Number(getInsumoMaterialId(item)) : null,
        conjunto: Boolean(item.conjunto),
        cantidad: Number(item.cantidad),
        desperdicioPorcentaje: Number(getDesperdicio(item) || 0)
      }))
      .filter((item) => Number.isFinite(item.id));

    if (!modeloId || !nivelId) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: "Guarda el modelo antes de sincronizar esta seccion con sus variantes."
      }));
      return;
    }

    if (payload.some((item) => !Number.isFinite(item.cantidad) || item.cantidad <= 0)) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: "Cada insumo debe tener cantidad mayor a cero antes de sincronizar."
      }));
      return;
    }

    if (payload.some((item) => !Number.isFinite(item.desperdicioPorcentaje) || item.desperdicioPorcentaje < 0)) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: "Cada insumo debe tener desperdicio mayor o igual a cero antes de sincronizar."
      }));
      return;
    }

    const alcance = materialId ? `las variantes de ${titulo}` : "todas las variantes de esta categoria";
    if (!window.confirm(`Se reemplazaran los insumos de ${alcance} con la plantilla actual. Se eliminaran los que ya no esten y se actualizaran cantidades. Deseas continuar?`)) {
      return;
    }

    try {
      setSincronizandoCategoria(sectionKey);
      const resultado = await sincronizarInsumosVariantes(modeloId, nivelId, payload, materialId);
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: `Variantes sincronizadas: ${resultado.productosActualizados || 0}. Agregados: ${resultado.insumosAgregados || 0}, actualizados: ${resultado.insumosActualizados || 0}, eliminados: ${resultado.insumosEliminados || 0}.`
      }));
    } catch (errorSincronizacion) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: errorSincronizacion.message || "No se pudieron sincronizar las variantes."
      }));
    } finally {
      setSincronizandoCategoria(null);
    }
  };

  const sincronizarMedidasSeccion = async (categoria, categoriaIndex, materialId = null, titulo = "Insumos comunes") => {
    const nivelId = categoria?.id;
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const medidas = obtenerMedidasSeccion(categoria, materialId);
    const payload = {
      ancho: toNumeroONull(medidas.ancho),
      alto: toNumeroONull(medidas.alto),
      fondo: toNumeroONull(medidas.fondo),
      pesoKg: toNumeroONull(medidas.pesoKg),
      pesoVolumetrico: toNumeroONull(medidas.pesoVolumetrico),
      dimensiones: medidas.dimensiones?.trim() || null
    };

    const medidaInvalida = Object.entries(payload)
      .filter(([key]) => key !== "dimensiones")
      .find(([, value]) => Number.isNaN(value) || value < 0);

    if (!modeloId || !nivelId) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: "Guarda el modelo antes de sincronizar medidas con sus variantes."
      }));
      return;
    }

    if (medidaInvalida) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: "Las medidas y pesos deben ser numeros mayores o iguales a cero."
      }));
      return;
    }

    try {
      setSincronizandoMedidas(sectionKey);
      const resultado = await sincronizarMedidasVariantes(modeloId, nivelId, payload, materialId);
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: `Medidas sincronizadas en ${resultado.productosActualizados || 0} variante${resultado.productosActualizados === 1 ? "" : "s"} de ${titulo}.`
      }));
    } catch (errorSincronizacion) {
      setMensajePegado((prev) => ({
        ...prev,
        [sectionKey]: errorSincronizacion.message || "No se pudieron sincronizar las medidas."
      }));
    } finally {
      setSincronizandoMedidas(null);
    }
  };

  const sincronizarOperacionesCategoria = async (categoria, categoriaIndex) => {
    const nivelId = categoria?.id;
    const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
    const payload = operaciones
      .map((item, index) => ({
        id: Number(getId(item)),
        cantidad: Number(item.cantidad ?? 1),
        orden: index + 1
      }))
      .filter((item) => Number.isFinite(item.id));

    if (!modeloId || !nivelId) {
      setMensajeOperaciones((prev) => ({
        ...prev,
        [categoriaIndex]: "Guarda el modelo antes de sincronizar operaciones con sus variantes."
      }));
      return;
    }

    if (payload.some((item) => !Number.isInteger(item.cantidad) || item.cantidad < 1)) {
      setMensajeOperaciones((prev) => ({
        ...prev,
        [categoriaIndex]: "Cada operacion debe tener cantidad entera de al menos 1 antes de sincronizar."
      }));
      return;
    }

    if (!window.confirm("Se reemplazaran las operaciones de todas las variantes de esta categoria con la plantilla actual. Se eliminaran las que ya no esten y se actualizaran cantidades. Deseas continuar?")) {
      return;
    }

    try {
      setSincronizandoOperaciones(categoriaIndex);
      const resultado = await sincronizarOperacionesVariantes(modeloId, nivelId, payload);
      setMensajeOperaciones((prev) => ({
        ...prev,
        [categoriaIndex]: `Operaciones sincronizadas: ${resultado.productosActualizados || 0}. Agregadas: ${resultado.operacionesAgregadas || 0}, actualizadas: ${resultado.operacionesActualizadas || 0}, eliminadas: ${resultado.operacionesEliminadas || 0}.`
      }));
    } catch (errorSincronizacion) {
      setMensajeOperaciones((prev) => ({
        ...prev,
        [categoriaIndex]: errorSincronizacion.message || "No se pudieron sincronizar las operaciones."
      }));
    } finally {
      setSincronizandoOperaciones(null);
    }
  };

  const reordenarOperacion = (categoriaIndex, origenIndex, destinoIndex) => {
    actualizarCategoria(categoriaIndex, (categoria) => {
      const operaciones = [...(categoria.operaciones || [])];
      if (
        origenIndex === destinoIndex
        || origenIndex < 0
        || destinoIndex < 0
        || origenIndex >= operaciones.length
        || destinoIndex >= operaciones.length
      ) {
        return categoria;
      }
      const [movida] = operaciones.splice(origenIndex, 1);
      operaciones.splice(destinoIndex, 0, movida);
      return { ...categoria, operaciones };
    });
  };

  const handleOperacionDragStart = (event, categoriaIndex, operacionIndex) => {
    setOperacionArrastrada({ categoriaIndex, operacionIndex });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${categoriaIndex}:${operacionIndex}`);
  };

  const handleOperacionDrop = (event, categoriaIndex, destinoIndex) => {
    event.preventDefault();
    const [origenCategoria, origenOperacion] = event.dataTransfer.getData("text/plain").split(":").map(Number);
    const origen = operacionArrastrada || { categoriaIndex: origenCategoria, operacionIndex: origenOperacion };
    if (origen.categoriaIndex === categoriaIndex) {
      reordenarOperacion(categoriaIndex, origen.operacionIndex, destinoIndex);
    }
    setOperacionArrastrada(null);
  };

  const alternarPanel = (event, panelKey) => {
    event.preventDefault();
    setPanelesAbiertos((actual) => ({ ...actual, [panelKey]: !actual[panelKey] }));
  };

  const renderOperacionesSection = (categoria, categoriaIndex, panelScopeKey) => {
    const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
    const operacionesDisponibles = catalogoOperaciones.filter(
      (item) => !operaciones.some((seleccionada) => String(getId(seleccionada)) === String(getId(item)))
    );
    const totalOperacionesSeccion = operaciones.reduce((total, item) => total + calcularSubtotalOperacion(item), 0);
    const totalMinutosFabricacion = operaciones.reduce((total, item) => total + calcularMinutosOperacion(item), 0);
    const operacionesInvalidas = operaciones.some((item) => {
      const cantidad = Number(item.cantidad ?? 1);
      return !Number.isInteger(cantidad) || cantidad < 1;
    });
    const seleccionOperacionesCategoria = getSeleccionOperaciones(categoria, categoriaIndex);
    const totalOperacionesSeleccionadas = operaciones.filter((item) => seleccionOperacionesCategoria[String(getId(item))]).length;
    const todasOperacionesSeleccionadas =
      operaciones.length > 0 && operaciones.every((item) => seleccionOperacionesCategoria[String(getId(item))]);
    const sincronizandoOperacionesActual = sincronizandoOperaciones === categoriaIndex;
    const operacionesPanelKey = `operaciones-${panelScopeKey}`;

    return (
      <details
        className="modelo-operaciones-section"
        aria-label={`Operaciones de ${categoria.nombre || categoriaIndex + 1}`}
        open={Boolean(panelesAbiertos[operacionesPanelKey])}
      >
        <summary className="modelo-panel-summary modelo-operaciones-summary" onClick={(event) => alternarPanel(event, operacionesPanelKey)}>
          <i className="bi bi-chevron-down modelo-chevron modelo-chevron-down" aria-hidden="true"></i>
          <i className="bi bi-chevron-up modelo-chevron modelo-chevron-up" aria-hidden="true"></i>
          <span className="fw-semibold">Operaciones</span>
          <span className="text-muted small">{operaciones.length} capturadas</span>
          <span className="fw-semibold ms-auto">{formatNumero(totalMinutosFabricacion)} min</span>
          <span className="fw-semibold">{formatCurrency(totalOperacionesSeccion)}</span>
        </summary>
        <div className="modelo-operaciones-body">
          <div className="d-flex justify-content-end align-items-center gap-2 mb-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {totalOperacionesSeleccionadas > 0 && (
                <span className="badge text-bg-light border">{totalOperacionesSeleccionadas} seleccionadas</span>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => copiarOperacionesSeleccionadas(categoria, categoriaIndex)}
                disabled={!totalOperacionesSeleccionadas}
                aria-label="Copiar operaciones seleccionadas"
              >
                <i className="bi bi-clipboard me-1"></i>Copiar seleccionadas
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => pegarOperaciones(categoriaIndex)}
                disabled={!clipboardOperaciones.length}
                aria-label="Pegar operaciones"
              >
                <i className="bi bi-clipboard-plus me-1"></i>Pegar
              </button>
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={() => sincronizarOperacionesCategoria(categoria, categoriaIndex)}
                disabled={!modeloId || !categoria.id || operacionesInvalidas || sincronizandoOperacionesActual}
                title={!modeloId || !categoria.id ? "Guarda el modelo antes de sincronizar operaciones" : operacionesInvalidas ? "Corrige cantidades antes de sincronizar" : "Sincronizar operaciones en variantes"}
              >
                <i className="bi bi-arrow-repeat me-1"></i>{sincronizandoOperacionesActual ? "Sincronizando..." : "Sincronizar variantes"}
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalOperacionIndex(categoriaIndex)}>
                <i className="bi bi-plus-lg me-1"></i>Nueva operacion
              </button>
            </div>
          </div>
          <SearchableSelect
            label=""
            value={selecciones[`operacion-${categoriaIndex}`] || ""}
            options={operacionesDisponibles}
            onChange={(id, opcion) => agregarOperacion(categoriaIndex, id, opcion)}
            closeOnSelect={false}
            loading={cargando}
            placeholder={cargando ? "Cargando operaciones..." : "Buscar y agregar operacion..."}
            searchPlaceholder="Busca por codigo, nombre o centro..."
            getOptionValue={getId}
            getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
            getOptionSearchText={(item) => [item.codigo, item.nombre, item.centroTrabajoNombre].filter(Boolean).join(" ").toLowerCase()}
          />
          {mensajeOperaciones[categoriaIndex] && <div className="form-text text-muted mt-1">{mensajeOperaciones[categoriaIndex]}</div>}

          <div className="table-responsive mt-2">
            <table className="table table-sm align-middle mb-0">
              {operaciones.length > 0 && (
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 44 }}></th>
                    <th style={{ width: 44 }}></th>
                    <th>Operacion</th>
                    <th className="text-end" style={{ width: 125 }}>Min/op.</th>
                    <th className="text-end" style={{ width: 125 }}>Costo/min</th>
                    <th className="text-end" style={{ width: 135 }}>Cantidad</th>
                    <th className="text-end" style={{ width: 125 }}>Subtotal</th>
                    <th className="text-end" style={{ width: 78 }}></th>
                  </tr>
                </thead>
              )}
              <tbody>
                {operaciones.length > 0 && (
                  <tr>
                    <td style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={todasOperacionesSeleccionadas}
                        onChange={() => toggleTodasOperaciones(categoria, categoriaIndex, operaciones)}
                        aria-label={`Seleccionar todas las operaciones de ${categoria.nombre || categoriaIndex + 1}`}
                      />
                    </td>
                    <td colSpan={7}>
                      <span className="text-muted small">Seleccionar todas</span>
                    </td>
                  </tr>
                )}
                {operaciones.map((item, index) => {
                  const tiempoOperacion = Number(getTiempoOperacion(item));
                  const costoMinuto = Number(getCostoMinutoOperacion(item));
                  const subtotal = calcularSubtotalOperacion(item);
                  return (
                    <tr key={getId(item)}>
                      <td style={{ width: 44 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={Boolean(seleccionOperacionesCategoria[String(getId(item))])}
                          onChange={() => toggleOperacionSeleccionada(categoria, categoriaIndex, item)}
                          aria-label={`Seleccionar operacion ${item.nombre || getId(item)}`}
                        />
                      </td>
                      <td
                        style={{ width: 44 }}
                        draggable
                        onDragStart={(event) => handleOperacionDragStart(event, categoriaIndex, index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleOperacionDrop(event, categoriaIndex, index)}
                        onDragEnd={() => setOperacionArrastrada(null)}
                      >
                        <span
                          className="modelo-drag-handle"
                          title="Arrastrar operacion"
                          aria-label={`Arrastrar operacion ${index + 1}`}
                        >
                          <i className="bi bi-grip-vertical"></i>
                          <span className="badge text-bg-secondary">{index + 1}</span>
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold">{item.codigo ? `[${item.codigo}] ` : ""}{item.nombre || `Operacion ${getId(item)}`}</span>
                        {item.centroTrabajoNombre && <span className="text-muted ms-2">{item.centroTrabajoNombre}</span>}
                      </td>
                      <td className="text-end" style={{ width: 125 }}>{formatNumero(tiempoOperacion)} min</td>
                      <td className="text-end" style={{ width: 125 }}>{formatCurrency(costoMinuto)}</td>
                      <td style={{ width: 135 }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="form-control form-control-sm text-end"
                          value={item.cantidad ?? 1}
                          data-modelo-categoria-index={categoriaIndex}
                          data-modelo-operacion-id={getId(item)}
                          data-modelo-operacion-campo="cantidad"
                          onChange={(event) => actualizarCantidadOperacion(categoriaIndex, getId(item), event.target.value)}
                          placeholder="Cantidad"
                        />
                      </td>
                      <td className="text-end fw-semibold" style={{ width: 125 }}>{formatCurrency(subtotal)}</td>
                      <td className="text-end" style={{ width: 78 }}>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarOperacion(categoriaIndex, getId(item))}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {operaciones.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={3} className="text-end fw-bold">TOTAL MINUTOS:</td>
                    <td className="text-end fw-bold">{formatNumero(totalMinutosFabricacion)} min</td>
                    <td colSpan={2} className="text-end fw-bold">TOTAL OPERACIONES:</td>
                    <td className="text-end fw-bold">{formatCurrency(totalOperacionesSeccion)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!operaciones.length && <div className="form-text text-muted">Sin operaciones capturadas para esta categoria.</div>}
          </div>
        </div>
      </details>
    );
  };

  const renderInsumosSection = (categoria, categoriaIndex, material = null, materialIndex = 0) => {
    const materialId = material ? getMaterialId(material) : null;
    const materialKey = materialId ?? "comunes";
    const insumos = (Array.isArray(categoria.insumos) ? categoria.insumos : [])
      .filter((item) => String(getInsumoMaterialId(item) ?? "") === String(materialId ?? ""))
      .map((item) => {
        const vigente = conjuntos.find((c) => String(c.id) === String(getId(item)));
        return vigente ? { ...item, nombre: vigente.nombre, conjunto: true, componentes: vigente.componentes,
          costoCotizacion: vigente.costoCotizacion, unidadMedida: vigente.unidadMedida } : item;
      });
    const insumosDisponibles = catalogoInsumosDisponible.filter(
      (item) => !insumos.some((seleccionado) => String(getId(seleccionado)) === String(getId(item)))
    );
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const seleccionInsumosCategoria = getSeleccionadosCategoria(categoria, categoriaIndex, materialId);
    const totalSeleccionados = insumos.filter((item) => seleccionInsumosCategoria[getInsumoScopeKey(item)]).length;
    const todosInsumosSeleccionados =
      insumos.length > 0 && insumos.every((item) => seleccionInsumosCategoria[getInsumoScopeKey(item)]);
    const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
    const titulo = material ? getMaterialLabel(material) : "Insumos comunes";
    const medidas = obtenerMedidasSeccion(categoria, materialId);
    const insumosInvalidos = insumos.some((item) => {
      const cantidad = Number(item.cantidad);
      const desperdicio = Number(getDesperdicio(item) || 0);
      return !Number.isFinite(cantidad) || cantidad <= 0
        || !Number.isFinite(desperdicio) || desperdicio < 0;
    });
    const puedeSincronizar = Boolean(modeloId && categoria.id) && !insumosInvalidos;
    const sincronizando = sincronizandoCategoria === sectionKey;
    const sincronizandoMedidasSeccionActual = sincronizandoMedidas === sectionKey;
    const totalInsumosId = `total-insumos-${sectionKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const calcularSubtotalInsumo = (item) => {
      const cantidad = Number(item.cantidad || 0);
      const desperdicio = Number(getDesperdicio(item) || 0);
      const costo = Number(getCostoCotizacion(item) || 0);
      return cantidad * (1 + desperdicio / 100) * costo;
    };
    const totalInsumosSeccion = insumos.reduce((total, item) => total + calcularSubtotalInsumo(item), 0);
    const totalInsumosFormateado = totalInsumosSeccion.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
    const materialTone = getTone(TONES_MATERIAL, materialIndex);

    return (
      <details
        key={materialKey}
        className="modelo-material-panel"
        role="group"
        aria-label={`Material ${titulo}`}
        open={Boolean(panelesAbiertos[`material-${sectionKey}`])}
        style={{ "--material-bg": materialTone.bg, "--material-border": materialTone.border }}
      >
        <summary className="modelo-panel-summary modelo-material-summary" onClick={(event) => alternarPanel(event, `material-${sectionKey}`)}>
          <i className="bi bi-chevron-down modelo-chevron modelo-chevron-down" aria-hidden="true"></i>
          <i className="bi bi-chevron-up modelo-chevron modelo-chevron-up" aria-hidden="true"></i>
          <span className="fw-semibold">{titulo}</span>
          <span className="text-muted small">{insumos.length} insumos</span>
          <span className="text-muted small">{operaciones.length} operaciones</span>
          <span className="fw-semibold ms-auto">{totalInsumosFormateado}</span>
        </summary>
        <div className="modelo-material-body">
        <div className="border rounded-3 p-3 mb-3 bg-light">
          <div className="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">
            <label className="form-label fw-semibold mb-0">Medidas y pesos</label>
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => sincronizarMedidasSeccion(categoria, categoriaIndex, materialId, titulo)}
              disabled={!modeloId || !categoria.id || sincronizandoMedidasSeccionActual}
              title={!modeloId || !categoria.id ? "Guarda el modelo antes de sincronizar medidas" : "Sincronizar medidas y pesos en variantes"}
            >
              <i className="bi bi-rulers me-1"></i>{sincronizandoMedidasSeccionActual ? "Sincronizando..." : "Sincronizar medidas"}
            </button>
          </div>
          <div className="row g-2">
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Ancho</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                value={medidas.ancho ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "ancho", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Alto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                value={medidas.alto ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "alto", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Fondo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                value={medidas.fondo ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "fondo", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Peso kg</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                value={medidas.pesoKg ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "pesoKg", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Peso vol.</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                value={medidas.pesoVolumetrico ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "pesoVolumetrico", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label small text-muted mb-1">Dimensiones</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={medidas.dimensiones ?? ""}
                onChange={(event) => actualizarMedidaSeccion(categoriaIndex, materialId, "dimensiones", event.target.value)}
                maxLength="100"
                placeholder="Auto"
              />
            </div>
          </div>
        </div>

        <details
          className="modelo-subpanel modelo-insumos-section"
          aria-label={`Insumos de ${titulo}`}
          open={Boolean(panelesAbiertos[`insumos-${sectionKey}`])}
        >
          <summary className="modelo-panel-summary modelo-subpanel-summary" onClick={(event) => alternarPanel(event, `insumos-${sectionKey}`)}>
            <i className="bi bi-chevron-down modelo-chevron modelo-chevron-down" aria-hidden="true"></i>
            <i className="bi bi-chevron-up modelo-chevron modelo-chevron-up" aria-hidden="true"></i>
            <span className="fw-semibold">Insumos</span>
            <span className="text-muted small">{insumos.length} capturados</span>
            <span className="fw-semibold ms-auto">{totalInsumosFormateado}</span>
          </summary>
          <div className="modelo-subpanel-body">
        <section
          className="border p-3"
          aria-label={`Detalle de insumos de ${titulo}`}
          style={{ backgroundColor: "#f0f6f3", borderRadius: 8, minWidth: 0 }}
        >
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
          <h3 className="fs-6 fw-semibold mb-0">Insumos</h3>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label small text-muted mb-0" htmlFor={totalInsumosId}>Total insumos</label>
            <input
              id={totalInsumosId}
              className="form-control form-control-sm text-end fw-semibold"
              value={totalInsumosFormateado}
              readOnly
              style={{ width: 140 }}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end align-items-center gap-2 mb-2 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {totalSeleccionados > 0 && (
              <span className="badge text-bg-light border">{totalSeleccionados} seleccionados</span>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => copiarInsumosSeleccionados(categoria, categoriaIndex, materialId)}
              disabled={!totalSeleccionados}
              aria-label="Copiar insumos seleccionados"
            >
              <i className="bi bi-clipboard me-1"></i>Copiar seleccionados
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => pegarInsumos(categoriaIndex, materialId)}
              disabled={!clipboardInsumos.length}
              aria-label="Pegar insumos"
            >
              <i className="bi bi-clipboard-plus me-1"></i>Pegar
            </button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalInsumoIndex({ categoriaIndex, materialId })}>
              <i className="bi bi-plus-lg me-1"></i>Nuevo insumo
            </button>
            {puedeVerConjuntos && (
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalConjuntos({ categoriaIndex, materialId })}>
                <i className="bi bi-collection me-1" />Conjuntos
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => sincronizarVariantes(categoria, categoriaIndex, materialId, titulo)}
              disabled={!puedeSincronizar || sincronizando}
              title={!modeloId || !categoria.id ? "Guarda el modelo antes de sincronizar variantes" : insumosInvalidos ? "Corrige cantidades antes de sincronizar" : "Sincronizar insumos heredados en variantes"}
            >
              <i className="bi bi-arrow-repeat me-1"></i>{sincronizando ? "Sincronizando..." : "Sincronizar variantes"}
            </button>
          </div>
        </div>
        {mensajePegado[sectionKey] && <div className="form-text text-muted mb-2">{mensajePegado[sectionKey]}</div>}
        <SearchableSelect
          label=""
          value={selecciones[`insumo-${categoriaIndex}-${materialKey}`] || ""}
          options={insumosDisponibles}
          onChange={(id, opcion) => agregarInsumo(categoriaIndex, id, opcion, materialId)}
          onSearchChange={setBusquedaInsumo}
          closeOnSelect={false}
          loading={cargando || cargandoBusquedaInsumos}
          placeholder={cargando ? "Cargando insumos..." : "Buscar insumo o conjunto..."}
          searchPlaceholder="Busca por codigo, nombre o unidad..."
          emptyText={busquedaInsumo.trim() ? "No se encontraron coincidencias" : "Escribe para buscar en todo el catalogo"}
          getOptionValue={getId}
          getOptionLabel={(item) => `${item.conjunto ? "[Conjunto] " : item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
          getOptionSearchText={(item) => [item.codigo, item.nombre, getUnidad(item), getTipoInsumo(item)].filter(Boolean).join(" ").toLowerCase()}
        />

        <div className="table-responsive mt-2">
          <table className="table table-sm align-middle mb-0">
            {insumos.length > 0 && (
              <thead className="table-light">
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th className="text-end" style={{ width: 150 }}>Cantidad</th>
                  <th className="text-end" style={{ width: 135 }}>% Desperdicio</th>
                  <th className="text-end" style={{ width: 140 }}>Costo</th>
                  <th className="text-end" style={{ width: 120 }}>Subtotal</th>
                  <th style={{ width: 52 }}></th>
                </tr>
              </thead>
            )}
            <tbody>
              {insumos.length > 0 && (
                <tr>
                  <td style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={todosInsumosSeleccionados}
                      onChange={() => toggleTodosInsumos(categoria, categoriaIndex, insumos, materialId)}
                      aria-label={`Seleccionar todos los insumos de ${titulo}`}
                    />
                  </td>
                  <td colSpan={7}>
                    <span className="text-muted small">Seleccionar todos</span>
                  </td>
                </tr>
              )}
              {insumos.map((item) => {
                const cantidad = Number(item.cantidad || 0);
                const desperdicio = Number(getDesperdicio(item) || 0);
                const subtotal = calcularSubtotalInsumo(item);
                return (
                  <tr key={getInsumoScopeKey(item)}>
                    <td style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={Boolean(seleccionInsumosCategoria[getInsumoScopeKey(item)])}
                        onChange={() => toggleInsumoSeleccionado(categoria, categoriaIndex, item, materialId)}
                        aria-label={`Seleccionar insumo ${item.nombre || getId(item)}`}
                      />
                    </td>
                    <td>
                      <span className="fw-semibold">{item.codigo ? `[${item.codigo}] ` : ""}{item.nombre || `Insumo ${getId(item)}`}</span>
                      {getUnidad(item) && <span className="text-muted ms-2">{getUnidad(item)}</span>}
                      {item.conjunto && <details className="small mt-1">
                        <summary>Despiece</summary>
                        <ul className="mb-1 ps-3">{(item.componentes || []).map((c) => <li key={c.insumoId}>
                          {c.nombre}: {Number(c.cantidad) * cantidad * (1 + desperdicio / 100)} {c.unidadMedida}
                        </li>)}</ul>
                        {puedeVerConjuntos && (
                          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setModalConjuntos({ categoriaIndex, materialId, conjuntoId: getId(item) })}>
                            {puedeEditarConjuntos ? "Editar conjunto" : "Ver conjunto"}
                          </button>
                        )}
                      </details>}
                    </td>
                    <td><span className="small">{formatTipoInsumo(item)}</span></td>
                    <td style={{ width: 150 }}>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        className="form-control form-control-sm"
                        value={item.cantidad ?? ""}
                        data-modelo-categoria-index={categoriaIndex}
                        data-modelo-insumo-id={getId(item)}
                        data-modelo-material-id={materialId ?? ""}
                        data-modelo-insumo-campo="cantidad"
                        onChange={(event) => actualizarCantidadInsumo(categoriaIndex, getId(item), event.target.value, materialId)}
                        placeholder="Cantidad"
                      />
                    </td>
                    <td style={{ width: 135 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={getDesperdicio(item)}
                        data-modelo-categoria-index={categoriaIndex}
                        data-modelo-insumo-id={getId(item)}
                        data-modelo-material-id={materialId ?? ""}
                        data-modelo-insumo-campo="desperdicio"
                        onChange={(event) => actualizarDesperdicioInsumo(categoriaIndex, getId(item), event.target.value, materialId)}
                        placeholder="% desperdicio"
                      />
                    </td>
                    <td style={{ width: 140 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={getCostoCotizacion(item)}
                        readOnly={item.conjunto}
                        title={item.conjunto ? "Calculado desde el despiece" : undefined}
                        data-modelo-categoria-index={categoriaIndex}
                        data-modelo-insumo-id={getId(item)}
                        data-modelo-material-id={materialId ?? ""}
                        data-modelo-insumo-campo="costo"
                        onChange={(event) => actualizarCostoInsumo(categoriaIndex, getId(item), event.target.value, materialId)}
                        placeholder="Costo"
                      />
                    </td>
                    <td className="text-end fw-semibold" style={{ width: 120 }}>
                      {subtotal.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                    </td>
                    <td className="text-end" style={{ width: 52 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => quitarInsumo(categoriaIndex, getId(item), materialId)}
                        aria-label={`Eliminar ${item.nombre || getId(item)} de ${titulo}`}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {insumos.length > 0 && (
              <tfoot className="table-light">
                <tr>
                  <td colSpan={6} className="text-end fw-bold">TOTAL INSUMOS:</td>
                  <td className="text-end fw-bold">{totalInsumosFormateado}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          {!insumos.length && <div className="form-text text-muted">Sin insumos capturados en esta seccion.</div>}
        </div>
        <DespieceResumen asignaciones={insumos} />
        </section>
          </div>
        </details>
        {renderOperacionesSection(categoria, categoriaIndex, sectionKey)}
        </div>
      </details>
    );
  };

  if (!categorias.length) {
    return <div className="form-text text-muted">Aun no se ha asociado ninguna categoria al modelo.</div>;
  }

  return (
    <>
      {errorConjuntos && <div className="alert alert-warning" role="alert">{errorConjuntos}</div>}
      {modalConjuntos && <ConjuntosDialog conjuntoId={modalConjuntos.conjuntoId}
        onClose={() => setModalConjuntos(null)}
        onSaved={(saved) => {
          const actualizado = conjuntoComoInsumo(saved);
          setConjuntos((actual) => mergePorId(actual, [actualizado]));
          onCategoriasChange?.(categorias.map((categoria) => ({ ...categoria,
            insumos: (categoria.insumos || []).map((item) => String(getId(item)) === String(saved.id)
              ? { ...item, ...actualizado, materialId: getInsumoMaterialId(item), cantidad: item.cantidad, desperdicioPorcentaje: getDesperdicio(item) } : item)
          })));
        }}
        onSelect={(item) => {
          agregarInsumo(modalConjuntos.categoriaIndex, item.id, conjuntoComoInsumo(item), modalConjuntos.materialId);
          setModalConjuntos(null);
        }}
        puedeCrear={puedeCrearConjuntos}
        puedeEditar={puedeEditarConjuntos} />}
      <div className="d-flex flex-column gap-3">
        {categorias.map((categoria, categoriaIndex) => {
          const categoriaTone = getTone(TONES_CATEGORIA, categoriaIndex);
          const categoriaPanelKey = `categoria-${categoria.id || categoria.categoriaId || categoriaIndex}`;
          return (
            <details
              key={categoria.id || categoria.categoriaId || categoriaIndex}
              className="modelo-categoria-panel"
              role="region"
              aria-label={`Categoria ${categoria.nombre || categoriaIndex + 1}`}
              open={Boolean(panelesAbiertos[categoriaPanelKey])}
              style={{
                "--categoria-bg": categoriaTone.bg,
                "--categoria-border": categoriaTone.border,
                "--categoria-ink": categoriaTone.ink
              }}
            >
              <summary className="modelo-panel-summary modelo-categoria-summary" onClick={(event) => alternarPanel(event, categoriaPanelKey)}>
                <i className="bi bi-chevron-down modelo-chevron modelo-chevron-down" aria-hidden="true"></i>
                <i className="bi bi-chevron-up modelo-chevron modelo-chevron-up" aria-hidden="true"></i>
                <div>
                  <div className="fw-semibold">
                    {categoria.codigo ? `[${categoria.codigo}] ` : `[${String(categoriaIndex + 1).padStart(2, "0")}] `}
                    {categoria.nombre || "Categoria"}
                  </div>
                  {categoria.descripcion && <small className="text-muted">{categoria.descripcion}</small>}
                </div>
                <span className="text-muted small ms-auto">{materiales.length || 1} material(es)</span>
              </summary>

              <div className="modelo-categoria-body">
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex flex-column gap-3">
                    {materiales.length === 0 && renderInsumosSection(categoria, categoriaIndex)}
                    {materiales.map((material, materialIndex) => renderInsumosSection(categoria, categoriaIndex, material, materialIndex))}
                  </div>
                </div>
              </div>
              </div>
            </details>
          );
        })}
      </div>

      <CatalogModal show={modalInsumoIndex !== null} title="Nuevo insumo" onClose={() => setModalInsumoIndex(null)}>
        <InsumoForm
          onCancel={() => setModalInsumoIndex(null)}
          onSave={(creado) => {
            setCatalogoInsumos((actual) => mergePorId(actual, [creado]));
            agregarInsumo(modalInsumoIndex?.categoriaIndex, getId(creado), creado, modalInsumoIndex?.materialId ?? null);
            setModalInsumoIndex(null);
          }}
        />
      </CatalogModal>

      <CatalogModal show={modalOperacionIndex !== null} title="Nueva operacion" onClose={() => setModalOperacionIndex(null)}>
        <OperacionForm
          onCancel={() => setModalOperacionIndex(null)}
          onSave={(creada) => {
            setCatalogoOperaciones((actual) => mergePorId(actual, [creada]));
            agregarOperacion(modalOperacionIndex, getId(creada), creada);
            setModalOperacionIndex(null);
          }}
        />
      </CatalogModal>
    </>
  );
}
