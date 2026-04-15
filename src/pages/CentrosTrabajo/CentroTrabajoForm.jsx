import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCentroTrabajoPorId, crearCentroTrabajo, actualizarCentroTrabajo } from "../../services/centrosTrabajo.js";
import Toast from "../../components/ui/Toast.jsx";

export default function CentroTrabajoForm({ 
  centroId,     // para la página
  centro,       // para el modal
  onSave,       // para el modal
  onCancel,     // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(centroId) || Boolean(centro);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    costoHora: "",
    capacidadDiaria: "",
    unidadCapacidad: "",
    horasDisponiblesDia: "",
    activo: true
  });

  // Cargar datos del centro si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && centro) {
        setFormData({
          codigo: centro.codigo || "",
          nombre: centro.nombre || "",
          descripcion: centro.descripcion || "",
          costoHora: centro.costoHora || "",
          capacidadDiaria: centro.capacidadDiaria || "",
          unidadCapacidad: centro.unidadCapacidad || "",
          horasDisponiblesDia: centro.horasDisponiblesDia || "",
          activo: centro.activo ?? true
        });
        return;
      }

      if (!esModal && centroId) {
        try {
          const data = await obtenerCentroTrabajoPorId(centroId);
          setFormData({
            codigo: data.codigo || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            costoHora: data.costoHora || "",
            capacidadDiaria: data.capacidadDiaria || "",
            unidadCapacidad: data.unidadCapacidad || "",
            horasDisponiblesDia: data.horasDisponiblesDia || "",
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [centroId, centro, esModal]);

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
      costoHora: formData.costoHora === "" ? null : formData.costoHora,
      capacidadDiaria: formData.capacidadDiaria === "" ? null : formData.capacidadDiaria,
      horasDisponiblesDia: formData.horasDisponiblesDia === "" ? null : formData.horasDisponiblesDia
    };

    try {
      setErroresBackend({});

      let respuesta;
      if (esEdicion) {
        const id = centro?.id || centroId;
        respuesta = await actualizarCentroTrabajo(id, dataToSend);
      } else {
        respuesta = await crearCentroTrabajo(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Centro de trabajo actualizado con éxito!" : "¡Centro de trabajo registrado con éxito!");
        setTimeout(() => navigate("/centros-trabajo"), 1500);
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

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/centros-trabajo");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Centro de Trabajo' : 'Nuevo Centro de Trabajo'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-gear-wide-connected me-2"></i>Información del Centro de Trabajo
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
                  placeholder="Ej: CNC-01, ENS-02, CORTE-01..."
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
                  placeholder="Ej: Torno CNC, Mesa de Ensamble, Cortadora Láser..."
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripción</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Descripción detallada del centro de trabajo..."
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Costo por Hora</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    name="costoHora" 
                    className={inputClass("costoHora")} 
                    value={formData.costoHora} 
                    onChange={handleChange} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Capacidad Diaria</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="capacidadDiaria" 
                  className={inputClass("capacidadDiaria")} 
                  value={formData.capacidadDiaria} 
                  onChange={handleChange} 
                  placeholder="0"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Unidad de Capacidad</label>
                <input 
                  type="text" 
                  name="unidadCapacidad" 
                  className={inputClass("unidadCapacidad")} 
                  value={formData.unidadCapacidad || ""} 
                  onChange={handleChange} 
                  placeholder="Ej: Piezas, Kg, Metros..."
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Horas Disponibles/Día</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0"
                  max="24"
                  name="horasDisponiblesDia" 
                  className={inputClass("horasDisponiblesDia")} 
                  value={formData.horasDisponiblesDia} 
                  onChange={handleChange} 
                  placeholder="8"
                />
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
                        Centro {formData.activo ? 'Activo' : 'Inactivo'}
                      </label>
                      <small className="text-muted">
                        {formData.activo 
                          ? 'El centro de trabajo está habilitado para su uso' 
                          : 'El centro de trabajo está deshabilitado'}
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
                Centro {formData.activo ? 'Activo' : 'Inactivo'}
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