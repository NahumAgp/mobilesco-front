import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Toast from "../../../components/ui/Toast.jsx";
import { crearAreaTrabajo, obtenerAreasTrabajo } from "../../areas-trabajo/services/areasTrabajo.js";
import { obtenerInsumoPorId, obtenerInsumos } from "../../insumos/services/insumos.js";
import { crearSalidaInsumo } from "../services/salidasInsumos.js";

function obtenerFechaHoraLocal() {
  const ahora = new Date();
  const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
  return new Date(ahora.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function SalidasInsumosNuevaPage() {
  const navigate = useNavigate();
  const buscadorInsumoRef = useRef(null);
  const tipoSalidaRef = useRef(null);
  const ordenProduccionRef = useRef(null);
  const responsableRef = useRef(null);
  const areaRef = useRef(null);
  const buscadorInsumoInputRef = useRef(null);
  const cantidadEntradaRef = useRef(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [errores, setErrores] = useState({});
  const [insumos, setInsumos] = useState([]);
  const [areasTrabajo, setAreasTrabajo] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [sugerenciasInsumo, setSugerenciasInsumo] = useState([]);
  const [cantidadEntrada, setCantidadEntrada] = useState(1);
  const [actualizandoStock, setActualizandoStock] = useState(false);
  const [mostrarModalArea, setMostrarModalArea] = useState(false);
  const [guardandoArea, setGuardandoArea] = useState(false);
  const [nuevaArea, setNuevaArea] = useState({
    nombre: "",
    descripcion: ""
  });
  const [formData, setFormData] = useState({
    tipoSalida: "DIRECTA",
    ordenProduccion: "",
    fechaSalida: obtenerFechaHoraLocal(),
    observaciones: "",
    responsable: "",
    area: ""
  });
  const [cargando, setCargando] = useState(false);

  const normalizarRespuestaInsumos = (insumosResp) =>
    Array.isArray(insumosResp?.content) ? insumosResp.content : Array.isArray(insumosResp) ? insumosResp : [];

  const normalizarRespuestaAreas = (areasResp) =>
    (Array.isArray(areasResp?.content) ? areasResp.content : Array.isArray(areasResp) ? areasResp : [])
      .filter((area) => area?.activo !== false)
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }));

  const actualizarInsumoEnCatalogo = useCallback((insumoActualizado) => {
    if (!insumoActualizado?.id) return;

    setInsumos((prev) =>
      prev.map((insumo) => String(insumo.id) === String(insumoActualizado.id) ? insumoActualizado : insumo)
    );
  }, []);

  const cargarCatalogos = useCallback(async ({ silencioso = false } = {}) => {
    try {
      const [insumosResp, areasResp] = await Promise.all([
        obtenerInsumos(),
        obtenerAreasTrabajo({ activo: true })
      ]);
      setInsumos(normalizarRespuestaInsumos(insumosResp));
      setAreasTrabajo(normalizarRespuestaAreas(areasResp));
    } catch (error) {
      console.error("Error cargando catalogos:", error);
      if (!silencioso) {
        setToastType("danger");
        setToastMessage("No se pudieron cargar los catalogos de la salida");
      }
    }
  }, []);

  const refrescarStocksDetalles = useCallback(async ({ avisarCambios = false } = {}) => {
    if (detalles.length === 0) {
      return { valido: true, detallesActualizados: [] };
    }

    const insumosActualizados = await Promise.all(
      detalles.map((item) => obtenerInsumoPorId(item.insumoId))
    );

    setInsumos((prev) => {
      const porId = new Map(insumosActualizados.map((insumo) => [String(insumo.id), insumo]));
      return prev.map((insumo) => porId.get(String(insumo.id)) || insumo);
    });

    let huboCambio = false;
    let valido = true;
    const detallesActualizados = detalles.map((item) => {
      const insumoActual = insumosActualizados.find((insumo) => String(insumo.id) === String(item.insumoId));
      const stockBase = Number(insumoActual?.stockDisponible ?? insumoActual?.stockActual ?? 0);
      const cantidad = Number(item.cantidad || 0);
      const stockDisponible = stockBase - cantidad;
      const stockDesactualizado = cantidad > stockBase;

      if (Number(item.stockBase || 0) !== stockBase || Boolean(item.stockDesactualizado) !== stockDesactualizado) {
        huboCambio = true;
      }

      if (stockDesactualizado) {
        valido = false;
      }

      return {
        ...item,
        insumoNombre: insumoActual?.nombre || item.insumoNombre,
        unidad: insumoActual?.unidadMedida?.simbolo || insumoActual?.unidadMedida?.nombre || item.unidad,
        stockBase,
        stockActual: stockDisponible,
        stockDesactualizado
      };
    });

    setDetalles(detallesActualizados);

    if (avisarCambios && huboCambio) {
      setToastType(valido ? "info" : "danger");
      setToastMessage(valido
        ? "Stock actualizado con la informacion mas reciente"
        : "El stock cambio en otra sesion. Revisa los renglones marcados antes de guardar");
    }

    return { valido, detallesActualizados };
  }, [detalles]);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      cargarCatalogos({ silencioso: true });
      refrescarStocksDetalles({ avisarCambios: true }).catch((error) => {
        console.error("Error actualizando stock de detalles:", error);
      });
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [cargarCatalogos, refrescarStocksDetalles]);

  useEffect(() => {
    const cerrarSugerenciasAlClickAfuera = (event) => {
      if (buscadorInsumoRef.current && !buscadorInsumoRef.current.contains(event.target)) {
        setSugerenciasInsumo([]);
      }
    };

    document.addEventListener("mousedown", cerrarSugerenciasAlClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarSugerenciasAlClickAfuera);
  }, []);

  const totalCantidad = useMemo(
    () => detalles.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [detalles]
  );
  const salidaDirecta = formData.tipoSalida === "DIRECTA";

  const enfocarControl = (control) => {
    if (!control) return;
    control.focus({ preventScroll: true });
    control.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const enfocarPrimerError = (erroresFormulario) => {
    window.requestAnimationFrame(() => {
      if (erroresFormulario.tipoSalida) {
        enfocarControl(tipoSalidaRef.current);
        return;
      }
      if (erroresFormulario.ordenProduccion) {
        enfocarControl(ordenProduccionRef.current);
        return;
      }
      if (erroresFormulario.responsable) {
        enfocarControl(responsableRef.current);
        return;
      }
      if (erroresFormulario.area) {
        enfocarControl(areaRef.current);
        return;
      }
      if (erroresFormulario.insumoBusqueda || (erroresFormulario.detalles && detalles.length === 0)) {
        enfocarControl(buscadorInsumoInputRef.current);
        return;
      }
      if (erroresFormulario.cantidadEntrada) {
        enfocarControl(cantidadEntradaRef.current);
        return;
      }
      if (erroresFormulario.detalles) {
        enfocarControl(document.querySelector("[data-cantidad-detalle-invalida='true']"));
      }
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const siguiente = { ...prev, [name]: value };
      if (name === "tipoSalida" && value === "INDIRECTA") {
        siguiente.ordenProduccion = "";
      }
      return siguiente;
    });
    if (errores[name] || (name === "tipoSalida" && errores.ordenProduccion)) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[name];
        if (name === "tipoSalida") {
          delete copia.ordenProduccion;
        }
        return copia;
      });
    }
  };

  const normalizarCodigo = (valor) => String(valor || "").replace(/\D/g, "");

  const buscarInsumoPorEntrada = (valor) => {
    const termino = String(valor || "").trim().toLowerCase();
    const codigoNormalizado = normalizarCodigo(termino);

    if (!termino) {
      return null;
    }

    const coincidenciaExactaCodigo = insumos.find((insumo) => {
      const codigoBarras = normalizarCodigo(insumo.codigoBarras);
      const codigoInterno = normalizarCodigo(insumo.codigo);
      return codigoBarras === codigoNormalizado || codigoInterno === codigoNormalizado;
    });

    if (coincidenciaExactaCodigo) {
      return coincidenciaExactaCodigo;
    }

    const coincidenciaExactaNombre = insumos.find((insumo) => String(insumo.nombre || "").trim().toLowerCase() === termino);
    if (coincidenciaExactaNombre) {
      return coincidenciaExactaNombre;
    }

    const coincidenciaPorNombre = insumos.find((insumo) => String(insumo.nombre || "").toLowerCase().includes(termino));
    if (coincidenciaPorNombre) {
      return coincidenciaPorNombre;
    }

    return insumos.find((insumo) => {
      const codigoBarras = String(insumo.codigoBarras || "").toLowerCase();
      const codigo = String(insumo.codigo || "").toLowerCase();
      return codigoBarras.includes(termino) || codigo.includes(termino);
    }) || null;
  };

  const cerrarModalArea = () => {
    setMostrarModalArea(false);
    setNuevaArea({ nombre: "", descripcion: "" });
  };

  const guardarNuevaArea = async (event) => {
    event.preventDefault();

    const nombre = nuevaArea.nombre.trim();
    if (!nombre) {
      setToastType("danger");
      setToastMessage("Escribe el nombre del area");
      return;
    }

    try {
      setGuardandoArea(true);
      const areaCreada = await crearAreaTrabajo({
        nombre,
        descripcion: nuevaArea.descripcion.trim() || ""
      });

      setAreasTrabajo((prev) => {
        const sinDuplicado = prev.filter((area) => String(area.id) !== String(areaCreada.id));
        return [...sinDuplicado, areaCreada]
          .filter((area) => area?.activo !== false)
          .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }));
      });
      setFormData((prev) => ({ ...prev, area: areaCreada.nombre || nombre }));
      setToastType("success");
      setToastMessage("Area creada y seleccionada correctamente");
      cerrarModalArea();
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo crear el area");
    } finally {
      setGuardandoArea(false);
    }
  };

  const actualizarSugerencias = (valor) => {
    const termino = String(valor || "").trim().toLowerCase();
    const ordenarPorNombre = (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" });

    if (!termino) {
      setSugerenciasInsumo([...insumos].sort(ordenarPorNombre).slice(0, 5));
      return;
    }

    const coincidencias = insumos
      .filter((insumo) => {
        const texto = [
          insumo.codigoBarras,
          insumo.codigo,
          insumo.nombre,
          insumo.descripcion
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return texto.includes(termino);
      })
      .sort(ordenarPorNombre)
      .slice(0, 6);

    setSugerenciasInsumo(coincidencias);
  };

  const agregarDetalle = async () => {
    const insumo = buscarInsumoPorEntrada(busquedaInsumo);
    const cantidad = Number(cantidadEntrada || 0);

    if (!insumo) {
      const errorInsumo = { insumoBusqueda: "Selecciona un insumo válido" };
      setErrores((prev) => ({ ...prev, ...errorInsumo }));
      setToastType("danger");
      setToastMessage("Escribe o escanea un insumo válido");
      enfocarPrimerError(errorInsumo);
      return;
    }

    if (cantidad <= 0) {
      const errorCantidad = { cantidadEntrada: "La cantidad debe ser mayor a cero" };
      setErrores((prev) => ({ ...prev, ...errorCantidad }));
      setToastType("danger");
      setToastMessage("La cantidad debe ser mayor a cero");
      enfocarPrimerError(errorCantidad);
      return;
    }

    let insumoActual = insumo;
    try {
      setActualizandoStock(true);
      insumoActual = await obtenerInsumoPorId(insumo.id);
      actualizarInsumoEnCatalogo(insumoActual);
    } catch (error) {
      console.error("Error consultando stock actual:", error);
      setToastType("danger");
      setToastMessage("No se pudo confirmar el stock actual del insumo");
      setActualizandoStock(false);
      return;
    } finally {
      setActualizandoStock(false);
    }

    const stockBase = Number(insumoActual.stockDisponible ?? insumoActual.stockActual ?? 0);
    const existente = detalles.find((item) => String(item.insumoId) === String(insumo.id));
    const cantidadAcumulada = Number(existente?.cantidad || 0) + cantidad;
    const stockDisponible = stockBase - cantidadAcumulada;

    if (cantidadAcumulada > stockBase) {
      setToastType("danger");
      setToastMessage(`Stock insuficiente para ${insumoActual.nombre}. Disponible: ${stockBase.toFixed(2)}, solicitado: ${cantidadAcumulada.toFixed(2)}`);
      return;
    }

    if (existente) {
      setDetalles((prev) =>
        prev.map((item) =>
          String(item.insumoId) === String(insumo.id)
            ? {
                ...item,
                cantidad: cantidadAcumulada,
                stockBase,
                stockActual: stockDisponible,
                stockDesactualizado: false
              }
            : item
        )
      );
    } else {
      setDetalles((prev) => [
        ...prev,
        {
          id: Date.now(),
          insumoId: insumo.id,
          insumoNombre: insumoActual.nombre,
          unidad: insumoActual.unidadMedida?.simbolo || insumoActual.unidadMedida?.nombre || "",
          cantidad,
          stockBase,
          stockActual: stockDisponible,
          stockDesactualizado: false
        }
      ]);
    }

    setBusquedaInsumo("");
    setSugerenciasInsumo([]);
    setCantidadEntrada(1);
    setErrores((prev) => {
      const copia = { ...prev };
      delete copia.detalles;
      delete copia.insumoBusqueda;
      delete copia.cantidadEntrada;
      return copia;
    });
  };

  const handleBusquedaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarDetalle();
    }
  };

  const normalizarCantidadInput = (valor) => {
    const limpio = String(valor || "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const partes = limpio.split(".");

    if (partes.length <= 2) {
      return limpio;
    }

    return `${partes[0]}.${partes.slice(1).join("")}`;
  };

  const handleCantidadEntradaChange = (valor) => {
    setCantidadEntrada(normalizarCantidadInput(valor));
    if (errores.cantidadEntrada) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia.cantidadEntrada;
        return copia;
      });
    }
  };

  const actualizarCantidadDetalle = (id, valor) => {
    const cantidadNormalizada = normalizarCantidadInput(valor);
    const nuevaCantidad = Number(cantidadNormalizada || 0);

    setDetalles((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (!cantidadNormalizada || nuevaCantidad <= 0) {
          return {
            ...item,
            cantidad: cantidadNormalizada,
            stockActual: Number(item.stockBase || 0)
          };
        }

        if (nuevaCantidad > Number(item.stockBase || 0)) {
          setToastType("danger");
          setToastMessage(`Stock insuficiente para ${item.insumoNombre}`);
          return item;
        }

        return {
          ...item,
          cantidad: nuevaCantidad,
          stockActual: Number(item.stockBase || 0) - nuevaCantidad
        };
      })
    );
  };

  const eliminarDetalle = (id) => {
    setDetalles((prev) => prev.filter((item) => item.id !== id));
  };

  const limpiarFormulario = () => {
    setFormData({
      tipoSalida: "DIRECTA",
      ordenProduccion: "",
      fechaSalida: obtenerFechaHoraLocal(),
      observaciones: "",
      responsable: "",
      area: ""
    });
    setDetalles([]);
    setBusquedaInsumo("");
    setSugerenciasInsumo([]);
    setCantidadEntrada(1);
    setErrores({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = {};
    if (!formData.tipoSalida) nuevosErrores.tipoSalida = "Selecciona el tipo de salida";
    if (salidaDirecta && !formData.ordenProduccion.trim()) {
      nuevosErrores.ordenProduccion = "La orden de producción es obligatoria para salidas directas";
    }
    if (!formData.responsable.trim()) nuevosErrores.responsable = "La persona responsable es obligatoria";
    if (!formData.area.trim()) nuevosErrores.area = "Selecciona el área responsable de la salida";
    if (detalles.length === 0) nuevosErrores.detalles = "Agrega al menos un insumo";
    if (detalles.some((item) => Number(item.cantidad || 0) <= 0)) {
      nuevosErrores.detalles = "Todas las cantidades deben ser mayores a cero";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setToastType("danger");
      setToastMessage("Revisa los campos obligatorios");
      enfocarPrimerError(nuevosErrores);
      return;
    }

    try {
      setCargando(true);
      setErrores({});

      const resultadoStock = await refrescarStocksDetalles({ avisarCambios: true });
      if (!resultadoStock.valido) {
        setToastType("danger");
        setToastMessage("No se puede guardar: hay insumos sin stock suficiente. Actualiza cantidades o elimina el renglon");
        return;
      }

      const detallesParaGuardar = resultadoStock.detallesActualizados.length > 0
        ? resultadoStock.detallesActualizados
        : detalles;

      const payload = {
        tipoSalida: formData.tipoSalida,
        ordenProduccion: salidaDirecta ? formData.ordenProduccion.trim() : null,
        fechaSalida: formData.fechaSalida || null,
        observaciones: formData.observaciones.trim() || null,
        responsable: formData.responsable.trim(),
        area: formData.area.trim() || null,
        detalles: detallesParaGuardar.map((item) => ({
          insumoId: item.insumoId,
          cantidad: Number(item.cantidad),
          observaciones: null
        }))
      };

      await crearSalidaInsumo(payload);
      setToastType("success");
      setToastMessage("Salida de insumos registrada con éxito");
      limpiarFormulario();
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo registrar la salida");
      if (error.errors) {
        setErrores(error.errors);
        enfocarPrimerError(error.errors);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Nueva salida de insumos</h2>
          <p className="text-muted mb-0">Captura insumos por código o nombre y regístralos como salida directa o indirecta.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" type="button" onClick={() => navigate("/salidas-insumos")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver al historial
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-clipboard2-minus me-2"></i>Información general
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label
                  className={`form-label fw-semibold ${errores.tipoSalida ? "text-danger" : ""}`}
                  htmlFor="tipoSalida"
                >
                  Tipo de salida *
                </label>
                <select
                  id="tipoSalida"
                  ref={tipoSalidaRef}
                  name="tipoSalida"
                  className={`form-select ${errores.tipoSalida ? "is-invalid" : ""}`}
                  value={formData.tipoSalida}
                  onChange={handleFormChange}
                  aria-invalid={Boolean(errores.tipoSalida)}
                  aria-describedby={errores.tipoSalida ? "tipoSalida-error" : undefined}
                >
                  <option value="DIRECTA">Directa</option>
                  <option value="INDIRECTA">Indirecta</option>
                </select>
                <div id="tipoSalida-error" className="invalid-feedback">{errores.tipoSalida}</div>
                <div className="form-text">
                  Directa: para una orden de producción. Indirecta: consumo interno de la empresa.
                </div>
              </div>
              {salidaDirecta ? (
                <div className="col-md-4">
                  <label
                    className={`form-label fw-semibold ${errores.ordenProduccion ? "text-danger" : ""}`}
                    htmlFor="ordenProduccion"
                  >
                    Orden de producción *
                  </label>
                  <input
                    id="ordenProduccion"
                    ref={ordenProduccionRef}
                    type="text"
                    name="ordenProduccion"
                    className={`form-control ${errores.ordenProduccion ? "is-invalid" : ""}`}
                    value={formData.ordenProduccion}
                    onChange={handleFormChange}
                    placeholder="OP-001"
                    aria-invalid={Boolean(errores.ordenProduccion)}
                    aria-describedby={errores.ordenProduccion ? "ordenProduccion-error" : undefined}
                  />
                  <div id="ordenProduccion-error" className="invalid-feedback">{errores.ordenProduccion}</div>
                </div>
              ) : (
                <div className="col-md-4 d-flex align-items-end">
                  <div className="alert alert-light border mb-0 py-2 w-100">
                    <div className="fw-semibold small mb-1">Salida indirecta</div>
                    <small className="text-muted">No requiere folio o ID de orden de producción.</small>
                  </div>
                </div>
              )}
              <div className="col-md-4">
                <label className="form-label fw-semibold">Fecha y hora</label>
                <input
                  type="datetime-local"
                  name="fechaSalida"
                  className="form-control"
                  value={formData.fechaSalida}
                  onChange={handleFormChange}
                />
              </div>
              <div className="col-md-12">
                <label
                  className={`form-label fw-semibold ${errores.responsable ? "text-danger" : ""}`}
                  htmlFor="responsable"
                >
                  Persona responsable / receptora *
                </label>
                <input
                  id="responsable"
                  ref={responsableRef}
                  type="text"
                  name="responsable"
                  className={`form-control ${errores.responsable ? "is-invalid" : ""}`}
                  value={formData.responsable}
                  onChange={handleFormChange}
                  placeholder="Nombre de la persona que recibe el insumo"
                  aria-invalid={Boolean(errores.responsable)}
                  aria-describedby={errores.responsable ? "responsable-error" : undefined}
                />
                <div id="responsable-error" className="invalid-feedback">{errores.responsable}</div>
              </div>
              <div className="col-md-6">
                <label
                  className={`form-label fw-semibold ${errores.area ? "text-danger" : ""}`}
                  htmlFor="area"
                >
                  Área *
                </label>
                <div className="input-group">
                  <select
                    id="area"
                    ref={areaRef}
                    name="area"
                    className={`form-select ${errores.area ? "is-invalid" : ""}`}
                    value={formData.area}
                    onChange={handleFormChange}
                    aria-invalid={Boolean(errores.area)}
                    aria-describedby={errores.area ? "area-error" : "area-help"}
                  >
                    <option value="">Seleccionar area...</option>
                    {areasTrabajo.map((area) => (
                      <option key={area.id ?? area.nombre} value={area.nombre}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => setMostrarModalArea(true)}
                    aria-label="Crear area"
                    title="Crear area"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                {errores.area && (
                  <div id="area-error" className="text-danger small mt-1" role="alert">
                    {errores.area}
                  </div>
                )}
                <div id="area-help" className="form-text">
                  Selecciona un area existente o crea una nueva con el boton +.
                </div>
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">Observaciones</label>
                <textarea
                  name="observaciones"
                  className="form-control"
                  rows="2"
                  value={formData.observaciones}
                  onChange={handleFormChange}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`card shadow-sm ${errores.detalles ? "border border-danger" : "border-0"}`}>
          <div className="card-header bg-white py-3">
            <h5 className={`mb-0 ${errores.detalles ? "text-danger" : "text-secondary"}`}>
              <i className="bi bi-list-check me-2"></i>Insumos de salida
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive mb-3">
              <table className="table table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Insumo</th>
                    <th className="text-end">Cantidad</th>
                    <th>Unidad</th>
                    <th className="text-end">Stock disponible</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.length > 0 ? (
                    detalles.map((item) => (
                      <tr key={item.id} className={item.stockDesactualizado ? "table-warning" : ""}>
                        <td>{item.insumoNombre}</td>
                        <td className="text-end" style={{ maxWidth: "130px" }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.]?[0-9]*"
                            className={`form-control form-control-sm text-end ${
                              errores.detalles && Number(item.cantidad || 0) <= 0 ? "is-invalid" : ""
                            }`}
                            value={item.cantidad}
                            placeholder="0.00"
                            onChange={(e) => actualizarCantidadDetalle(item.id, e.target.value)}
                            data-cantidad-detalle-invalida={
                              errores.detalles && Number(item.cantidad || 0) <= 0 ? "true" : undefined
                            }
                          />
                        </td>
                        <td>{item.unidad}</td>
                        <td className={`text-end ${item.stockDesactualizado ? "text-danger fw-semibold" : ""}`}>
                          {item.stockDesactualizado
                            ? `Actual: ${Number(item.stockBase || 0).toFixed(2)}`
                            : Number(item.stockActual).toFixed(2)}
                        </td>
                        <td className="text-end">
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminarDetalle(item.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No hay insumos agregados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-light rounded p-3">
              {(errores.detalles || errores.insumoBusqueda) && (
                <div id="insumo-error" className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 small" role="alert">
                  <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                  <span>
                    {errores.insumoBusqueda || "Selecciona un insumo y pulsa Agregar para incluirlo en la salida."}
                  </span>
                </div>
              )}
              <div className="row g-2 align-items-end">
                <div className="col-md-8">
                  <label
                    className={`form-label fw-semibold small ${
                      errores.detalles || errores.insumoBusqueda ? "text-danger" : ""
                    }`}
                    htmlFor="busquedaInsumo"
                  >
                    Insumo *
                  </label>
                  <div
                    className="position-relative"
                    ref={buscadorInsumoRef}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setSugerenciasInsumo([]);
                      }
                    }}
                  >
                    <input
                      id="busquedaInsumo"
                      ref={buscadorInsumoInputRef}
                      type="search"
                      className={`form-control ${
                        errores.detalles || errores.insumoBusqueda ? "is-invalid" : ""
                      }`}
                      value={busquedaInsumo}
                      onChange={(e) => {
                        setBusquedaInsumo(e.target.value);
                        actualizarSugerencias(e.target.value);
                        if (errores.detalles || errores.insumoBusqueda) {
                          setErrores((prev) => {
                            const copia = { ...prev };
                            delete copia.detalles;
                            delete copia.insumoBusqueda;
                            return copia;
                          });
                        }
                      }}
                      onFocus={(e) => actualizarSugerencias(e.target.value)}
                      onClick={(e) => actualizarSugerencias(e.target.value)}
                      onKeyDown={handleBusquedaKeyDown}
                      placeholder="Escribe el nombre o escanea el código y presiona Enter"
                      autoFocus
                      autoComplete="off"
                      aria-invalid={Boolean(errores.detalles || errores.insumoBusqueda)}
                      aria-describedby={
                        errores.detalles || errores.insumoBusqueda ? "insumo-error" : undefined
                      }
                    />
                    {sugerenciasInsumo.length > 0 && (
                      <div
                        className="list-group position-absolute w-100 shadow-sm"
                        style={{ zIndex: 10, maxHeight: "240px", overflowY: "auto" }}
                      >
                        {sugerenciasInsumo.map((insumo) => (
                          <button
                            key={insumo.id}
                            type="button"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => {
                              setBusquedaInsumo(insumo.nombre || "");
                              setSugerenciasInsumo([]);
                              setErrores((prev) => {
                                const copia = { ...prev };
                                delete copia.detalles;
                                delete copia.insumoBusqueda;
                                return copia;
                              });
                            }}
                          >
                            <span className="text-start">
                              <strong className="d-block">{insumo.nombre}</strong>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2">
                  <label
                    className={`form-label fw-semibold small ${errores.cantidadEntrada ? "text-danger" : ""}`}
                    htmlFor="cantidadEntrada"
                  >
                    Cantidad *
                  </label>
                  <input
                    id="cantidadEntrada"
                    ref={cantidadEntradaRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    className={`form-control ${errores.cantidadEntrada ? "is-invalid" : ""}`}
                    value={cantidadEntrada}
                    placeholder="0.00"
                    onChange={(e) => handleCantidadEntradaChange(e.target.value)}
                    aria-invalid={Boolean(errores.cantidadEntrada)}
                    aria-describedby={errores.cantidadEntrada ? "cantidadEntrada-error" : undefined}
                  />
                  <div id="cantidadEntrada-error" className="invalid-feedback">
                    {errores.cantidadEntrada}
                  </div>
                </div>
                <div className="col-md-2">
                  <button type="button" className="btn btn-success w-100" onClick={agregarDetalle} disabled={actualizandoStock}>
                    <i className="bi bi-plus-lg me-2"></i>Agregar
                  </button>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Total de piezas a salir: <strong>{totalCantidad.toFixed(2)}</strong>
              </small>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDetalles([])}>
                Vaciar detalles
              </button>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-light px-4"
            onClick={() => navigate("/salidas-insumos")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary px-5 fw-bold" disabled={cargando || actualizandoStock}>
            {cargando ? "Guardando..." : actualizandoStock ? "Actualizando stock..." : "Guardar salida"}
          </button>
        </div>
      </form>

      {mostrarModalArea && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <form onSubmit={guardarNuevaArea}>
                  <div className="modal-header">
                    <div>
                      <h5 className="modal-title mb-0">Nueva area</h5>
                      <small className="text-muted">Crea el area y se seleccionara en la salida.</small>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={cerrarModalArea}
                      disabled={guardandoArea}
                      aria-label="Cerrar"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={nuevaArea.nombre}
                        onChange={(event) => setNuevaArea((prev) => ({ ...prev, nombre: event.target.value }))}
                        placeholder="Ej: Produccion, Almacen, Tapiceria"
                        autoFocus
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label fw-semibold">Descripcion</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={nuevaArea.descripcion}
                        onChange={(event) => setNuevaArea((prev) => ({ ...prev, descripcion: event.target.value }))}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={cerrarModalArea}
                      disabled={guardandoArea}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-success" disabled={guardandoArea}>
                      {guardandoArea ? "Guardando..." : "Crear area"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
