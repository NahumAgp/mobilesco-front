import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import InsumoForm from "../../insumos/pages/InsumoForm.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { sincronizarInsumosVariantes } from "../services/modelos.js";
import OperacionForm from "../../operaciones/pages/OperacionForm.jsx";
import { obtenerOperacionesActivas } from "../../operaciones/services/operaciones.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getId = (item) => item?.id ?? item?.insumoId ?? item?.operacionId ?? item?.insumo_id ?? item?.operacion_id ?? null;
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

const getInsumoKey = (item) => String(getId(item) ?? "");

const normalizarInsumoParaCopiar = (item) => ({
  id: getId(item),
  codigo: item?.codigo ?? "",
  nombre: item?.nombre ?? "",
  unidadMedida: getUnidad(item),
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

export default function ModeloPlantillaProductivaFields({ modeloId, categorias = [], onCategoriasChange }) {
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

  const getSeleccionadosCategoria = (categoria, categoriaIndex) => {
    const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
    return insumosSeleccionados[categoriaKey] || {};
  };

  const limpiarSeleccionCategoria = (categoria, categoriaIndex) => {
    const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
    setInsumosSeleccionados((prev) => {
      if (!prev[categoriaKey]) return prev;
      const siguiente = { ...prev };
      delete siguiente[categoriaKey];
      return siguiente;
    });
  };

  const toggleInsumoSeleccionado = (categoria, categoriaIndex, insumoId) => {
    const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
    const insumoKey = String(insumoId);

    setInsumosSeleccionados((prev) => {
      const seleccionCategoria = { ...(prev[categoriaKey] || {}) };
      if (seleccionCategoria[insumoKey]) {
        delete seleccionCategoria[insumoKey];
      } else {
        seleccionCategoria[insumoKey] = true;
      }

      return {
        ...prev,
        [categoriaKey]: seleccionCategoria
      };
    });
  };

  const toggleTodosInsumos = (categoria, categoriaIndex, insumos) => {
    const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
    const seleccionCategoria = insumosSeleccionados[categoriaKey] || {};
    const todosSeleccionados =
      insumos.length > 0 && insumos.every((item) => seleccionCategoria[getInsumoKey(item)]);

    setInsumosSeleccionados((prev) => ({
      ...prev,
      [categoriaKey]: todosSeleccionados
        ? {}
        : Object.fromEntries(insumos.map((item) => [getInsumoKey(item), true]).filter(([key]) => key))
    }));
  };

  const copiarInsumosSeleccionados = (categoria, categoriaIndex) => {
    const seleccionCategoria = getSeleccionadosCategoria(categoria, categoriaIndex);
    const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
    const copiados = insumos
      .filter((item) => seleccionCategoria[getInsumoKey(item)])
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
      [getCategoriaKey(categoria, categoriaIndex)]: `${copiados.length} insumo${copiados.length === 1 ? "" : "s"} copiado${copiados.length === 1 ? "" : "s"}.`
    }));
  };

  const pegarInsumos = (categoriaIndex) => {
    const copiados = clipboardInsumos.length ? clipboardInsumos : leerClipboardInsumos();
    const categoriaActual = categorias[categoriaIndex];
    const categoriaKey = getCategoriaKey(categoriaActual, categoriaIndex);

    if (!copiados.length) return;

    let agregados = 0;
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.insumos) ? categoria.insumos : [];
      const idsActuales = new Set(actuales.map((item) => String(getId(item))));
      const nuevos = copiados
        .filter((item) => !idsActuales.has(String(getId(item))))
        .map((item) => ({
          ...item,
          id: getId(item),
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
      [categoriaKey]: agregados
        ? `${agregados} insumo${agregados === 1 ? "" : "s"} pegado${agregados === 1 ? "" : "s"}.`
        : "No se pego ningun insumo porque ya estaban en esta categoria."
    }));

    if (agregados) {
      limpiarSeleccionCategoria(categoriaActual, categoriaIndex);
    }
  };

  const agregarInsumo = (categoriaIndex, id, opcion) => {
    if (categoriaIndex === null || categoriaIndex === undefined || !id) return;
    const insumo = opcion || catalogoInsumosDisponible.find((item) => String(getId(item)) === String(id)) || { id };
    actualizarCategoria(categoriaIndex, (categoria) => {
      const actuales = Array.isArray(categoria.insumos) ? categoria.insumos : [];
      if (actuales.some((item) => String(getId(item)) === String(getId(insumo)))) return categoria;
      return {
        ...categoria,
        insumos: [...actuales, {
          ...insumo,
          id: getId(insumo),
          cantidad: insumo.cantidad ?? "",
          desperdicioPorcentaje: getDesperdicio(insumo),
          costoCotizacion: getCostoCotizacion(insumo),
          costoCotizacionOriginal: insumo.costoCotizacionOriginal ?? getCostoCotizacion(insumo)
        }]
      };
    });
    setSelecciones((prev) => ({ ...prev, [`insumo-${categoriaIndex}`]: "" }));
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

  const actualizarCantidadInsumo = (categoriaIndex, insumoId, cantidad) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) ? { ...item, cantidad } : item
      )
    }));
  };

  const actualizarDesperdicioInsumo = (categoriaIndex, insumoId, desperdicioPorcentaje) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) ? { ...item, desperdicioPorcentaje } : item
      )
    }));
  };

  const actualizarCostoInsumo = (categoriaIndex, insumoId, costoCotizacion) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).map((item) =>
        String(getId(item)) === String(insumoId) ? { ...item, costoCotizacion } : item
      )
    }));
  };

  const actualizarCantidadOperacion = (categoriaIndex, operacionId, cantidad) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      operaciones: (categoria.operaciones || []).map((item) =>
        String(getId(item)) === String(operacionId) ? { ...item, cantidad } : item
      )
    }));
  };

  const quitarInsumo = (categoriaIndex, insumoId) => {
    const categoriaActual = categorias[categoriaIndex];
    const categoriaKey = getCategoriaKey(categoriaActual, categoriaIndex);
    const insumoKey = String(insumoId);
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      insumos: (categoria.insumos || []).filter((item) => String(getId(item)) !== String(insumoId))
    }));
    setInsumosSeleccionados((prev) => {
      if (!prev[categoriaKey]?.[insumoKey]) return prev;
      const seleccionCategoria = { ...prev[categoriaKey] };
      delete seleccionCategoria[insumoKey];
      return {
        ...prev,
        [categoriaKey]: seleccionCategoria
      };
    });
  };

  const quitarOperacion = (categoriaIndex, operacionId) => {
    actualizarCategoria(categoriaIndex, (categoria) => ({
      ...categoria,
      operaciones: (categoria.operaciones || []).filter((item) => String(getId(item)) !== String(operacionId))
    }));
  };

  const sincronizarVariantes = async (categoria, categoriaIndex) => {
    const nivelId = categoria?.id;
    const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
    const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
    const payload = insumos
      .map((item) => ({
        id: Number(getId(item)),
        cantidad: Number(item.cantidad),
        desperdicioPorcentaje: Number(getDesperdicio(item) || 0)
      }))
      .filter((item) => Number.isFinite(item.id));

    if (!modeloId || !nivelId) {
      setMensajePegado((prev) => ({
        ...prev,
        [categoriaKey]: "Guarda el modelo antes de sincronizar esta categoria con sus variantes."
      }));
      return;
    }

    if (payload.some((item) => !Number.isFinite(item.cantidad) || item.cantidad <= 0)) {
      setMensajePegado((prev) => ({
        ...prev,
        [categoriaKey]: "Cada insumo debe tener cantidad mayor a cero antes de sincronizar."
      }));
      return;
    }

    if (payload.some((item) => !Number.isFinite(item.desperdicioPorcentaje) || item.desperdicioPorcentaje < 0)) {
      setMensajePegado((prev) => ({
        ...prev,
        [categoriaKey]: "Cada insumo debe tener desperdicio mayor o igual a cero antes de sincronizar."
      }));
      return;
    }

    if (!window.confirm("Se actualizarán los insumos heredados en todas las variantes de esta categoría. Los insumos únicos de cada producto se conservarán. ¿Deseas continuar?")) {
      return;
    }

    try {
      setSincronizandoCategoria(categoriaKey);
      const resultado = await sincronizarInsumosVariantes(modeloId, nivelId, payload);
      setMensajePegado((prev) => ({
        ...prev,
        [categoriaKey]: `Variantes sincronizadas: ${resultado.productosActualizados || 0}. Agregados: ${resultado.insumosAgregados || 0}, actualizados: ${resultado.insumosActualizados || 0}, eliminados: ${resultado.insumosEliminados || 0}.`
      }));
    } catch (errorSincronizacion) {
      setMensajePegado((prev) => ({
        ...prev,
        [categoriaKey]: errorSincronizacion.message || "No se pudieron sincronizar las variantes."
      }));
    } finally {
      setSincronizandoCategoria(null);
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

  if (!categorias.length) {
    return <div className="form-text text-muted">Aun no se ha asociado ninguna categoria al modelo.</div>;
  }

  return (
    <>
      <div className="d-flex flex-column gap-3">
        {categorias.map((categoria, categoriaIndex) => {
          const insumos = Array.isArray(categoria.insumos) ? categoria.insumos : [];
          const operaciones = Array.isArray(categoria.operaciones) ? categoria.operaciones : [];
          const insumosDisponibles = catalogoInsumosDisponible.filter(
            (item) => !insumos.some((seleccionado) => String(getId(seleccionado)) === String(getId(item)))
          );
          const operacionesDisponibles = catalogoOperaciones.filter(
            (item) => !operaciones.some((seleccionada) => String(getId(seleccionada)) === String(getId(item)))
          );
          const categoriaKey = getCategoriaKey(categoria, categoriaIndex);
          const seleccionInsumosCategoria = getSeleccionadosCategoria(categoria, categoriaIndex);
          const totalSeleccionados = insumos.filter((item) => seleccionInsumosCategoria[getInsumoKey(item)]).length;
          const todosInsumosSeleccionados =
            insumos.length > 0 && insumos.every((item) => seleccionInsumosCategoria[getInsumoKey(item)]);
          const insumosInvalidos = insumos.some((item) => {
            const cantidad = Number(item.cantidad);
            const desperdicio = Number(getDesperdicio(item) || 0);
            return !Number.isFinite(cantidad) || cantidad <= 0
              || !Number.isFinite(desperdicio) || desperdicio < 0;
          });
          const puedeSincronizar = Boolean(modeloId && categoria.id) && !insumosInvalidos;
          const sincronizando = sincronizandoCategoria === categoriaKey;

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
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {totalSeleccionados > 0 && (
                        <span className="badge text-bg-light border">{totalSeleccionados} seleccionados</span>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => copiarInsumosSeleccionados(categoria, categoriaIndex)}
                        disabled={!totalSeleccionados}
                      >
                        <i className="bi bi-clipboard me-1"></i>Copiar seleccionados
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => pegarInsumos(categoriaIndex)}
                        disabled={!clipboardInsumos.length}
                      >
                        <i className="bi bi-clipboard-plus me-1"></i>Pegar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => sincronizarVariantes(categoria, categoriaIndex)}
                        disabled={!puedeSincronizar || sincronizando}
                        title={!modeloId || !categoria.id ? "Guarda el modelo antes de sincronizar variantes" : insumosInvalidos ? "Corrige cantidades antes de sincronizar" : "Sincronizar insumos heredados en variantes"}
                      >
                        <i className="bi bi-arrow-repeat me-1"></i>{sincronizando ? "Sincronizando..." : "Sincronizar variantes"}
                      </button>
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModalInsumoIndex(categoriaIndex)}>
                        <i className="bi bi-plus-lg me-1"></i>Nuevo insumo
                      </button>
                    </div>
                  </div>
                  {mensajePegado[categoriaKey] && <div className="form-text text-muted mb-2">{mensajePegado[categoriaKey]}</div>}
                  <SearchableSelect
                    label=""
                    value={selecciones[`insumo-${categoriaIndex}`] || ""}
                    options={insumosDisponibles}
                    onChange={(id, opcion) => agregarInsumo(categoriaIndex, id, opcion)}
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
                                onChange={() => toggleTodosInsumos(categoria, categoriaIndex, insumos)}
                                aria-label={`Seleccionar todos los insumos de ${categoria.nombre || "categoria"}`}
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
                          <tr key={getId(item)}>
                            <td style={{ width: 44 }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={Boolean(seleccionInsumosCategoria[getInsumoKey(item)])}
                                onChange={() => toggleInsumoSeleccionado(categoria, categoriaIndex, getId(item))}
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
                                data-modelo-insumo-campo="cantidad"
                                onChange={(event) => actualizarCantidadInsumo(categoriaIndex, getId(item), event.target.value)}
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
                                data-modelo-insumo-campo="desperdicio"
                                onChange={(event) => actualizarDesperdicioInsumo(categoriaIndex, getId(item), event.target.value)}
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
                                data-modelo-insumo-campo="costo"
                                onChange={(event) => actualizarCostoInsumo(categoriaIndex, getId(item), event.target.value)}
                                placeholder="Costo"
                              />
                            </td>
                            <td className="text-end fw-semibold" style={{ width: 120 }}>
                              {subtotal.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                            </td>
                            <td className="text-end" style={{ width: 52 }}>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarInsumo(categoriaIndex, getId(item))}>
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!insumos.length && <div className="form-text text-muted">Sin insumos capturados para esta categoria.</div>}
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
            agregarInsumo(modalInsumoIndex, getId(creado), creado);
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
