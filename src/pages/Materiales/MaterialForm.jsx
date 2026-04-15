// pages/Materiales/components/MaterialForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerMaterialPorId, crearMaterial, actualizarMaterial } from "../../services/materiales.js";
import Toast from "../../components/ui/Toast.jsx";

export default function MaterialForm({ 
  materialId,     // para la página
  material,       // para el modal
  onSave,         // para el modal
  onCancel,       // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(materialId) || Boolean(material);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    unidadMedida: "",
    activo: true
  });

  useEffect(() => {
    const cargar = async () => {
      if (esModal && material) {
        setFormData({ ...material });
        return;
      }

      if (!esModal && materialId) {
        try {
          const data = await obtenerMaterialPorId(materialId);
          setFormData({ ...data });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [materialId, material, esModal]);

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
        const id = material?.id || materialId;
        respuesta = await actualizarMaterial(id, formData);
      } else {
        respuesta = await crearMaterial(formData);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Material actualizado con éxito!" : "¡Material registrado con éxito!");
        setTimeout(() => navigate("/materiales"), 1500);
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
      navigate("/materiales");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Material' : 'Nuevo Material'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-box-seam me-2"></i>Información del Material
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Nombre del Material <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  className={inputClass("nombre")} 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej: Acero Inoxidable, PVC, Madera..."
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
                  rows="4"
                  placeholder="Descripción detallada del material..."
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
                        Material {formData.activo ? 'Activo' : 'Inactivo'}
                      </label>
                      <small className="text-muted">
                        {formData.activo 
                          ? 'El material está habilitado y disponible para su uso' 
                          : 'El material está deshabilitado y no estará disponible'}
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
                Material {formData.activo ? 'Activo' : 'Inactivo'}
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