import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerInsumoPorId, crearInsumo, actualizarInsumo, eliminarInsumo } from "../services/insumos.js";
import { obtenerUnidadesMedida, crearUnidadMedida } from "../../unidades-medida/services/unidadMedidas.js";
import { getUser } from "../../auth/services/authService.js";
import Toast from "../../../components/ui/Toast.jsx";
import { Ean13BarcodeSvg } from "../components/barcode/Ean13Barcode.jsx";
import { obtenerBitsEan13 } from "../components/barcode/ean13Utils.js";
import { puedeGestionarCatalogoInsumos, puedeGestionarCostosInsumos } from "../utils/costosPermisos.js";
import "./InsumoForm.css";

export default function InsumoForm({ 
  insumoId,     // para la página
  insumo,       // para el modal
  onSave,       // para el modal
  onCancel,     // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [mostrarCrearUnidad, setMostrarCrearUnidad] = useState(false);
  const [creandoUnidad, setCreandoUnidad] = useState(false);
  const [nuevaUnidadRapida, setNuevaUnidadRapida] = useState({
    nombre: "",
    simbolo: "",
    tipo: ""
  });
  const [erroresUnidadRapida, setErroresUnidadRapida] = useState({});
  const barcodePreviewRef = useRef(null);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(insumoId) || Boolean(insumo);
  const usuarioActual = getUser();
  const puedeGestionarCostos = puedeGestionarCostosInsumos(usuarioActual);
  const puedeGestionarInsumos = puedeGestionarCatalogoInsumos(usuarioActual);

  const [formData, setFormData] = useState({
    codigoBarras: "",
    nombre: "",
    descripcion: "",
    ubicacion: "",
    fila: "",
    columna: "",
    unidadMedidaId: "",
    stockActual: 0,
    stockMinimo: 0,
    costoCotizacion: "",
    puedeEliminar: false,
    activo: true
  });

  // Cargar unidades de medida para el select
  useEffect(() => {
    const cargarUnidades = async () => {
      try {
        const data = await obtenerUnidadesMedida();
        if (data.content) {
          setUnidadesMedida(data.content);
        } else if (Array.isArray(data)) {
          setUnidadesMedida(data);
        }
      } catch (error) {
        console.error("Error cargando unidades de medida:", error);
      }
    };
    cargarUnidades();
  }, []);

  // Cargar datos del insumo si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && insumo) {
        setFormData({
          codigoBarras: insumo.codigoBarras || "",
          nombre: insumo.nombre || "",
          descripcion: insumo.descripcion || "",
          ubicacion: insumo.ubicacion || "",
          fila: insumo.fila || "",
          columna: insumo.columna || "",
          unidadMedidaId: insumo.unidadMedida?.id || "",
          stockActual: insumo.stockActual || 0,
          stockMinimo: insumo.stockMinimo || 0,
          costoCotizacion: insumo.costoCotizacion || "",
          puedeEliminar: insumo.puedeEliminar || false,
          activo: insumo.activo ?? true
        });
        return;
      }

      if (!esModal && insumoId) {
        try {
          const data = await obtenerInsumoPorId(insumoId);
          setFormData({
            codigoBarras: data.codigoBarras || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            ubicacion: data.ubicacion || "",
            fila: data.fila || "",
            columna: data.columna || "",
            unidadMedidaId: data.unidadMedida?.id || "",
            stockActual: data.stockActual || 0,
            stockMinimo: data.stockMinimo || 0,
            costoCotizacion: data.costoCotizacion || "",
            puedeEliminar: data.puedeEliminar || false,
            activo: data.activo ?? true
          });
        } catch (error) {
          console.error("Error cargando:", error);
        }
      }
    };
    cargar();
  }, [insumoId, insumo, esModal]);

  const limpiarNuevaUnidad = () => {
    setNuevaUnidadRapida({
      nombre: "",
      simbolo: "",
      tipo: ""
    });
    setErroresUnidadRapida({});
  };

  const handleNuevaUnidadChange = (field, value) => {
    setNuevaUnidadRapida((prev) => ({
      ...prev,
      [field]: value
    }));

    setErroresUnidadRapida((prev) => {
      const copia = { ...prev };
      delete copia[field];
      return copia;
    });
  };

  const guardarUnidadRapida = async () => {
    const errores = {};

    if (!nuevaUnidadRapida.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!nuevaUnidadRapida.simbolo.trim()) errores.simbolo = "El simbolo es obligatorio";

    if (Object.keys(errores).length > 0) {
      setErroresUnidadRapida(errores);
      return;
    }

    try {
      setCreandoUnidad(true);
      const creada = await crearUnidadMedida({
        nombre: nuevaUnidadRapida.nombre.trim(),
        simbolo: nuevaUnidadRapida.simbolo.trim(),
        tipo: nuevaUnidadRapida.tipo.trim() || null
      });

      setUnidadesMedida((prev) => [creada, ...prev]);
      setFormData((prev) => ({
        ...prev,
        unidadMedidaId: String(creada.id)
      }));
      limpiarNuevaUnidad();
      setMostrarCrearUnidad(false);
      setToastType("success");
      setToastMessage("Unidad de medida creada y seleccionada");
    } catch (error) {
      setErroresUnidadRapida(error.errors || {});
      setToastType("danger");
      setToastMessage(error.message || "Error al crear la unidad de medida");
    } finally {
      setCreandoUnidad(false);
    }
  };

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

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setErroresBackend({});

      if (!puedeGestionarInsumos) {
        setToastType("danger");
        setToastMessage("No tienes permisos para guardar insumos");
        return;
      }

      let respuesta;
      const payload = { ...formData };
      if (!puedeGestionarCostos) {
        delete payload.costoCotizacion;
      } else if (payload.costoCotizacion === "") {
        payload.costoCotizacion = null;
      }

      if (esEdicion) {
        const id = insumo?.id || insumoId;
        respuesta = await actualizarInsumo(id, payload);
      } else {
        respuesta = await crearInsumo(payload);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Insumo actualizado con éxito!" : "¡Insumo registrado con éxito!");
        setFormData((prev) => ({
          ...prev,
          codigoBarras: respuesta?.codigoBarras || prev.codigoBarras
        }));
        setTimeout(() => navigate(esEdicion ? "/insumos" : `/insumos/${respuesta.id}`), 1500);
      }

    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        if (esModal) {
          console.error("Error en modal:", error);
        } else {
          setToastType("danger");
          setToastMessage(error.message || "Error al guardar los datos");
        }
      }
    }
  }

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/insumos");
    }
  };

  const handleEliminarDefinitivo = async () => {
    if (!esEdicion || !puedeGestionarInsumos || !formData.puedeEliminar) return;

    const confirmacion = window.confirm("Seguro que deseas eliminar definitivamente este insumo?");
    if (!confirmacion) return;

    try {
      await eliminarInsumo(insumo?.id || insumoId);
      setToastType("success");
      setToastMessage("Insumo eliminado definitivamente");
      window.setTimeout(() => navigate("/insumos"), 900);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar el insumo");
    }
  };

  const imprimirEtiqueta = () => {
    const bits = obtenerBitsEan13(formData.codigoBarras);
    if (!bits) return;

    const moduleWidth = 2.4;
    const barcodeWidth = 95 * moduleWidth;
    const barcodeHeight = 78;
    const rects = bits
      .split("")
      .map((bit, index) =>
        bit === "1"
          ? `<rect x="${index * moduleWidth}" y="0" width="${moduleWidth}" height="${barcodeHeight}" fill="#111827"></rect>`
          : ""
      )
      .join("");

    const ventana = window.open("", "_blank", "width=420,height=360");
    if (!ventana) return;

    ventana.document.write(`
      <!doctype html>
          <html>
        <head>
          <title>Etiqueta ${formData.codigoBarras}</title>
          <style>
            @page { size: 76mm 38mm; margin: 0; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
            .label { width: 76mm; min-height: 38mm; box-sizing: border-box; padding: 4mm 5mm; text-align: center; }
            .name { font-size: 12px; font-weight: 700; margin-bottom: 2mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .code { font-family: monospace; font-size: 11px; letter-spacing: 1.4px; margin-top: 1mm; }
            svg { width: 100%; height: 20mm; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${formData.nombre || "Insumo"}</div>
            <svg viewBox="0 0 ${barcodeWidth} ${barcodeHeight}" role="img">
              <rect width="${barcodeWidth}" height="${barcodeHeight}" fill="#ffffff"></rect>
              ${rects}
            </svg>
            <div class="code">${formData.codigoBarras}</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const descargarEtiquetaPng = async () => {
    const svg = barcodePreviewRef.current?.querySelector("svg");
    if (!svg) return;

    const width = Number(svg.getAttribute("width")) || 280;
    const height = Number(svg.getAttribute("height")) || 110;
    const scale = 2;

    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));

    const svgText = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = svgUrl;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.scale(scale, scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const pngBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });

      if (!pngBlob) return;

      const pngUrl = URL.createObjectURL(pngBlob);
      const nombreArchivo = (formData.nombre || "insumo")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${nombreArchivo}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(pngUrl);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const formShellClass = `insumo-form-shell ${esModal ? "" : "container py-4"}`;

  return (
    <div className={formShellClass}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}

      {!puedeGestionarInsumos && (
        <div className="alert alert-info">
          Puedes consultar el insumo, pero solo Almacen, Dev/Admin y Subdireccion administrativa pueden crear, editar o eliminar.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4 insumo-form-card">
          <div className="card-body">
            <fieldset className="border-0 p-0 m-0" disabled={!puedeGestionarInsumos}>
            <div className="insumo-section-card insumo-section-card--base mb-3">
              <div className="insumo-section-head">
                <div>
                  <div className="insumo-section-kicker">Datos generales</div>
                  <h6 className="mb-0">Identificación y descripción</h6>
                </div>
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="row g-3">
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">
                    Nombre del Insumo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    className={inputClass("nombre")}
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Tornillos, Tubo, Tela..."
                  />
                  <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
                </div>

                <div className="col-lg-6">
                  <label className="form-label fw-semibold">
                    Unidad de Medida <span className="text-danger">*</span>
                  </label>
                  <div className="insumo-unidad-select-group">
                    <select
                      name="unidadMedidaId"
                      className={`${selectClass("unidadMedidaId")} insumo-unidad-select`}
                      value={formData.unidadMedidaId}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona una unidad...</option>
                      {unidadesMedida.map((um) => (
                        <option key={um.id} value={um.id}>
                          {um.nombre} ({um.simbolo})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary insumo-unidad-add-btn"
                      onClick={() => setMostrarCrearUnidad((prev) => !prev)}
                      aria-label="Crear nueva unidad de medida"
                      title="Crear nueva unidad de medida"
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                  <div className="invalid-feedback">{erroresBackend.unidadMedidaId || erroresExternos.unidadMedidaId}</div>
                  {mostrarCrearUnidad && (
                    <div className="insumo-unidad-quick-create mt-3">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <div className="fw-bold text-secondary">
                          <i className="bi bi-rulers me-2"></i>
                          Nueva unidad de medida
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            limpiarNuevaUnidad();
                            setMostrarCrearUnidad(false);
                          }}
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="row g-2">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">Nombre *</label>
                          <input
                            className={`form-control ${erroresUnidadRapida.nombre ? "is-invalid" : ""}`}
                            value={nuevaUnidadRapida.nombre}
                            onChange={(e) => handleNuevaUnidadChange("nombre", e.target.value)}
                            placeholder="Kilogramo"
                          />
                          <div className="invalid-feedback">{erroresUnidadRapida.nombre}</div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Simbolo *</label>
                          <input
                            className={`form-control ${erroresUnidadRapida.simbolo ? "is-invalid" : ""}`}
                            value={nuevaUnidadRapida.simbolo}
                            onChange={(e) => handleNuevaUnidadChange("simbolo", e.target.value)}
                            placeholder="kg"
                          />
                          <div className="invalid-feedback">{erroresUnidadRapida.simbolo}</div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Tipo</label>
                          <input
                            className="form-control"
                            value={nuevaUnidadRapida.tipo}
                            onChange={(e) => handleNuevaUnidadChange("tipo", e.target.value)}
                            placeholder="Peso, pieza..."
                          />
                        </div>
                        <div className="col-12 d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={limpiarNuevaUnidad}
                          >
                            Limpiar
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={guardarUnidadRapida}
                            disabled={creandoUnidad}
                          >
                            {creandoUnidad ? "Creando..." : "Crear unidad"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    name="descripcion"
                    className={inputClass("descripcion")}
                    value={formData.descripcion || ""}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Descripción detallada del insumo..."
                  />
                  <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                </div>
              </div>
            </div>

            <div className="insumo-section-card insumo-section-card--location mb-3">
              <div className="insumo-section-head">
                <div>
                  <div className="insumo-section-kicker">Ubicación</div>
                  <h6 className="mb-0">Dónde se guarda el insumo</h6>
                </div>
                <i className="bi bi-geo-alt"></i>
              </div>
              <div className="row g-3">
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    className={inputClass("ubicacion")}
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Ej: Almacén A, Estante 3..."
                  />
                </div>

                <div className="col-md-3 col-lg-3">
                  <label className="form-label fw-semibold">Fila</label>
                  <input
                    type="text"
                    name="fila"
                    className={inputClass("fila")}
                    value={formData.fila}
                    onChange={handleChange}
                    placeholder="A01"
                  />
                </div>

                <div className="col-md-3 col-lg-3">
                  <label className="form-label fw-semibold">Columna</label>
                  <input
                    type="text"
                    name="columna"
                    className={inputClass("columna")}
                    value={formData.columna}
                    onChange={handleChange}
                    placeholder="B02"
                  />
                </div>
              </div>
            </div>

            <div className="insumo-section-card insumo-section-card--inventory">
              <div className="insumo-section-head">
                <div>
                  <div className="insumo-section-kicker">Inventario</div>
                  <h6 className="mb-0">Stock y estado</h6>
                </div>
                <i className="bi bi-archive"></i>
              </div>
              <div className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Stock Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="stockActual"
                    className={inputClass("stockActual")}
                    value={formData.stockActual}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="stockMinimo"
                    className={inputClass("stockMinimo")}
                    value={formData.stockMinimo}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Costo de cotizacion</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="costoCotizacion"
                    className={inputClass("costoCotizacion")}
                    value={formData.costoCotizacion}
                    onChange={handleChange}
                    disabled={!puedeGestionarCostos}
                  />
                  <div className="invalid-feedback">{erroresBackend.costoCotizacion || erroresExternos.costoCotizacion}</div>
                  {!puedeGestionarCostos && (
                    <small className="text-muted d-block mt-1">
                      Solo Dev/Admin y Subdireccion administrativa pueden modificar este costo.
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <div className="insumo-active-strip">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        id="activoSwitch"
                        style={{ width: "40px", height: "20px", cursor: "pointer" }}
                      />
                    </div>
                    <div className="ms-3">
                      <label className="form-check-label fw-semibold d-block" htmlFor="activoSwitch" style={{ cursor: "pointer" }}>
                        Insumo {formData.activo ? "Activo" : "Inactivo"}
                      </label>
                      <small className="text-muted">
                        {formData.activo
                          ? "El insumo está habilitado para su uso"
                          : "El insumo está deshabilitado"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </fieldset>
          </div>
        </div>

        {formData.codigoBarras && (
          <div className="card insumo-barcode-card mb-4">
            <div className="card-header insumo-barcode-header py-3 d-flex align-items-center justify-content-between">
              <h5 className="mb-0 text-secondary">
                <i className="bi bi-upc-scan me-2"></i>Codigo de barras
              </h5>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={descargarEtiquetaPng}>
                  <i className="bi bi-download me-1"></i>
                  Descargar PNG
                </button>
                <button type="button" className="btn btn-outline-success btn-sm" onClick={imprimirEtiqueta}>
                  <i className="bi bi-printer me-1"></i>
                  Imprimir etiqueta
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-5">
                  <div className="insumo-barcode-preview" ref={barcodePreviewRef}>
                    <Ean13BarcodeSvg
                      value={formData.codigoBarras}
                      title={formData.nombre || "Insumo"}
                    />
                    <div className="insumo-barcode-number">{formData.codigoBarras}</div>
                  </div>
                </div>
                <div className="col-md-7">
                  <label className="form-label fw-semibold">Numero de codigo de barras</label>
                  <input
                    type="text"
                    className="form-control border-soft"
                    value={formData.codigoBarras}
                    readOnly
                  />
                  <small className="text-muted d-block mt-2">
                    Se genera automaticamente al crear el insumo y queda listo para imprimir etiquetas.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="insumo-form-actions d-flex justify-content-end align-items-center">
          <div className="gap-2 d-flex flex-wrap justify-content-end">
            {esEdicion && puedeGestionarInsumos && formData.puedeEliminar && (
              <button
                type="button"
                className="btn btn-outline-danger px-4"
                onClick={handleEliminarDefinitivo}
              >
                <i className="bi bi-trash me-1"></i>
                Eliminar
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-light px-4" 
              onClick={handleCancel}
            >
              Cancelar
            </button>
            {puedeGestionarInsumos && (
              <button
                type="submit"
                className="btn btn-primary px-5 fw-bold"
              >
                {esEdicion ? 'Guardar Cambios' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

