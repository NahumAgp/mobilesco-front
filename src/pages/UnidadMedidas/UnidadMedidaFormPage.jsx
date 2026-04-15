import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  obtenerUnidadesMedida,
  crearUnidadMedida,
  obtenerUnidadMedidaPorId,
  actualizarUnidadMedida 
} from "../../services/unidadMedidas.js";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function UnidadMedidaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nombre: "",
    simbolo: "",
    tipo: "",
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    if (isEditing) {
      cargarUnidadMedida();
    }
  }, [id]);

  const cargarUnidadMedida = async () => {
    try {
      setLoading(true);
      const data = await obtenerUnidadMedidaPorId(id);
      setFormData({
        nombre: data.nombre || "",
        simbolo: data.simbolo || "",
        tipo: data.tipo || "",
        activo: data.activo !== undefined ? data.activo : true
      });
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al cargar la unidad de medida");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre?.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.simbolo?.trim()) {  // ← Cambiado de abreviatura a simbolo
      newErrors.simbolo = "La abreviatura es requerida";  // ← Cambiado
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const validationErrors = validate();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  // ✅ LIMPIAR DATOS ANTES DE ENVIAR
  const datosLimpios = {
    nombre: formData.nombre?.trim(),
    simbolo: formData.simbolo?.trim(),
    tipo: formData.tipo?.trim(),  // El trim() elimina espacios y saltos de línea
    activo: formData.activo ? 1 : 0  // Si el backend espera 1/0
  };

  console.log("📤 Datos originales:", formData);
  console.log("📤 Datos limpios:", datosLimpios);
  console.log("📤 JSON stringified:", JSON.stringify(datosLimpios, null, 2));

  try {
    setSaving(true);
    
    if (isEditing) {
      await actualizarUnidadMedida(id, datosLimpios);
      setToastType("success");
      setToastMessage("Unidad de medida actualizada correctamente");
    } else {
      await crearUnidadMedida(datosLimpios);
      setToastType("success");
      setToastMessage("Unidad de medida creada correctamente");
    }

    setTimeout(() => {
      navigate("/unidades-medida");
    }, 1500);

  } catch (error) {
    console.error("❌ Error completo:", error);
    setToastType("danger");
    setToastMessage(`Error al ${isEditing ? 'actualizar' : 'crear'} la unidad de medida`);
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">
          Cargando unidad de medida...
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title={isEditing ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
        subtitle={isEditing ? "Modifica los datos de la unidad" : "Registra una nueva unidad de medida"}
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/unidades-medida")}
          >
            Volver al listado
          </button>
        }
      />

      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Kilogramo"
                  />
                  {errors.nombre && (
                    <div className="invalid-feedback">{errors.nombre}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="simbolo" className="form-label">  {/* ← Cambiado id */}
                    Abreviatura *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.simbolo ? 'is-invalid' : ''}`}
                    id="simbolo"           // ← Cambiado
                    name="simbolo"          // ← Cambiado
                    value={formData.simbolo}
                    onChange={handleChange}
                    placeholder="Ej: kg"
                    maxLength="10"
                  />
                  {errors.simbolo && (       // ← Cambiado
                    <div className="invalid-feedback">{errors.simbolo}</div>
                  )}
                </div>

                <div className="col-12 mb-3">
                  <label htmlFor="tipo" className="form-label">  {/* ← Cambiado id */}
                    Tipo
                  </label>
                  <textarea
                    className="form-control"
                    id="tipo"                // ← Cambiado
                    name="tipo"               // ← Cambiado
                    rows="3"
                    value={formData.tipo}
                    onChange={handleChange}
                    placeholder="Descripción opcional de la unidad de medida"
                  />
                </div>

                <div className="col-12 mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="activo"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="activo">
                      Activo
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/unidades-medida")}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}