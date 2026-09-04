import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import InsumoForm from "../../insumos/pages/InsumoForm.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { sincronizarInsumosVariantes, sincronizarMedidasVariantes } from "../services/modelos.js";
import OperacionForm from "../../operaciones/pages/OperacionForm.jsx";
import { obtenerOperacionesActivas } from "../../operaciones/services/operaciones.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getId = (item) => item?.id ?? item?.insumoId ?? item?.operacionId ?? item?.insumo_id ?? item?.operacion_id ?? null;
const getMaterialId = (item) => item?.id ?? item?.materialId ?? item?.material_id ?? item?.id_material ?? null;
const getMaterialLabel = (item) => `${item?.codigo ? `[${item.codigo}] ` : ""}${item?.nombre || "Material"}`;
const getUnidad = (item) => item?.unidadMedida?.simbolo ?? item?.unidadMedida ?? item?.unidad_medida ?? "";
const getDesperdicio = (item) => item?.desperdicioPorcentaje ?? item?.desperdicio_porcentaje ?? item?.desperdicio ?? 0;
const getCostoCotizacion = (item) => item?.costoCotizacion ?? item?.costo_cotizacion ?? item?.costo_cotizar ?? item?.costo ?? 0;
const INSUMOS_CLIPBOARD_KEY = "mobilesco:modelos:insumosClipboard";

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

