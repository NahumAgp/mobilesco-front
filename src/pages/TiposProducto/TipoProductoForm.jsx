// pages/TiposProducto/components/TipoProductoForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerTipoProductoPorId, crearTipoProducto, actualizarTipoProducto } from "../../services/tiposProducto.js";
import { obtenerFamilias } from "../../services/familias.js";
import Toast from "../../components/ui/Toast.jsx";

export default function TipoProductoForm({ 
  tipoId,        // para la página
  tipo,          // para el modal
  onSave,        // para el modal
  onCancel,      // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [familias, setFamilias] = useState([]);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(tipoId) || Boolean(tipo);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    familiaId: "",
    activo: true
  });

  // Cargar familias para el select
  useEffect(() => {
    const cargarFamilias = async () => {
      try {
        const data = await obtenerFamilias();
        if (data.content) {
          setFamilias(data.content);
        } else if (Array.isArray(data)) {
          setFamilias(data);
        }
      } catch (e) {
        console.error("Error cargando familias:", e);
      }
    };
    cargarFamilias();
  }, []);

  // Cargar datos del tipo si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && tipo) {
        setFormData({
          nombre: tipo.nombre || "",
          descripcion: tipo.descripcion || "",
          familiaNombre: tipo.familiaNombre || "",
          activo: tipo.activo ?? true
        });
        return;
      }

      if (!esModal && tipoId) {
        try {
          const data = await obtenerTipoProductoPorId(tipoId);
          setFormData({
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            familiaId: data.familiaId || "",
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [tipoId, tipo, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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

      let respuesta;
      if (esEdicion) {
        const id = tipo?.id || tipoId;
        respuesta = await actualizarTipoProducto(id, formData);
      } else {
        respuesta = await crearTipoProducto(formData);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Tipo de producto actualizado con éxito!" : "¡Tipo de producto registrado con éxito!");
        setTimeout(() => navigate("/tipos-producto"), 1500);
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
      navigate("/tipos-producto");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-tag me-2"></i>Información del Tipo de Producto
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Nombre del Tipo <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  className={inputClass("nombre")} 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej: Silla, Con Paleta, Plegable..."
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Familia <span className="text-danger">*</span>
                </label>
                <select
                  name="familiaId"
                  className={selectClass("familiaId")}
                  value={formData.familiaId}
                  onChange={handleChange}
                >
                  <option value="">Selecciona una familia...</option>
                  {familias.map(familia => (
                    <option key={familia.id} value={familia.id}>
                      {familia.nombre}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">{erroresBackend.familiaId || erroresExternos.familiaId}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripción</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Descripción detallada del tipo de producto..."
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                <div className="form-text text-muted">
                  Máximo 500 caracteres
                </div>
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
                        Tipo {formData.activo ? 'Activo' : 'Inactivo'}
                      </label>
                      <small className="text-muted">
                        {formData.activo 
                          ? 'El tipo de producto está habilitado y disponible' 
                          : 'El tipo de producto está deshabilitado'}
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
                Tipo {formData.activo ? 'Activo' : 'Inactivo'}
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