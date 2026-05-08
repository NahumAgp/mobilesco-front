import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  obtenerCompraPorId, 
  crearCompra, 
  actualizarCompra 
} from "../../services/compras.js";
import { obtenerProveedores } from "../../services/proveedores.js";
import { obtenerInsumos, crearInsumo } from "../../services/insumos.js";
import { obtenerUnidadesMedida } from "../../services/unidadMedidas.js";
import Toast from "../../components/ui/Toast.jsx";

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
  
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [codigoBusquedaInsumo, setCodigoBusquedaInsumo] = useState("");
  const [mostrarAltaRapida, setMostrarAltaRapida] = useState(false);
  const [creandoInsumoRapido, setCreandoInsumoRapido] = useState(false);
  const [erroresInsumoRapido, setErroresInsumoRapido] = useState({});
  const [nuevoInsumoRapido, setNuevoInsumoRapido] = useState({
    codigo: "",
    nombre: "",
    unidadMedidaId: "",
    stockMinimo: 0
  });
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(compraId) || Boolean(compra);
  const soloLectura = esEdicion && compra?.estado !== 'PENDIENTE';

  const [formData, setFormData] = useState({
    folio: "",
    fechaCompra: new Date().toISOString().split('T')[0],
    fechaRecepcion: "",
    proveedorId: "",
    tipoDocumento: "FACTURA",
    numeroDocumento: "",
    subtotal: 0,
    impuesto: 0,
    total: 0,
    observaciones: "",
    estado: "PENDIENTE",
    activo: true,
    detalles: []
  });

  const [detalles, setDetalles] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({
    insumoId: "",
    cantidad: 1,
    unidadCompraId: "",
    precioUnitario: 0,
    factorConversion: 1,
    requiereConversion: false,
    insumoSeleccionado: null
  });
  const subtotalCalculado = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  const totalCalculado = subtotalCalculado + (formData.impuesto || 0);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [proveedoresData, insumosData, unidadesData] = await Promise.all([
          obtenerProveedores(),
          obtenerInsumos(),
          obtenerUnidadesMedida()
        ]);

        setProveedores(proveedoresData.content || proveedoresData);
        setInsumos(insumosData.content || insumosData);
        setUnidadesMedida(unidadesData.content || unidadesData);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar datos de la compra si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && compra) {
        setFormData({
          folio: compra.folio || "",
          fechaCompra: compra.fechaCompra?.split('T')[0] || "",
          fechaRecepcion: compra.fechaRecepcion?.split('T')[0] || "",
          proveedorId: compra.proveedorId || "",
          tipoDocumento: compra.tipoDocumento || "FACTURA",
          numeroDocumento: compra.numeroDocumento || "",
          impuesto: compra.impuesto || 0,
          observaciones: compra.observaciones || "",
          estado: compra.estado || "PENDIENTE",
          activo: compra.activo ?? true,
          detalles: compra.detalles || []
        });
        setDetalles(compra.detalles || []);
        return;
      }

      if (!esModal && compraId) {
        try {
          const data = await obtenerCompraPorId(compraId);
          setFormData({
            folio: data.folio || "",
            fechaCompra: data.fechaCompra?.split('T')[0] || "",
            fechaRecepcion: data.fechaRecepcion?.split('T')[0] || "",
            proveedorId: data.proveedorId || "",
            tipoDocumento: data.tipoDocumento || "FACTURA",
            numeroDocumento: data.numeroDocumento || "",
            impuesto: data.impuesto || 0,
            observaciones: data.observaciones || "",
            estado: data.estado || "PENDIENTE",
            activo: data.activo ?? true,
            detalles: data.detalles || []
          });
          setDetalles(data.detalles || []);
        } catch (error) {
          console.error("Error cargando:", error);
        }
      }
    };
    cargar();
  }, [compraId, compra, esModal]);

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

  function handleDetalleChange(e) {
    const { name, value } = e.target;
    
    if (name === "insumoId") {
      const insumo = insumos.find(i => i.id === parseInt(value));
      setNuevoDetalle(prev => ({
        ...prev,
        insumoId: value,
        insumoSeleccionado: insumo,
        unidadCompraId: "",
        factorConversion: 1,
        requiereConversion: false
      }));
      setCodigoBusquedaInsumo(insumo?.codigoBarras || insumo?.codigo || insumo?.nombre || "");
      setMostrarAltaRapida(false);
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
        factorConversion: requiereConversion ? prev.factorConversion : 1
      }));
    }
    else {
      setNuevoDetalle(prev => ({
        ...prev,
        [name]: name === "cantidad" || name === "precioUnitario" || name === "factorConversion" 
                ? parseFloat(value) || 0 
                : value
      }));
    }
  }

  const normalizarTexto = (valor) => String(valor || "").trim().toLowerCase();
  const normalizarCodigo = (valor) => String(valor || "").replace(/\D/g, "");

  const buscarInsumoPorTexto = (valor) => {
    const termino = normalizarTexto(valor);
    if (!termino) return null;

    const terminoCodigo = normalizarCodigo(termino);

    const porCodigo = insumos.find((insumo) => {
      const codigoBarras = normalizarCodigo(insumo.codigoBarras);
      const codigo = normalizarCodigo(insumo.codigo);
      return codigoBarras === terminoCodigo || codigo === terminoCodigo;
    });

    if (porCodigo) return porCodigo;

    const porNombreExacto = insumos.find((insumo) => normalizarTexto(insumo.nombre) === termino);
    if (porNombreExacto) return porNombreExacto;

    return insumos.find((insumo) => {
      const nombre = normalizarTexto(insumo.nombre);
      const codigoBarras = normalizarTexto(insumo.codigoBarras);
      const codigo = normalizarTexto(insumo.codigo);
      return nombre.includes(termino) || codigoBarras.includes(termino) || codigo.includes(termino);
    }) || null;
  };

  const seleccionarInsumo = (insumo) => {
    if (!insumo) return;

    setNuevoDetalle((prev) => ({
      ...prev,
      insumoId: String(insumo.id),
      insumoSeleccionado: insumo,
      unidadCompraId: String(insumo.unidadMedida?.id || ""),
      factorConversion: 1,
      requiereConversion: false
    }));
    setCodigoBusquedaInsumo(insumo.codigoBarras || insumo.codigo || insumo.nombre || "");
    setMostrarAltaRapida(false);
  };

  const handleBusquedaInsumoKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const texto = codigoBusquedaInsumo.trim();
    if (!texto) return;

    const insumo = buscarInsumoPorTexto(texto);
    if (insumo) {
      seleccionarInsumo(insumo);
      setToastType("success");
      setToastMessage(`Insumo encontrado: ${insumo.nombre}`);
      return;
    }

    setNuevoInsumoRapido((prev) => ({
      ...prev,
      codigo: texto
    }));
    setMostrarAltaRapida(true);
    setToastType("warning");
    setToastMessage("No existe ese insumo. Puedes crearlo rápido aquí abajo.");
  };

  const cambiarInsumoRapido = (campo, valor) => {
    setNuevoInsumoRapido((prev) => ({
      ...prev,
      [campo]: campo === "stockMinimo" ? (parseFloat(valor) || 0) : valor
    }));

    if (erroresInsumoRapido[campo]) {
      setErroresInsumoRapido((prev) => {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
    }
  };

  const crearInsumoRapido = async () => {
    const errores = {};
    if (!nuevoInsumoRapido.codigo.trim()) errores.codigo = "El código es obligatorio";
    if (!nuevoInsumoRapido.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!nuevoInsumoRapido.unidadMedidaId) errores.unidadMedidaId = "Selecciona una unidad";

    if (Object.keys(errores).length > 0) {
      setErroresInsumoRapido(errores);
      setToastType("danger");
      setToastMessage("Completa los campos mínimos para crear el insumo");
      return;
    }

    try {
      setCreandoInsumoRapido(true);
      const creado = await crearInsumo({
        codigo: nuevoInsumoRapido.codigo.trim(),
        nombre: nuevoInsumoRapido.nombre.trim(),
        unidadMedidaId: Number(nuevoInsumoRapido.unidadMedidaId),
        stockMinimo: Number(nuevoInsumoRapido.stockMinimo || 0),
        stockActual: 0,
        descripcion: null,
        ubicacion: null,
        fila: null,
        columna: null
      });

      const unidad = unidadesMedida.find((um) => String(um.id) === String(nuevoInsumoRapido.unidadMedidaId));
      const insumoNormalizado = {
        ...creado,
        unidadMedida: creado.unidadMedida || unidad || null
      };

      setInsumos((prev) => [insumoNormalizado, ...prev]);
      seleccionarInsumo(insumoNormalizado);
      setNuevoInsumoRapido({
        codigo: "",
        nombre: "",
        unidadMedidaId: "",
        stockMinimo: 0
      });
      setErroresInsumoRapido({});
      setMostrarAltaRapida(false);
      setToastType("success");
      setToastMessage("Insumo creado y seleccionado para la compra");
    } catch (error) {
      if (error.errors) {
        setErroresInsumoRapido(error.errors);
      }
      setToastType("danger");
      setToastMessage(error.message || "Error al crear el insumo");
    } finally {
      setCreandoInsumoRapido(false);
    }
  };

  function agregarDetalle() {
    if (!nuevoDetalle.insumoId || !nuevoDetalle.unidadCompraId || !nuevoDetalle.cantidad || !nuevoDetalle.precioUnitario) {
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

    const factorConversion = nuevoDetalle.factorConversion;
    const cantidadEnUnidadConsumo = nuevoDetalle.cantidad * factorConversion;
    const costoPorUnidadConsumo = nuevoDetalle.precioUnitario / factorConversion;
    const subtotal = nuevoDetalle.cantidad * nuevoDetalle.precioUnitario;

    const nuevoDetalleCompleto = {
      id: Date.now(), // temporal
      insumoId: insumo.id,
      insumoNombre: insumo.nombre,
      cantidad: nuevoDetalle.cantidad,
      factorConversion,
      cantidadEnUnidadConsumo,
      unidadCompraId: unidad.id,
      unidadCompraSimbolo: unidad.simbolo,
      unidadConsumoId: insumo.unidadMedida?.id,
      unidadConsumoSimbolo: insumo.unidadMedida?.simbolo,
      precioUnitario: nuevoDetalle.precioUnitario,
      costoPorUnidadConsumo,
      subtotal,
      observaciones: ""
    };

    setDetalles([...detalles, nuevoDetalleCompleto]);
    setNuevoDetalle({
      insumoId: "",
      cantidad: 1,
      unidadCompraId: "",
      precioUnitario: 0,
      factorConversion: 1,
      requiereConversion: false,
      insumoSeleccionado: null
    });
  }

  function eliminarDetalle(id) {
    setDetalles(detalles.filter(d => d.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (detalles.length === 0) {
      alert("Agrega al menos un detalle a la compra");
      return;
    }

    const dataToSend = {
      ...formData,
      subtotal: subtotalCalculado,
      total: totalCalculado,
      detalles: detalles.map((detalle) => {
        const detallePayload = { ...detalle };
        delete detallePayload.id;
        delete detallePayload.insumoNombre;
        delete detallePayload.unidadCompraSimbolo;
        delete detallePayload.unidadConsumoSimbolo;
        delete detallePayload.insumoSeleccionado;
        return detallePayload;
      })
    };

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
    }
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

  if (soloLectura) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Esta compra no puede ser editada porque ya está {compra?.estado.toLowerCase()}.
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
                    <label className="form-label fw-semibold">Folio *</label>
                    <input 
                      type="text" 
                      name="folio" 
                      className={inputClass("folio")} 
                      value={formData.folio} 
                      onChange={handleChange} 
                      placeholder="Ej: COMP-001"
                    />
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
                    <label className="form-label fw-semibold">Fecha Recepción</label>
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
                    <select
                      name="proveedorId"
                      className={selectClass("proveedorId")}
                      value={formData.proveedorId}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona un proveedor...</option>
                      {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>
                          {prov.razonSocial} - {prov.rfc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Tipo Documento</label>
                    <select
                      name="tipoDocumento"
                      className={selectClass("tipoDocumento")}
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                    >
                      <option value="FACTURA">Factura</option>
                      <option value="REMISION">Remisión</option>
                      <option value="NOTA">Nota</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Número Documento</label>
                    <input 
                      type="text" 
                      name="numeroDocumento" 
                      className={inputClass("numeroDocumento")} 
                      value={formData.numeroDocumento} 
                      onChange={handleChange} 
                    />
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
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-list-ul me-2"></i>Detalles de Compra
                </h5>
              </div>
              <div className="card-body">
                {/* Lista de detalles */}
                <div className="table-responsive mb-3">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Insumo</th>
                        <th className="text-end">Cantidad</th>
                        <th>Unidad</th>
                        <th className="text-end">Precio Unit.</th>
                        <th>Factor</th>
                        <th className="text-end">Costo x UC</th>
                        <th className="text-end">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td>{detalle.insumoNombre}</td>
                          <td className="text-end">{detalle.cantidad.toFixed(2)}</td>
                          <td>{detalle.unidadCompraSimbolo}</td>
                          <td className="text-end">${detalle.precioUnitario.toFixed(2)}</td>
                          <td>{detalle.factorConversion.toFixed(2)}</td>
                          <td className="text-end text-info">${detalle.costoPorUnidadConsumo.toFixed(2)}</td>
                          <td className="text-end fw-bold">${detalle.subtotal.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => eliminarDetalle(detalle.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
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

                {/* Formulario para nuevo detalle */}
                <div className="row g-2 align-items-end bg-light p-3 rounded">
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Código o nombre del insumo</label>
                    <input
                      type="search"
                      className="form-control form-control-sm"
                      value={codigoBusquedaInsumo}
                      onChange={(e) => setCodigoBusquedaInsumo(e.target.value)}
                      onKeyDown={handleBusquedaInsumoKeyDown}
                      placeholder="Escribe, pega o escanea el código"
                    />
                    <small className="text-muted d-block mt-1">
                      Presiona Enter para buscar. Si no existe, lo creas aquí mismo.
                    </small>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold small">Insumo</label>
                    <select
                      className="form-select form-select-sm"
                      name="insumoId"
                      value={nuevoDetalle.insumoId}
                      onChange={handleDetalleChange}
                    >
                      <option value="">Seleccionar...</option>
                      {insumos.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nombre} {ins.codigoBarras ? `- ${ins.codigoBarras}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-1">
                    <label className="form-label fw-semibold small">Cant.</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control form-control-sm"
                      name="cantidad"
                      value={nuevoDetalle.cantidad}
                      onChange={handleDetalleChange}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold small">Unidad Compra</label>
                    <select
                      className="form-select form-select-sm"
                      name="unidadCompraId"
                      value={nuevoDetalle.unidadCompraId}
                      onChange={handleDetalleChange}
                      disabled={!nuevoDetalle.insumoId}
                    >
                      <option value="">Seleccionar...</option>
                      {unidadesMedida.map(um => (
                        <option key={um.id} value={um.id}>
                          {um.simbolo} - {um.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-1">
                    <label className="form-label fw-semibold small">Precio $</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm"
                      name="precioUnitario"
                      value={nuevoDetalle.precioUnitario}
                      onChange={handleDetalleChange}
                    />
                  </div>

                  {nuevoDetalle.requiereConversion && (
                    <div className="col-md-1">
                      <label className="form-label fw-semibold small">Factor</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-sm"
                        name="factorConversion"
                        value={nuevoDetalle.factorConversion}
                        onChange={handleDetalleChange}
                      />
                    </div>
                  )}

                  {nuevoDetalle.insumoSeleccionado && (
                    <div className="col-md-2">
                      <small className="text-muted d-block">
                        <strong>UC:</strong> {nuevoDetalle.insumoSeleccionado.unidadMedida?.simbolo || '?'}
                        {nuevoDetalle.requiereConversion && (
                          <span className="d-block text-warning">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Requiere conversión
                          </span>
                        )}
                      </small>
                    </div>
                  )}

                  <div className="col-md-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-success w-100"
                      onClick={agregarDetalle}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>

                {mostrarAltaRapida && (
                  <div className="border rounded p-3 mt-3 bg-white">
                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                      <div>
                        <div className="fw-semibold">Alta rápida de insumo</div>
                        <small className="text-muted">Crea el insumo sin salir de la compra.</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setMostrarAltaRapida(false);
                          setErroresInsumoRapido({});
                        }}
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small">Código *</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${erroresInsumoRapido.codigo ? "is-invalid" : ""}`}
                          value={nuevoInsumoRapido.codigo}
                          onChange={(e) => cambiarInsumoRapido("codigo", e.target.value)}
                        />
                        <div className="invalid-feedback">{erroresInsumoRapido.codigo}</div>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold small">Nombre *</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${erroresInsumoRapido.nombre ? "is-invalid" : ""}`}
                          value={nuevoInsumoRapido.nombre}
                          onChange={(e) => cambiarInsumoRapido("nombre", e.target.value)}
                          placeholder="Ej: Tornillo, tubo, tela..."
                        />
                        <div className="invalid-feedback">{erroresInsumoRapido.nombre}</div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold small">Unidad *</label>
                        <select
                          className={`form-select form-select-sm ${erroresInsumoRapido.unidadMedidaId ? "is-invalid" : ""}`}
                          value={nuevoInsumoRapido.unidadMedidaId}
                          onChange={(e) => cambiarInsumoRapido("unidadMedidaId", e.target.value)}
                        >
                          <option value="">Selecciona...</option>
                          {unidadesMedida.map((um) => (
                            <option key={um.id} value={um.id}>
                              {um.simbolo} - {um.nombre}
                            </option>
                          ))}
                        </select>
                        <div className="invalid-feedback">{erroresInsumoRapido.unidadMedidaId}</div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold small">Stock mínimo</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control form-control-sm"
                          value={nuevoInsumoRapido.stockMinimo}
                          onChange={(e) => cambiarInsumoRapido("stockMinimo", e.target.value)}
                        />
                      </div>
                      <div className="col-12 d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={crearInsumoRapido}
                          disabled={creandoInsumoRapido}
                        >
                          {creandoInsumoRapido ? "Creando..." : "Crear y usar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <small className="text-muted d-block mt-2">
                  <i className="bi bi-info-circle me-1"></i>
                  UC = Unidad de Consumo (unidad base del insumo)
                </small>
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
                      type="number"
                      step="0.01"
                      className="form-control bg-light"
                      value={subtotalCalculado.toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Impuesto</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="impuesto"
                      className={inputClass("impuesto")}
                      value={formData.impuesto}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Total</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control bg-light fw-bold text-primary"
                      value={totalCalculado.toFixed(2)}
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
                        Costo x UC: ${d.costoPorUnidadConsumo.toFixed(2)} / {d.unidadConsumoSimbolo}
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
          >
            {esEdicion ? 'Guardar Cambios' : 'Guardar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
}

