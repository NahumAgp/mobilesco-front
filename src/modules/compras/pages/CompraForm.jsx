import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  obtenerCompraPorId, 
  crearCompra, 
  actualizarCompra,
  obtenerPreciosAnterioresCompra,
  subirComprobanteCompra,
} from "../services/compras.js";
import { obtenerProveedores } from "../../proveedores/services/proveedores.js";
import ProveedorModal from "../../proveedores/pages/ProveedorModal.jsx";
import { buscarInsumos } from "../../insumos/services/insumos.js";
import InsumoForm from "../../insumos/pages/InsumoForm.jsx";
import { obtenerUnidadesMedida } from "../../unidades-medida/services/unidadMedidas.js";
import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import ConfirmationDialog from "../../../components/ui/ConfirmationDialog.jsx";
import CurrencyInput from "../components/CurrencyInput.jsx";
import { formatMoney, formatMoneyAmount } from "../utils/money.js";
import { detectarCambiosPrecio } from "../utils/preciosCompra.js";

const ESTADOS_EDITABLES = new Set(["BORRADOR", "PENDIENTE"]);

function normalizarDetalleCargado(detalle, index) {
  const cantidad = Number(detalle?.cantidad || 0);
  const precioUnitario = Number(detalle?.precioUnitario || 0);
  const factorOriginal = Number(detalle?.factorConversion ?? 1);
  const factorConversion = factorOriginal > 0 ? factorOriginal : 1;
  const insumoId = detalle?.insumoId ?? detalle?.insumo?.id ?? "";
  const unidadCompraId = detalle?.unidadCompraId ?? detalle?.unidadCompra?.id ?? "";
  const unidadConsumoId = detalle?.unidadConsumoId ?? detalle?.unidadConsumo?.id ?? null;
  const requiereConversion = Boolean(
    factorConversion !== 1
      || (unidadConsumoId && String(unidadCompraId) !== String(unidadConsumoId))
  );

  return {
    ...detalle,
    id: detalle?.id ?? `detalle-cargado-${insumoId || index}`,
    insumoId,
    insumoNombre: detalle?.insumoNombre || detalle?.insumo?.nombre || `Insumo #${insumoId}`,
    cantidad,
    precioUnitario,
    unidadCompraId,
    unidadCompraSimbolo: detalle?.unidadCompraSimbolo || detalle?.unidadCompra?.simbolo || "",
    unidadCompraNombre: detalle?.unidadCompraNombre || detalle?.unidadCompra?.nombre || "",
    unidadConsumoId,
    unidadConsumoSimbolo: detalle?.unidadConsumoSimbolo || detalle?.unidadConsumo?.simbolo || "",
    factorConversion,
    requiereConversion,
    cantidadEnUnidadConsumo: cantidad * factorConversion,
    costoPorUnidadConsumo: Number(
      detalle?.costoPorUnidadConsumo ?? precioUnitario / factorConversion
    ),
    subtotal: Number(detalle?.subtotal ?? cantidad * precioUnitario),
    observaciones: detalle?.observaciones || ""
  };
}

function normalizarCompraCargada(data) {
  const detalles = (data?.detalles || []).map(normalizarDetalleCargado);
  return {
    formData: {
      folio: data?.folio || "",
      fechaCompra: data?.fechaCompra?.split("T")[0] || "",
      fechaRecepcion: data?.fechaRecepcion?.split("T")[0] || "",
      proveedorId: data?.proveedorId || "",
      metodoPago: data?.metodoPago || "",
      subtotal: Number(data?.subtotal || 0),
      impuesto: Number(data?.impuesto || 0),
      total: Number(data?.total || 0),
      observaciones: data?.observaciones || "",
      estado: data?.estado || "PENDIENTE",
      activo: data?.activo ?? true,
      detalles
    },
    detalles
  };
}

