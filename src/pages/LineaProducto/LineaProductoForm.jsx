import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerLineaProductoPorId, crearLineaProducto, actualizarLineaProducto } from "../../services/lineaProducto.js";
import Toast from "../../components/ui/Toast.jsx";

export default function LineaProductoForm({ 
  lineaProductoId,     // para la página
  lineaProducto,       // para el modal
  onSave,              // para el modal
  onCancel,            // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  
  const navigate = useNavigate();
  
  // Determinamos si estamos en modal o en página
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(lineaProductoId) || Boolean(lineaProducto);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    const cargar = async () => {
      // Si estamos en modal y tenemos lineaProducto
      if (esModal && lineaProducto) {
        setFormData({ ...lineaProducto });
        return;
      }

      // Si estamos en página y tenemos lineaProductoId
      if (!esModal && lineaProductoId) {
        try {
          const data = await obtenerLineaProductoPorId(lineaProductoId);
          setFormData({ ...data });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [lineaProductoId, lineaProducto, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    // Actualizar el formulario
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // 🔥 Si ese campo tenía error, lo eliminamos al escribir
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
        const id = lineaProducto?.id || lineaProductoId;
        respuesta = await actualizarLineaProducto(id, formData);
      } else {
        respuesta = await crearLineaProducto(formData);
      }

      // Si estamos en modal
      if (esModal) {
        onSave(respuesta);
      } else {
        // Si estamos en página
        setToastType("success");
        setToastMessage(esEdicion ? "¡Línea de producto actualizada con éxito!" : "¡Línea de producto registrada con éxito!");
        setTimeout(() => navigate("/lineas-producto"), 1500);
      }

    } catch (error) {

      console.log("ERROR COMPLETO:", error);

      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        if (esModal) {
          // En modal, manejamos el error diferente
          console.error("Error en modal:", error);
        } else {
          setToastType("danger");
          setToastMessage(error.message || "Error al guardar los datos");
        }
      }
    }
  }

  // Helper para clases de error (combina errores del backend y externos)
  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  // Función para manejar cancelar
  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/lineas-producto");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Línea de Producto' : 'Nueva Línea de Producto'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary"><i className="bi bi-tag me-2"></i>Información de la Línea</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label fw-semibold">
                  Nombre de la Línea <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  className={inputClass("nombre")} 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej: ISO, STACK..."
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
                  placeholder="Descripción detallada de la línea de producto..."
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                <div className="form-text text-muted">
                  Máximo 500 caracteres
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: ESTADO (solo visible si no es modal o si queremos mostrarlo siempre) */}
        {!esModal && (
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                name="activo" 
                checked={formData.activo} 
                onChange={handleChange} 
                id="switchActivo" 
              />
              <label className="form-check-label fw-semibold" htmlFor="switchActivo">
                Línea de producto habilitada
              </label>
            </div>
          </div>
        )}

        {/* BOTONES */}
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
                Línea habilitada
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