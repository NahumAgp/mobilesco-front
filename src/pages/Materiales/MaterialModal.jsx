import { useState } from "react";
import { crearMaterial, actualizarMaterial } from "../../services/materiales.js";
import Toast from "../../components/ui/Toast.jsx";

export default function MaterialModal({
  show,
  material,
  onClose,
  onSave,
  errores: erroresExternos = {}
}) {

  const [erroresBackend, setErroresBackend] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const esEdicion = Boolean(material);

  const [formData, setFormData] = useState({
    nombre: material?.nombre || "",
    descripcion: material?.descripcion || "",
    unidadMedida: material?.unidadMedida || "",
    activo: material?.activo ?? true
  });

  if (!show) return null;

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
        respuesta = await actualizarMaterial(material.id, formData);
      } else {
        respuesta = await crearMaterial(formData);
      }

      setToastType("success");
      setToastMessage(esEdicion ? "Material actualizado" : "Material creado");
      
      setTimeout(() => {
        onSave(respuesta);
      }, 1000);

    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar");
      }
    }
  }

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {esEdicion ? "Editar Material" : "Nuevo Material"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nombre *</label>
                    <input 
                      type="text" 
                      name="nombre" 
                      className={inputClass("nombre")} 
                      value={formData.nombre} 
                      onChange={handleChange} 
                    />
                    <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Unidad Medida</label>
                    <input 
                      type="text" 
                      name="unidadMedida" 
                      className={inputClass("unidadMedida")} 
                      value={formData.unidadMedida} 
                      onChange={handleChange} 
                    />
                    <div className="invalid-feedback">{erroresBackend.unidadMedida || erroresExternos.unidadMedida}</div>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Descripción</label>
                    <textarea
                      name="descripcion"
                      className={inputClass("descripcion")}
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                    />
                    <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                  </div>

                  <div className="col-md-12">
                    <div className="border-top pt-3">
                      <div className="d-flex align-items-center">
                        <div className="form-check form-switch mb-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="activo" 
                            checked={formData.activo} 
                            onChange={handleChange} 
                            id="activoModalSwitch" 
                          />
                        </div>
                        <div className="ms-3">
                          <label className="form-check-label fw-semibold" htmlFor="activoModalSwitch">
                            Material {formData.activo ? 'Activo' : 'Inactivo'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-light" onClick={onClose}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {esEdicion ? 'Guardar Cambios' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}