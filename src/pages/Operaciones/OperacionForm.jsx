import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerOperacionPorId, crearOperacion, actualizarOperacion } from "../../services/operaciones.js";
import { obtenerCentrosTrabajoActivos } from "../../services/centrosTrabajo.js";
import Toast from "../../components/ui/Toast.jsx";

export default function OperacionForm({ 
  operacionId,   // para la página
  operacion,     // para el modal
  onSave,        // para el modal
  onCancel,      // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [centrosTrabajo, setCentrosTrabajo] = useState([]);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(operacionId) || Boolean(operacion);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    centroTrabajoId: "",
    costoMinuto: "",
    costoHora: "",
    tiempoOperacion: "",
    activo: true
  });

  // Cargar centros de trabajo para el select
  useEffect(() => {
    const cargarCentros = async () => {
      try {
        const data = await obtenerCentrosTrabajoActivos();
        if (data.content) {
          setCentrosTrabajo(data.content);
        } else if (Array.isArray(data)) {
          setCentrosTrabajo(data);
        }
      } catch (e) {
        console.error("Error cargando centros de trabajo:", e);
      }
    };
    cargarCentros();
  }, []);

  // Cargar datos de la operación si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && operacion) {
        setFormData({
          codigo: operacion.codigo || "",
          nombre: operacion.nombre || "",
          descripcion: operacion.descripcion || "",
          centroTrabajoId: operacion.centroTrabajoId || "",
          costoMinuto: operacion.costoMinuto || "",
          costoHora: operacion.costoHora || "",
          tiempoOperacion: data.tiempoOperacion || "", 
          activo: operacion.activo ?? true
        });
        return;
      }

      if (!esModal && operacionId) {
        try {
          const data = await obtenerOperacionPorId(operacionId);
          setFormData({
            codigo: data.codigo || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            centroTrabajoId: data.centroTrabajoId || "",
            costoMinuto: data.costoMinuto || "",
            costoHora: data.costoHora || "",
            tiempoOperacion: data.tiempoOperacion || "",
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [operacionId, operacion, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              (type === "number" ? (value === "" ? "" : parseFloat(value)) : value)
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

    // Convertir valores vacíos a null para números
    const dataToSend = {
      ...formData,
      costoMinuto: formData.costoMinuto === "" ? null : formData.costoMinuto,
      costoHora: formData.costoHora === "" ? null : formData.costoHora,
      tiempoMinutos: formData.tiempoOperacion === "" ? null : formData.tiempoOperacion 
    };

    try {
      setErroresBackend({});

      let respuesta;
      if (esEdicion) {
        const id = operacion?.id || operacionId;
        respuesta = await actualizarOperacion(id, dataToSend);
      } else {
        respuesta = await crearOperacion(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Operación actualizada con éxito!" : "¡Operación registrada con éxito!");
        setTimeout(() => navigate("/operaciones"), 1500);
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
      navigate("/operaciones");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Operación' : 'Nueva Operación'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-tools me-2"></i>Información de la Operación
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Código <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="codigo" 
                  className={inputClass("codigo")} 
                  value={formData.codigo} 
                  onChange={handleChange} 
                  placeholder="Ej: CORT-01, ENS-02, PINT-01..."
                />
                <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
              </div>

              <div className="col-md-8">
                <label className="form-label fw-semibold">
                  Nombre <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  className={inputClass("nombre")} 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej: Corte de lámina, Ensamble manual, Pintura..."
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Centro de Trabajo <span className="text-danger">*</span>
                </label>
                <select
                  name="centroTrabajoId"
                  className={selectClass("centroTrabajoId")}
                  value={formData.centroTrabajoId}
                  onChange={handleChange}
                >
                  <option value="">Selecciona un centro...</option>
                  {centrosTrabajo.map(centro => (
                    <option key={centro.id} value={centro.id}>
                      {centro.codigo} - {centro.nombre}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">{erroresBackend.centroTrabajoId || erroresExternos.centroTrabajoId}</div>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Costo por Minuto</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    name="costoMinuto" 
                    className={inputClass("costoMinuto")} 
                    value={formData.costoMinuto} 
                    onChange={handleChange} 
                    placeholder="0.00"
                  />
                </div>
              </div>

             <div className="col-md-3">
  <label className="form-label fw-semibold">Costo por Hora</label>
  <div className="input-group">
    <span className="input-group-text">$</span>
    <input 
      type="number" 
      name="costoHora" 
      className="form-control bg-light"
      value={formData.costoHora} 
      readOnly
      tabIndex={-1}
    />
  </div>
  <small className="text-muted">Calculado automáticamente</small>
</div>
             
             {/* ✅ NUEVO CAMPO */}
          <div className="col-md-2">
            <label>Tiempo (min)</label>
            <input 
              type="number"
              name="tiempoOperacion"
              value={formData.tiempoOperacion}
              onChange={handleChange}
            />
          </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripción</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Descripción detallada de la operación..."
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
              </div>

              <div className="col-md-12">
                <div className="border-top pt-3 mt-2">
                  <div className="d-flex align-items-center">
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
                        Operación {formData.activo ? 'Activa' : 'Inactiva'}
                      </label>
                      <small className="text-muted">
                        {formData.activo 
                          ? 'La operación está habilitada para su uso' 
                          : 'La operación está deshabilitada'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
          {esModal && (
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                name="activo" 
                checked={formData.activo} 
                onChange={handleChange} 
                id="switchActivoModal" 
              />
              <label className="form-check-label fw-semibold" htmlFor="switchActivoModal">
                Operación {formData.activo ? 'Activa' : 'Inactiva'}
              </label>
            </div>
          )}
          
          <div className={`gap-2 d-flex ${esModal ? 'ms-auto' : ''}`}>
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
              {esEdicion ? 'Guardar Cambios' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}