const normalizarInsumoParaCopiar = (item) => ({
  id: getId(item),
  codigo: item?.codigo ?? "",
  nombre: item?.nombre ?? "",
  unidadMedida: getUnidad(item),
  materialId: getInsumoMaterialId(item),
  cantidad: item?.cantidad ?? "",
  desperdicioPorcentaje: getDesperdicio(item),
  costoCotizacion: getCostoCotizacion(item),
  costoCotizacionOriginal: item?.costoCotizacionOriginal ?? getCostoCotizacion(item)
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
  const [mensajePegado, setMensajePegado] = useState({});
  const [sincronizandoCategoria, setSincronizandoCategoria] = useState(null);
  const [sincronizandoMedidas, setSincronizandoMedidas] = useState(null);

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
    () => mergePorId(catalogoInsumos, insumosBuscados),
    [catalogoInsumos, insumosBuscados]
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
          cantidad: insumo.cantidad ?? "",
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
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      operaciones: (categoria.operaciones || []).filter((item) => String(getId(item)) !== String(operacionId))
    }));
  };

  const sincronizarVariantes = async (categoria, categoriaIndex, materialId = null, titulo = "Insumos comunes") => {
    const nivelId = categoria?.id;
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
    const payload = insumos
      .map((item) => ({
        id: Number(getId(item)),
        materialId: getInsumoMaterialId(item) ? Number(getInsumoMaterialId(item)) : null,
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
    if (!window.confirm(`Se actualizaran los insumos heredados en ${alcance}. Los insumos unicos de cada producto se conservaran. Deseas continuar?`)) {
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

  const moverOperacion = (categoriaIndex, operacionIndex, delta) => {
    actualizarCategoria(categoriaIndex, (categoria) => {
      const operaciones = [...(categoria.operaciones || [])];
      const destino = operacionIndex + delta;
      if (destino < 0 || destino >= operaciones.length) return categoria;
      [operaciones[operacionIndex], operaciones[destino]] = [operaciones[destino], operaciones[operacionIndex]];
      return { ...categoria, operaciones };
    });
  };

  const renderInsumosSection = (categoria, categoriaIndex, material = null) => {
    const materialId = material ? getMaterialId(material) : null;
    const materialKey = materialId ?? "comunes";
    const insumos = (Array.isArray(categoria.insumos) ? categoria.insumos : [])
      .filter((item) => String(getInsumoMaterialId(item) ?? "") === String(materialId ?? ""));
    const insumosDisponibles = catalogoInsumosDisponible.filter(
      (item) => !insumos.some((seleccionado) => String(getId(seleccionado)) === String(getId(item)))
    );
    const sectionKey = getSectionKey(categoria, categoriaIndex, materialId);
    const seleccionInsumosCategoria = getSeleccionadosCategoria(categoria, categoriaIndex, materialId);
    const totalSeleccionados = insumos.filter((item) => seleccionInsumosCategoria[getInsumoScopeKey(item)]).length;
    const todosInsumosSeleccionados =
      insumos.length > 0 && insumos.every((item) => seleccionInsumosCategoria[getInsumoScopeKey(item)]);
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

    return (
      <div key={materialKey} className="border rounded-3 p-3 bg-white" role="group" aria-label={`Material ${titulo}`}>
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">
          <label className="form-label fw-semibold mb-0">{titulo}</label>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {totalSeleccionados > 0 && (
              <span className="badge text-bg-light border">{totalSeleccionados} seleccionados</span>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => copiarInsumosSeleccionados(categoria, categoriaIndex, materialId)}
              disabled={!totalSeleccionados}
            >
              <i className="bi bi-clipboard me-1"></i>Copiar seleccionados
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => pegarInsumos(categoriaIndex, materialId)}
              disabled={!clipboardInsumos.length}
            >
              <i className="bi bi-clipboard-plus me-1"></i>Pegar
            </button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalInsumoIndex({ categoriaIndex, materialId })}>
              <i className="bi bi-plus-lg me-1"></i>Nuevo insumo
            </button>
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
          placeholder={cargando ? "Cargando insumos..." : "Buscar y agregar insumo..."}
          searchPlaceholder="Busca por codigo, nombre o unidad..."
          emptyText={busquedaInsumo.trim() ? "No se encontraron coincidencias" : "Escribe para buscar en todo el catalogo"}
          getOptionValue={getId}
          getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
          getOptionSearchText={(item) => [item.codigo, item.nombre, getUnidad(item)].filter(Boolean).join(" ").toLowerCase()}
        />

        <div className="border rounded-3 p-3 mt-3 bg-light">
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

        <div className="table-responsive mt-2">
          <table className="table table-sm align-middle mb-0">
            {insumos.length > 0 && (
              <thead className="table-light">
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Insumo</th>
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
                  <td colSpan={6}>
                    <span className="text-muted small">Seleccionar todos</span>
                  </td>
                </tr>
              )}
              {insumos.map((item) => {
                const cantidad = Number(item.cantidad || 0);
                const desperdicio = Number(getDesperdicio(item) || 0);
                const costo = Number(getCostoCotizacion(item) || 0);
                const subtotal = cantidad * (1 + desperdicio / 100) * costo;
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
                    </td>
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
          </table>
          {!insumos.length && <div className="form-text text-muted">Sin insumos capturados en esta seccion.</div>}
        </div>
      </div>
    );
  };

  if (!categorias.length) {
    return <div className="form-text text-muted">Aun no se ha asociado ninguna categoria al modelo.</div>;
  }

  return (
    <>
      <div className="d-flex flex-column gap-3">
        {categorias.map((categoria, categoriaIndex) => {
          const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
          const operacionesDisponibles = catalogoOperaciones.filter(
            (item) => !operaciones.some((seleccionada) => String(getId(seleccionada)) === String(getId(item)))
          );
          return (
            <div
              key={categoria.id || categoria.categoriaId || categoriaIndex}
              className="border rounded-3 p-3"
              role="region"
              aria-label={`Categoria ${categoria.nombre || categoriaIndex + 1}`}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <div className="fw-semibold">
                    {categoria.codigo ? `[${categoria.codigo}] ` : `[${String(categoriaIndex + 1).padStart(2, "0")}] `}
                    {categoria.nombre || "Categoria"}
                  </div>
                  {categoria.descripcion && <small className="text-muted">{categoria.descripcion}</small>}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">
                    <label className="form-label fw-semibold mb-0">Insumos de la categoria</label>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {materiales.length === 0 && renderInsumosSection(categoria, categoriaIndex)}
                    {materiales.map((material) => renderInsumosSection(categoria, categoriaIndex, material))}
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">Operaciones de la categoria</label>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalOperacionIndex(categoriaIndex)}>
                      <i className="bi bi-plus-lg me-1"></i>Nueva operacion
                    </button>
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

                  <div className="table-responsive mt-2">
                    <table className="table table-sm align-middle mb-0">
                      <tbody>
                        {operaciones.map((item, index) => (
                          <tr key={getId(item)}>
                            <td style={{ width: 44 }}><span className="badge text-bg-secondary">{index + 1}</span></td>
                            <td>
                              <span className="fw-semibold">{item.codigo ? `[${item.codigo}] ` : ""}{item.nombre || `Operacion ${getId(item)}`}</span>
                              {item.centroTrabajoNombre && <span className="text-muted ms-2">{item.centroTrabajoNombre}</span>}
                            </td>
                            <td style={{ width: 160 }}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className="form-control form-control-sm"
                                value={item.cantidad ?? 1}
                                data-modelo-categoria-index={categoriaIndex}
                                data-modelo-operacion-id={getId(item)}
                                data-modelo-operacion-campo="cantidad"
                                onChange={(event) => actualizarCantidadOperacion(categoriaIndex, getId(item), event.target.value)}
                                placeholder="Cantidad"
                              />
                            </td>
                            <td className="text-end" style={{ width: 150 }}>
                              <div className="btn-group btn-group-sm">
                                <button type="button" className="btn btn-outline-secondary" disabled={index === 0} onClick={() => moverOperacion(categoriaIndex, index, -1)}>
                                  <i className="bi bi-arrow-up"></i>
                                </button>
                                <button type="button" className="btn btn-outline-secondary" disabled={index === operaciones.length - 1} onClick={() => moverOperacion(categoriaIndex, index, 1)}>
                                  <i className="bi bi-arrow-down"></i>
                                </button>
                                <button type="button" className="btn btn-outline-danger" onClick={() => quitarOperacion(categoriaIndex, getId(item))}>
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!operaciones.length && <div className="form-text text-muted">Sin operaciones capturadas para esta categoria.</div>}
                  </div>
                </div>
              </div>
            </div>
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