export default function CompraForm({ 
  compraId,     // para la página
  compra,       // para el modal
  onSave,       // para el modal
  onCancel,     // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [confirmacionPrecio, setConfirmacionPrecio] = useState(null);
  const [consultandoPrecios, setConsultandoPrecios] = useState(false);
  const [consultandoPrecioDetalle, setConsultandoPrecioDetalle] = useState(false);
  const [advertenciaPrecioDetalle, setAdvertenciaPrecioDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [comprobante, setComprobante] = useState(() =>
    compra?.comprobanteId ? { id: compra.comprobanteId, nombre: compra.comprobanteNombre, vinculado: true } : null
  );
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState("");
  const comprobanteInputRef = useRef(null);
  
  const [proveedores, setProveedores] = useState([]);
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [insumosBuscados, setInsumosBuscados] = useState([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [mostrarAltaRapida, setMostrarAltaRapida] = useState(false);
  const [detalleEnEdicionId, setDetalleEnEdicionId] = useState(null);
  const [detalleEdicionBackup, setDetalleEdicionBackup] = useState(null);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(compraId) || Boolean(compra);

  useEffect(() => {
    if (esEdicion) return undefined;
    const timer = window.setTimeout(() => comprobanteInputRef.current?.click(), 0);
    return () => window.clearTimeout(timer);
  }, [esEdicion]);

  const [formData, setFormData] = useState({
    folio: "",
    fechaCompra: new Date().toISOString().split('T')[0],
    fechaRecepcion: "",
    proveedorId: "",
    metodoPago: "",
    subtotal: 0,
    impuesto: 0,
    total: 0,
    observaciones: "",
    estado: "PENDIENTE",
    activo: true,
    detalles: []
  });

  const [detalles, setDetalles] = useState([]);
  const [estadoCompraCargada, setEstadoCompraCargada] = useState(compra?.estado || null);
  const [cargandoCompra, setCargandoCompra] = useState(Boolean(compraId && !compra));
  const [errorCargaCompra, setErrorCargaCompra] = useState("");
  const [nuevoDetalle, setNuevoDetalle] = useState({
    insumoId: "",
    cantidad: "",
    unidadCompraId: "",
    precioUnitario: "",
    factorConversion: "",
    requiereConversion: false,
    insumoSeleccionado: null
  });
  const soloLectura = Boolean(
    esEdicion
      && !cargandoCompra
      && estadoCompraCargada
      && !ESTADOS_EDITABLES.has(String(estadoCompraCargada).toUpperCase())
  );
  const subtotalCalculado = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
  const totalCalculado = subtotalCalculado + (formData.impuesto || 0);

  const obtenerUnidadMedidaPorId = (unidadId) =>
    unidadesMedida.find((um) => String(um.id) === String(unidadId)) || null;

  const esDecimalValido = (valor) => /^\d*(\.\d{0,4})?$/.test(String(valor));

  const obtenerEtiquetaUnidad = (unidad) => {
    if (!unidad) return "";
    return unidad.simbolo || unidad.nombre || "";
  };

  const recalcularDetalle = (detalleBase, cambios = {}) => {
    const cantidad = Number(cambios.cantidad ?? detalleBase.cantidad ?? 0);
    const precioUnitario = Number(cambios.precioUnitario ?? detalleBase.precioUnitario ?? 0);
    const factorPropuesto = Number(cambios.factorConversion ?? detalleBase.factorConversion ?? 1);
    const unidadCompraId = cambios.unidadCompraId ?? detalleBase.unidadCompraId ?? "";

    const unidadCompra = obtenerUnidadMedidaPorId(unidadCompraId);
    const unidadConsumoId = cambios.unidadConsumoId ?? detalleBase.unidadConsumoId ?? null;
    const unidadConsumoSimbolo = cambios.unidadConsumoSimbolo ?? detalleBase.unidadConsumoSimbolo ?? "";
    const requiereConversion = Boolean(
      unidadConsumoId && String(unidadCompraId) !== String(unidadConsumoId)
    );
    const factorConversion = requiereConversion ? (factorPropuesto > 0 ? factorPropuesto : 1) : 1;
    const cantidadEnUnidadConsumo = cantidad * factorConversion;
    const costoPorUnidadConsumo = factorConversion > 0 ? precioUnitario / factorConversion : 0;
    const subtotal = cantidad * precioUnitario;

    return {
      ...detalleBase,
      ...cambios,
      cantidad,
      precioUnitario,
      factorConversion,
      requiereConversion,
      unidadCompraId: unidadCompra ? unidadCompra.id : unidadCompraId,
      unidadCompraSimbolo: unidadCompra?.simbolo || detalleBase.unidadCompraSimbolo || "",
      unidadCompraNombre: unidadCompra?.nombre || detalleBase.unidadCompraNombre || "",
      unidadConsumoId,
      unidadConsumoSimbolo,
      cantidadEnUnidadConsumo,
      costoPorUnidadConsumo,
      subtotal
    };
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [proveedoresData, unidadesData] = await Promise.all([
          obtenerProveedores(),
          obtenerUnidadesMedida()
        ]);

        setProveedores(proveedoresData.content || proveedoresData);
        setUnidadesMedida(unidadesData.content || unidadesData);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar datos de la compra si estamos editando
  useEffect(() => {
    let active = true;

    const aplicarCompra = (data) => {
      if (!active) return;
      const normalizada = normalizarCompraCargada(data);
      setFormData(normalizada.formData);
      setDetalles(normalizada.detalles);
      setEstadoCompraCargada(normalizada.formData.estado);
      setComprobante(data?.comprobanteId
        ? { id: data.comprobanteId, nombre: data.comprobanteNombre, vinculado: true }
        : null);
    };

    const cargar = async () => {
      if (esModal && compra) {
        aplicarCompra(compra);
        setCargandoCompra(false);
        setErrorCargaCompra("");
        return;
      }

      if (!esModal && compraId) {
        try {
          setCargandoCompra(true);
          setErrorCargaCompra("");
          const data = await obtenerCompraPorId(compraId);
          aplicarCompra(data);
        } catch (error) {
          console.error("Error cargando:", error);
          if (active) {
            setErrorCargaCompra(error.message || "No fue posible cargar la compra.");
          }
        } finally {
          if (active) setCargandoCompra(false);
        }
      } else if (active) {
        setCargandoCompra(false);
      }
    };
    cargar();

    return () => {
      active = false;
    };
  }, [compraId, compra, esModal]);

  useEffect(() => {
    const termino = busquedaInsumo.trim();
    if (!termino) {
      setInsumosBuscados([]);
      setCargandoInsumos(false);
      return undefined;
    }

    let cancelado = false;
    const timer = window.setTimeout(async () => {
      try {
        setCargandoInsumos(true);
        const data = await buscarInsumos(termino, { soloActivos: true });
        if (!cancelado) {
          setInsumosBuscados(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Error buscando insumos:", error);
        }
      } finally {
        if (!cancelado) {
          setCargandoInsumos(false);
        }
      }
    }, 250);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [busquedaInsumo]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              (type === "number" ? parseFloat(value) || 0 : value)
    }));

    if (erroresBackend[name]) {
      setErroresBackend(prev => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  }

  const seleccionarComprobante = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;
    setComprobante(null);
    setErrorComprobante("");
    if (!(["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(archivo.type))
      || archivo.size > 10 * 1024 * 1024) {
      setErrorComprobante("Selecciona una imagen JPG, PNG o WebP, o un PDF de hasta 10 MB.");
      return;
    }
    try {
      setSubiendoComprobante(true);
      const cargado = await subirComprobanteCompra(archivo);
      if (!cargado?.id) throw new Error("No se confirmó la carga del comprobante. Inténtalo de nuevo.");
      setComprobante({ id: cargado.id, nombre: cargado.nombre, vinculado: false });
    } catch (error) {
      setErrorComprobante(error.message || "No se pudo cargar el comprobante. Vuelve a seleccionarlo.");
    } finally {
      setSubiendoComprobante(false);
    }
  };

  function handleDetalleChange(e) {
    const { name, value } = e.target;
    
    if (name === "insumoId") {
      const insumo = insumosBuscados.find(i => String(i.id) === String(value));
      setNuevoDetalle(prev => ({
        ...prev,
        insumoId: value,
        insumoSeleccionado: insumo,
        unidadCompraId: "",
        factorConversion: "",
        requiereConversion: false
      }));
    } 
    else if (name === "unidadCompraId") {
      const insumo = nuevoDetalle.insumoSeleccionado;
      const unidadConsumoId = insumo?.unidadMedida?.id;
      
      // Determinar si la unidad seleccionada es diferente a la unidad de consumo
      const requiereConversion = unidadConsumoId && parseInt(value) !== unidadConsumoId;
      
      setNuevoDetalle(prev => ({
        ...prev,
        unidadCompraId: value,
        requiereConversion,
        // Si no requiere conversión, el factor es 1
        factorConversion: requiereConversion ? prev.factorConversion : ""
      }));
    }
    else {
      if (["cantidad", "precioUnitario", "factorConversion"].includes(name) && !esDecimalValido(value)) {
        return;
      }

      setNuevoDetalle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const seleccionarInsumo = (insumo) => {
    if (!insumo) return;

    setNuevoDetalle((prev) => ({
      ...prev,
      insumoId: String(insumo.id),
      insumoSeleccionado: insumo,
      unidadCompraId: String(insumo.unidadMedida?.id || ""),
      factorConversion: "",
      requiereConversion: false
    }));
    setMostrarAltaRapida(false);
  };

  const manejarSeleccionInsumo = (value, insumo) => {
    if (!insumo) return;
    seleccionarInsumo(insumo);
    setToastType("success");
    setToastMessage(`Insumo seleccionado: ${insumo.nombre}`);
  };

  const iniciarAltaRapida = () => {
    setMostrarAltaRapida(true);
  };

  const manejarInsumoCreadoDesdeModal = (creado) => {
    const insumoNormalizado = {
      ...creado,
      unidadMedida: creado.unidadMedida || obtenerUnidadMedidaPorId(creado.unidadMedidaId) || null
    };

    setInsumosBuscados((prev) => [insumoNormalizado, ...prev]);
    seleccionarInsumo(insumoNormalizado);
    setMostrarAltaRapida(false);
    setToastType("success");
    setToastMessage("Insumo creado y seleccionado para la compra");
  };

  const prepararDetalle = (detalleBase) => recalcularDetalle(detalleBase);

  async function agregarDetalle() {
    if (consultandoPrecioDetalle) return;
    const cantidad = Number(nuevoDetalle.cantidad);
    const precioUnitario = Number(nuevoDetalle.precioUnitario);
    const factorConversion = nuevoDetalle.requiereConversion ? Number(nuevoDetalle.factorConversion) : 1;

    if (!nuevoDetalle.insumoSeleccionado || !nuevoDetalle.unidadCompraId || cantidad <= 0 || precioUnitario <= 0) {
      alert("Completa todos los campos del detalle");
      return;
    }

    if (nuevoDetalle.requiereConversion && (!nuevoDetalle.factorConversion || nuevoDetalle.factorConversion <= 0)) {
      alert("El factor de conversión debe ser mayor a 0");
      return;
    }

    const insumo = nuevoDetalle.insumoSeleccionado;
    const unidad = unidadesMedida.find(u => u.id === parseInt(nuevoDetalle.unidadCompraId));
    
    if (!insumo || !unidad) return;

    const cantidadEnUnidadConsumo = cantidad * factorConversion;
    const costoPorUnidadConsumo = precioUnitario / factorConversion;
    const subtotal = cantidad * precioUnitario;

    const nuevoDetalleCompleto = prepararDetalle({
      id: Date.now(), // temporal
      insumoId: insumo.id,
      insumoSeleccionado: insumo,
      insumoNombre: insumo.nombre,
      cantidad,
      factorConversion,
      cantidadEnUnidadConsumo,
      unidadCompraId: unidad.id,
      unidadCompraSimbolo: unidad.simbolo,
      unidadConsumoId: insumo.unidadMedida?.id,
      unidadConsumoSimbolo: insumo.unidadMedida?.simbolo,
      precioUnitario,
      costoPorUnidadConsumo,
      subtotal,
      observaciones: ""
    });

    setConsultandoPrecioDetalle(true);
    setAdvertenciaPrecioDetalle(null);
    if (!esEdicion) {
      try {
        const anteriores = await obtenerPreciosAnterioresCompra([insumo.id]);
        const cambios = detectarCambiosPrecio([nuevoDetalleCompleto], anteriores);
        setAdvertenciaPrecioDetalle(cambios[0] || null);
      } catch {
        setAdvertenciaPrecioDetalle({ error: "No se pudo consultar el precio anterior. Se verificará de nuevo al guardar." });
      }
    }
    setConsultandoPrecioDetalle(false);
    setDetalles((prev) => [...prev, nuevoDetalleCompleto]);
    setErroresBackend((prev) => {
      if (!prev.detalles) return prev;
      const next = { ...prev };
      delete next.detalles;
      return next;
    });
    setNuevoDetalle({
      insumoId: "",
      cantidad: "",
      unidadCompraId: "",
      precioUnitario: "",
      factorConversion: "",
      requiereConversion: false,
      insumoSeleccionado: null
    });
    setBusquedaInsumo("");
    setInsumosBuscados([]);
  }

  const iniciarEdicionDetalle = (detalle) => {
    setDetalleEnEdicionId(detalle.id);
    setDetalleEdicionBackup(structuredClone(detalle));
  };

  const cancelarEdicionDetalle = () => {
    if (detalleEdicionBackup) {
      setDetalles((prev) =>
        prev.map((detalle) => (detalle.id === detalleEdicionBackup.id ? detalleEdicionBackup : detalle))
      );
    }
    setDetalleEnEdicionId(null);
    setDetalleEdicionBackup(null);
  };

  const guardarEdicionDetalle = () => {
    setDetalleEnEdicionId(null);
    setDetalleEdicionBackup(null);
  };

  const actualizarDetalle = (id, cambios) => {
    setDetalles((prev) =>
      prev.map((detalle) =>
        detalle.id === id ? recalcularDetalle(detalle, cambios) : detalle
      )
    );
    setErroresBackend((prev) => {
      if (!prev.detalles) return prev;
      const next = { ...prev };
      delete next.detalles;
      return next;
    });
  };

  function eliminarDetalle(id) {
    setDetalles((prev) => prev.filter((d) => d.id !== id));
    setErroresBackend((prev) => {
      if (!prev.detalles) return prev;
      const next = { ...prev };
      delete next.detalles;
      return next;
    });
    if (detalleEnEdicionId === id) {
      setDetalleEnEdicionId(null);
      setDetalleEdicionBackup(null);
    }
  }

  async function guardarCompra(dataToSend) {
    setGuardando(true);
    try {
      setErroresBackend({});

      let respuesta;
      if (esEdicion) {
        const id = compra?.id || compraId;
        respuesta = await actualizarCompra(id, dataToSend);
      } else {
        respuesta = await crearCompra(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Compra actualizada con éxito!" : "¡Compra registrada con éxito!");
        setTimeout(() => navigate("/compras"), 1500);
      }
    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (consultandoPrecios || consultandoPrecioDetalle || guardando || confirmacionPrecio) return;

    const erroresValidacion = {};

    if (!comprobante?.id || subiendoComprobante) {
      erroresValidacion.comprobanteId = "Carga el comprobante antes de guardar la compra";
    }

    if (!formData.folio?.trim()) {
      erroresValidacion.folio = "El folio es obligatorio";
    }

    if (!formData.metodoPago) {
      erroresValidacion.metodoPago = "Selecciona un metodo de pago";
    }

    if (detalles.length === 0) {
      erroresValidacion.detalles = "Agrega al menos un detalle a la compra";
    } else {
      const detalleSinDatos = detalles.find(
        (detalle) => !detalle.insumoId || !detalle.unidadCompraId
      );
      const detalleCantidadInvalida = detalles.find(
        (detalle) => Number(detalle.cantidad) <= 0
      );
      const detallePrecioInvalido = detalles.find(
        (detalle) => Number(detalle.precioUnitario) <= 0
      );
      const detalleFactorInvalido = detalles.find(
        (detalle) => Number(detalle.factorConversion || 1) <= 0
      );

      if (detalleSinDatos) {
        erroresValidacion.detalles = "Todos los detalles necesitan insumo y unidad de compra";
      } else if (detalleCantidadInvalida) {
        erroresValidacion.detalles = `La cantidad de ${detalleCantidadInvalida.insumoNombre || "cada insumo"} debe ser mayor a cero`;
      } else if (detallePrecioInvalido) {
        erroresValidacion.detalles = `Asigna un precio mayor a cero a ${detallePrecioInvalido.insumoNombre || "cada insumo"}`;
      } else if (detalleFactorInvalido) {
        erroresValidacion.detalles = `El factor de conversión de ${detalleFactorInvalido.insumoNombre || "cada insumo"} debe ser mayor a cero`;
      }
    }

    if (Object.keys(erroresValidacion).length > 0) {
      setErroresBackend(erroresValidacion);
      return;
    }

    const dataToSend = {
      ...formData,
      comprobanteId: comprobante.id,
      subtotal: subtotalCalculado,
      total: totalCalculado,
      detalles: detalles.map((detalle) => ({
        insumoId: Number(detalle.insumoId),
        unidadCompraId: Number(detalle.unidadCompraId),
        cantidad: Number(detalle.cantidad),
        factorConversion: Number(detalle.factorConversion || 1),
        precioUnitario: Number(detalle.precioUnitario),
        subtotal: Number(detalle.cantidad) * Number(detalle.precioUnitario),
        observaciones: detalle.observaciones || ""
      }))
    };

    if (!esEdicion) {
      setConsultandoPrecios(true);
      try {
        const anteriores = await obtenerPreciosAnterioresCompra(detalles.map((detalle) => detalle.insumoId));
        if (!anteriores || typeof anteriores !== "object") throw new Error("Respuesta de precios no válida");
        const cambios = detectarCambiosPrecio(detalles, anteriores);
        if (cambios.length) {
          setConfirmacionPrecio({ cambios, dataToSend });
          return;
        }
      } catch {
        setErroresBackend({ detalles: "No se pudo verificar el precio anterior. Reintenta antes de guardar." });
        return;
      } finally {
        setConsultandoPrecios(false);
      }
    }
    await guardarCompra(dataToSend);
  }

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/compras");
    }
  };

  const abrirAltaProveedor = () => {
    setMostrarModalProveedor(true);
  };

  const cerrarAltaProveedor = () => {
    setMostrarModalProveedor(false);
  };

  const manejarProveedorCreado = (proveedorCreado) => {
    if (!proveedorCreado?.id) {
      setMostrarModalProveedor(false);
      return;
    }

    setProveedores((prev) => {
      const sinDuplicados = prev.filter((prov) => String(prov.id) !== String(proveedorCreado.id));
      return [proveedorCreado, ...sinDuplicados];
    });

    setFormData((prev) => ({
      ...prev,
      proveedorId: String(proveedorCreado.id)
    }));

    setMostrarModalProveedor(false);
    setToastType("success");
    setToastMessage(
      `Proveedor ${proveedorCreado.razonSocial || proveedorCreado.nombre || "creado"} registrado y seleccionado`
    );
  };

  if (cargandoCompra) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-5" role="status" aria-live="polite">
        <span className="spinner-border text-primary" aria-hidden="true"></span>
        <strong>Cargando compra…</strong>
      </div>
    );
  }

  if (errorCargaCompra) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-circle me-2" aria-hidden="true"></i>
        {errorCargaCompra}
      </div>
    );
  }

  if (soloLectura) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Esta compra no puede ser editada porque ya está {String(estadoCompraCargada).toLowerCase()}.
      </div>
    );
  }

  if (!comprobante?.id) {
    return (
      <div className={esModal ? "" : "container py-4"}>
        {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h2 className="h4">Comprobante de compra</h2>
            <p className="text-muted">Selecciona una imagen o un PDF. La captura se habilitará cuando termine la carga.</p>
            <label className="form-label fw-semibold" htmlFor="compra-comprobante">Imagen o PDF del comprobante *</label>
            <input
              id="compra-comprobante"
              ref={comprobanteInputRef}
              className="form-control"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              onChange={seleccionarComprobante}
              disabled={subiendoComprobante}
            />
            {subiendoComprobante && <div className="text-muted mt-2" role="status">Cargando comprobante...</div>}
            {errorComprobante && <div className="alert alert-danger mt-3" role="alert">{errorComprobante}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Compra' : 'Nueva Compra'}</h2>
        </div>
      )}

      <div className="alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span><strong>Comprobante cargado:</strong> {comprobante.nombre || "Archivo asociado"}</span>
        {!comprobante.vinculado && (
          <>
            <input
              ref={comprobanteInputRef}
              className="d-none"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              onChange={seleccionarComprobante}
              aria-label="Cambiar comprobante de compra"
            />
            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => comprobanteInputRef.current?.click()}>
              Cambiar archivo
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-md-8">
            {/* Datos generales */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-cart me-2"></i>Información General
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="compra-folio">Folio *</label>
                    <input 
                      id="compra-folio"
                      type="text" 
                      name="folio" 
                      className={inputClass("folio")} 
                      value={formData.folio} 
                      onChange={handleChange} 
                      placeholder="Ej: COMP-001"
                      required
                    />
                    {(erroresBackend.folio || erroresExternos.folio) && (
                      <div className="invalid-feedback">{erroresBackend.folio || erroresExternos.folio}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Fecha Compra *</label>
                    <input 
                      type="date" 
                      name="fechaCompra" 
                      className={inputClass("fechaCompra")} 
                      value={formData.fechaCompra} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Fecha Recepción <span className="text-muted fw-normal">(opcional)</span></label>
                    <input 
                      type="date" 
                      name="fechaRecepcion" 
                      className={inputClass("fechaRecepcion")} 
                      value={formData.fechaRecepcion} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Proveedor *</label>
                    <div className="d-flex gap-2 align-items-start">
                      <div className="flex-grow-1">
                        <SearchableSelect
                          value={formData.proveedorId}
                          options={proveedores}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              proveedorId: value
                            }));
                          }}
                          placeholder="Buscar proveedor por razón social..."
                          searchPlaceholder="Escribe razón social, RFC o nombre del contacto..."
                          emptyText="No hay proveedores que coincidan"
                          error={erroresBackend.proveedorId || erroresExternos.proveedorId || ""}
                          getOptionValue={(prov) => prov.id}
                          getOptionLabel={(prov) => `${prov.razonSocial || prov.nombre || "Sin razón social"}${prov.rfc ? ` - ${prov.rfc}` : ""}`}
                          getOptionSearchText={(prov) =>
                            [
                              prov.razonSocial,
                              prov.rfc,
                              prov.nombre,
                              prov.apellidoPaterno,
                              prov.apellidoMaterno
                            ].filter(Boolean).join(" ").toLowerCase()
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        title="Registrar proveedor nuevo"
                        onClick={abrirAltaProveedor}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold" htmlFor="compra-metodo-pago">Metodo de pago *</label>
                    <select
                      id="compra-metodo-pago"
                      name="metodoPago"
                      className={selectClass("metodoPago")}
                      value={formData.metodoPago || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar metodo</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CREDITO">Credito</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    {(erroresBackend.metodoPago || erroresExternos.metodoPago) && (
                      <div className="invalid-feedback">{erroresBackend.metodoPago || erroresExternos.metodoPago}</div>
                    )}
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Observaciones</label>
                    <textarea
                      name="observaciones"
                      className={inputClass("observaciones")}
                      value={formData.observaciones || ""}
                      onChange={handleChange}
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de compra */}
            <div
              className="card shadow-sm border-0 mb-4"
              style={!esModal ? { width: "calc(150% + 1.5rem)", maxWidth: "calc(150% + 1.5rem)" } : undefined}
            >
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-list-ul me-2"></i>Detalles de Compra
                </h5>
              </div>
              <div className="card-body">
                {erroresBackend.detalles && (
                  <div className="alert alert-danger py-2" role="alert">
                    <i className="bi bi-exclamation-circle me-2" aria-hidden="true"></i>
                    {erroresBackend.detalles}
                  </div>
                )}
                {advertenciaPrecioDetalle && (
                  <div className="alert alert-warning d-flex justify-content-between align-items-start gap-2" role="alert">
                    <div>
                      {advertenciaPrecioDetalle.error || <>
                        <strong>El precio de {advertenciaPrecioDetalle.insumoNombre} cambió.</strong>{" "}
                        Anterior: {formatMoney(advertenciaPrecioDetalle.precioAnterior)}{advertenciaPrecioDetalle.unidadAnterior ? ` / ${advertenciaPrecioDetalle.unidadAnterior}` : ""};{" "}
                        nuevo: {formatMoney(advertenciaPrecioDetalle.precioNuevo)}{advertenciaPrecioDetalle.unidadNueva ? ` / ${advertenciaPrecioDetalle.unidadNueva}` : ""}.
                        {" "}Confirma el cambio al guardar la compra.
                      </>}
                    </div>
                    <button type="button" className="btn-close" aria-label="Cerrar advertencia de precio"
                      onClick={() => setAdvertenciaPrecioDetalle(null)} />
                  </div>
                )}
                <div className="table-responsive mb-3">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Insumo</th>
                        <th className="text-end">Cantidad</th>
                        <th>Unidad</th>
                        <th className="text-end">Precio Unit.</th>
                        <th>Factor</th>
                        <th className="text-end">Costo x UC</th>
                        <th className="text-end">Subtotal</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((detalle) => {
                        const enEdicion = detalleEnEdicionId === detalle.id;
                        const requiereConversion = Boolean(detalle.requiereConversion || Number(detalle.factorConversion) !== 1);

                        return (
                          <tr key={detalle.id} className={enEdicion ? "table-warning" : ""}>
                            <td>
                              <div className="fw-semibold">{detalle.insumoNombre}</div>
                              {detalle.insumoSeleccionado?.codigoBarras && (
                                <small className="text-muted d-block">
                                  Código: {detalle.insumoSeleccionado.codigoBarras}
                                </small>
                              )}
                              {detalle.observaciones && !enEdicion && (
                                <small className="text-muted d-block">{detalle.observaciones}</small>
                              )}
                            </td>
                            <td className="text-end" style={{ minWidth: "120px" }}>
                              {enEdicion ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className="form-control form-control-sm text-end"
                                  value={detalle.cantidad}
                                  onChange={(e) => actualizarDetalle(detalle.id, { cantidad: Number(e.target.value) || 0 })}
                                  aria-label={`Cantidad de ${detalle.insumoNombre}`}
                                />
                              ) : (
                                Number(detalle.cantidad || 0).toFixed(2)
                              )}
                            </td>
                            <td style={{ minWidth: "150px" }}>
                              {enEdicion ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={detalle.unidadCompraId}
                                  aria-label={`Unidad de compra de ${detalle.insumoNombre}`}
                                  onChange={(e) => {
                                    const unidadCompraId = Number(e.target.value) || "";
                                    const unidadConsumoId = detalle.unidadConsumoId;
                                    const requiereConv = Boolean(unidadConsumoId && String(unidadCompraId) !== String(unidadConsumoId));
                                    actualizarDetalle(detalle.id, {
                                      unidadCompraId,
                                      requiereConversion: requiereConv,
                                      factorConversion: requiereConv ? Number(detalle.factorConversion || 1) : 1
                                    });
                                  }}
                                >
                                  <option value="">Seleccionar...</option>
                                  {unidadesMedida.map((um) => (
                                    <option key={um.id} value={um.id}>
                                      {um.simbolo} - {um.nombre}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                detalle.unidadCompraSimbolo
                              )}
                            </td>
                            <td className="text-end" style={{ minWidth: "130px" }}>
                              {enEdicion ? (
                                <CurrencyInput
                                  className="form-control form-control-sm text-end"
                                  value={detalle.precioUnitario}
                                  onValueChange={(value) => actualizarDetalle(detalle.id, { precioUnitario: value })}
                                  aria-label={`Precio unitario de ${detalle.insumoNombre}`}
                                />
                              ) : (
                                formatMoney(detalle.precioUnitario)
                              )}
                            </td>
                            <td className="text-end" style={{ minWidth: "110px" }}>
                              {enEdicion && requiereConversion ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className="form-control form-control-sm text-end"
                                  value={detalle.factorConversion}
                                  onChange={(e) => actualizarDetalle(detalle.id, { factorConversion: Number(e.target.value) || 0 })}
                                />
                              ) : (
                                Number(detalle.factorConversion || 1).toFixed(2)
                              )}
                            </td>
                            <td className="text-end text-info">
                              {formatMoney(detalle.costoPorUnidadConsumo)}
                            </td>
                            <td className="text-end fw-bold">
                              {formatMoney(detalle.subtotal)}
                            </td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-1">
                                {enEdicion ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={guardarEdicionDetalle}
                                      aria-label={`Guardar detalle de ${detalle.insumoNombre}`}
                                    >
                                      <i className="bi bi-check-lg"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={cancelarEdicionDetalle}
                                      aria-label={`Cancelar edición de ${detalle.insumoNombre}`}
                                    >
                                      <i className="bi bi-x-lg"></i>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => iniciarEdicionDetalle(detalle)}
                                      aria-label={`Editar detalle de ${detalle.insumoNombre}`}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => eliminarDetalle(detalle.id)}
                                      aria-label={`Eliminar detalle de ${detalle.insumoNombre}`}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {detalles.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-3">
                            No hay detalles agregados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row g-2 align-items-end bg-light p-3 rounded flex-nowrap">
                  <div className="col" style={{ minWidth: 0 }}>
                    <SearchableSelect
                      label="Buscar insumo"
                      value={nuevoDetalle.insumoId}
                      options={insumosBuscados}
                      onChange={manejarSeleccionInsumo}
                      onSearchChange={setBusquedaInsumo}
                      loading={cargandoInsumos}
                      placeholder="Busca por nombre, código o código de barras..."
                      searchPlaceholder="Escribe para consultar el catálogo"
                      emptyText={busquedaInsumo.trim() ? "No se encontraron coincidencias" : "Empieza escribiendo para buscar"}
                      error=""
                      getOptionValue={(ins) => ins.id}
                      getOptionLabel={(ins) => (ins.nombre || "") + (ins.codigoBarras ? " - " + ins.codigoBarras : "")}
                      getOptionSearchText={(ins) => [
                        ins.nombre,
                        ins.codigo,
                        ins.codigoBarras,
                        ins.descripcion,
                        ins.ubicacion,
                        ins.unidadMedida?.nombre,
                        ins.unidadMedida?.simbolo
                      ].filter(Boolean).join(" ").toLowerCase()}
                      renderOptionLabel={(ins) => (
                        <div>
                          <div className="fw-semibold">{ins.nombre}</div>
                          <small className="text-muted">
                            {ins.codigoBarras || ins.codigo || "Sin código"}
                            {ins.unidadMedida?.simbolo ? " · " + ins.unidadMedida.simbolo : ""}
                          </small>
                        </div>
                      )}
                      actionNode={(
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-3"
                          onClick={iniciarAltaRapida}
                          title="Agregar insumo"
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      )}
                    />
                  </div>

                  <div className="col-auto" style={{ width: "90px" }}>
                    <label className="form-label fw-semibold small">Cant.</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control form-control-sm"
                      name="cantidad"
                      aria-label="Cantidad del nuevo detalle"
                      value={nuevoDetalle.cantidad}
                      onChange={handleDetalleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-auto" style={{ width: "190px" }}>
                    <label className="form-label fw-semibold small">Unidad Compra</label>
                    <select
                      className="form-select form-select-sm"
                      name="unidadCompraId"
                      value={nuevoDetalle.unidadCompraId}
                      onChange={handleDetalleChange}
                      disabled={!nuevoDetalle.insumoId}
                    >
                      <option value="">Seleccionar...</option>
                      {unidadesMedida.map((um) => (
                        <option key={um.id} value={um.id}>
                          {String(nuevoDetalle.unidadCompraId) === String(um.id) ? obtenerEtiquetaUnidad(um) : `${um.simbolo} - ${um.nombre}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-auto" style={{ width: "130px" }}>
                    <label className="form-label fw-semibold small">Precio $</label>
                    <CurrencyInput
                      className="form-control form-control-sm"
                      aria-label="Precio unitario del nuevo detalle"
                      value={nuevoDetalle.precioUnitario}
                      onValueChange={(value) => setNuevoDetalle((prev) => ({ ...prev, precioUnitario: value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-auto" style={{ width: "95px" }}>
                    <label className="form-label fw-semibold small">Factor</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control form-control-sm"
                      name="factorConversion"
                      value={nuevoDetalle.factorConversion}
                      onChange={handleDetalleChange}
                      disabled={!nuevoDetalle.requiereConversion}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-auto" style={{ width: "120px" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-success w-100"
                      onClick={agregarDetalle}
                      disabled={consultandoPrecioDetalle}
                    >
                      <i className="bi bi-plus-lg me-1"></i>{consultandoPrecioDetalle ? "Verificando..." : "Agregar"}
                    </button>
                  </div>
                </div>

                {busquedaInsumo.trim() && !nuevoDetalle.insumoSeleccionado && (
                  <div className="alert alert-warning mt-3 mb-0 d-flex justify-content-between align-items-center">
                    <div>
                      No encontramos coincidencias para <strong>{busquedaInsumo}</strong>.
                      Puedes crear el insumo desde aquí si lo necesitas.
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning"
                      onClick={iniciarAltaRapida}
                    >
                      Crear ahora
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
          <div className="col-md-4">
            {/* Totales */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-calculator me-2"></i>Totales
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Subtotal</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={formatMoneyAmount(subtotalCalculado)}
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Impuesto</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <CurrencyInput
                      className={inputClass("impuesto")}
                      value={formData.impuesto}
                      onValueChange={(value) => handleChange({ target: { name: "impuesto", type: "number", value: String(value) } })}
                      aria-label="Impuesto"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Total</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold text-primary"
                      value={formatMoneyAmount(totalCalculado)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de conversiones */}
            {detalles.some(d => d.factorConversion !== 1) && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h6 className="mb-0 text-secondary">
                    <i className="bi bi-arrow-left-right me-2"></i>Conversiones aplicadas
                  </h6>
                </div>
                <div className="card-body small">
                  {detalles.filter(d => d.factorConversion !== 1).map(d => (
                    <div key={d.id} className="mb-2">
                      <span className="fw-semibold">{d.insumoNombre}:</span>
                      <br />
                      {d.cantidad} {d.unidadCompraSimbolo} × {d.factorConversion} = {d.cantidadEnUnidadConsumo.toFixed(2)} {d.unidadConsumoSimbolo}
                      <br />
                      <small className="text-muted">
                        Costo x UC: {formatMoney(d.costoPorUnidadConsumo)} / {d.unidadConsumoSimbolo}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 bg-white p-3 rounded shadow-sm mt-4">
          <button 
            type="button" 
            className="btn btn-light px-4" 
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary px-5 fw-bold"
            disabled={consultandoPrecios || guardando}
          >
            {consultandoPrecios ? "Verificando precios..." : guardando ? "Guardando..." : esEdicion ? 'Guardar Cambios' : 'Guardar Compra'}
          </button>
        </div>
      </form>

      <ConfirmationDialog
        open={Boolean(confirmacionPrecio)}
        title="Confirmar cambio de precio"
        message={<>
          {confirmacionPrecio?.cambios.map((cambio, index) => (
            <span className="d-block mb-2" key={`${cambio.insumoNombre}-${index}`}>
              <strong>{cambio.insumoNombre}:</strong> anterior {formatMoney(cambio.precioAnterior)}{cambio.unidadAnterior ? ` / ${cambio.unidadAnterior}` : ""}; nuevo {formatMoney(cambio.precioNuevo)}{cambio.unidadNueva ? ` / ${cambio.unidadNueva}` : ""}.
            </span>
          ))}
          ¿Deseas guardar la compra con los nuevos precios?
        </>}
        confirmLabel="Confirmar y guardar"
        cancelLabel="Corregir compra"
        variant="primary"
        loading={guardando}
        onCancel={() => setConfirmacionPrecio(null)}
        onConfirm={() => {
          const payload = confirmacionPrecio.dataToSend;
          setConfirmacionPrecio(null);
          guardarCompra(payload);
        }}
      />

      <ProveedorModal
        show={mostrarModalProveedor}
        onClose={cerrarAltaProveedor}
        onSave={manejarProveedorCreado}
      />

      {mostrarAltaRapida && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-white">
                  <div>
                    <h5 className="modal-title mb-0">Agregar insumo</h5>
                    <small className="text-muted">Completa el formulario del catálogo para usarlo en esta compra.</small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={() => setMostrarAltaRapida(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <InsumoForm
                    onSave={manejarInsumoCreadoDesdeModal}
                    onCancel={() => setMostrarAltaRapida(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

