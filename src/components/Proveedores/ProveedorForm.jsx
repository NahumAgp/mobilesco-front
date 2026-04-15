import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerProveedorPorId, crearProveedor, actualizarProveedor, obtenerTiposInsumo } from "../../services/proveedores.js";
import Toast from "../ui/Toast.jsx";

export default function ProveedorForm({ proveedorId }) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  
  const navigate = useNavigate();
  const esEdicion = Boolean(proveedorId);

  // Estado con la estructura normalizada que definimos
  const [formData, setFormData] = useState({
    razonSocial: "",
    rfc: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    tipoInsumo: "",
    estado: "",
    ciudad: "",
    colonia: "",
    calle: "",
    numeroExterior: "",
    numeroInterior: "",
    codigoPostal: "",
    telefono: "",
    correo: "",
    activo: true
  });
  const [tiposInsumo, setTiposInsumo] = useState([]);
// 👇 NUEVO: Función para cargar los tipos de insumo
const cargarTiposInsumo = async () => {
  try {
    // Esta función la tienes que crear en tu servicio de proveedores
    const tipos = await obtenerTiposInsumo();
    setTiposInsumo(tipos);
  } catch (error) {
    console.error("Error cargando tipos de insumo:", error);
  }
};
  useEffect(() => {
    cargarTiposInsumo();

    const cargar = async () => {
      if (!proveedorId) return;
      try {
        const data = await obtenerProveedorPorId(proveedorId);
        setFormData({ ...data }); // Asumiendo que el backend trae la estructura nueva
      } catch (e) {
        console.error("Error cargando:", e);
      }
    };
    cargar();
  }, [proveedorId]);

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

      if (esEdicion) {
        await actualizarProveedor(proveedorId, formData);
        setToastMessage("¡Proveedor actualizado con éxito!");
      } else {
        await crearProveedor(formData);
        setToastMessage("¡Proveedor registrado con éxito!");
      }

      setToastType("success");
      setTimeout(() => navigate("/proveedores"), 1500);

    } catch (error) {

      console.log("ERROR COMPLETO:", error);

      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  }

  // Helper para clases de error
  const inputClass = (field) => `form-control ${erroresBackend[field] ? "is-invalid" : "border-soft"}`;

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
        <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
          {formData.activo ? 'Cuenta Activa' : 'Inactiva'}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* SECCIÓN 1: IDENTIDAD Y CONTACTO */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary"><i className="bi bi-person-badge me-2"></i>Información General</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Razón Social</label>
                <input type="text" name="razonSocial" className={inputClass("razonSocial")} value={formData.razonSocial} onChange={handleChange} placeholder="Nombre legal de la empresa" />
                <div className="invalid-feedback">{erroresBackend.razonSocial}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">RFC</label>
                <input type="text" name="rfc" className={inputClass("rfc")} value={formData.rfc} onChange={handleChange} placeholder="ABC123456XYZ" />
              </div>

              {/* 👇 NUEVO: Campo de tipo de insumo */}
<div className="col-md-4">
  <label className="form-label fw-semibold">
    <i className="bi bi-tags me-1"></i>
    Tipo de Insumo <span className="text-danger">*</span>
  </label>
  <select 
    name="tipoInsumo" 
    className={`form-select ${erroresBackend.tipoInsumo ? 'is-invalid' : 'border-soft'}`}
    value={formData.tipoInsumo || ""} 
    onChange={handleChange}
    required
  >
    <option value="">Selecciona un tipo...</option>
    {tiposInsumo.map(tipo => (
      <option key={tipo} value={tipo}>
        {tipo.replace(/_/g, ' ')} {/* Convierte HERRAJES a "HERRAJES" (luego lo mejoramos) */}
      </option>
    ))}
  </select>
  <div className="invalid-feedback">{erroresBackend.tipoInsumo}</div>
</div>
              
              <div className="col-md-4">
                <label className="form-label fw-semibold">Nombre del Contacto</label>
                <input type="text" name="nombre" className={inputClass("nombre")} value={formData.nombre} onChange={handleChange} />
                 <div className="invalid-feedback">{erroresBackend.nombre}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Apellido Paterno</label>
                <input type="text" name="apellidoPaterno" className="form-control" value={formData.apellidoPaterno} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Apellido Materno</label>
                <input type="text" name="apellidoMaterno" className="form-control" value={formData.apellidoMaterno} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DIRECCIÓN NORMALIZADA */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary"><i className="bi bi-geo-alt me-2"></i>Ubicación </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Calle</label>
                <input type="text" name="calle" className="form-control" value={formData.calle} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Num. Ext</label>
                <input type="text" name="numeroExterior" className="form-control" value={formData.numeroExterior} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Num. Int</label>
                <input type="text" name="numeroInterior" className="form-control" value={formData.numeroInterior} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Colonia</label>
                <input type="text" name="colonia" className="form-control" value={formData.colonia} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Ciudad / Municipio</label>
                <input type="text" name="ciudad" className="form-control" value={formData.ciudad} onChange={handleChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Estado</label>
                <input type="text" name="estado" className="form-control" value={formData.estado} onChange={handleChange} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">C.P.</label>
                <input type="text" name="codigoPostal" className="form-control" value={formData.codigoPostal} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CONTACTO DIRECTO */}
        <div className="row mb-4">
            <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                        <label className="form-label fw-bold">Teléfono de contacto</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light"><i className="bi bi-telephone"></i></span>
                            <input type="text" name="telefono" className={inputClass("telefono")} value={formData.telefono} onChange={handleChange} />
                        </div>
                        <div className="small text-danger mt-1">{erroresBackend.telefono}</div>
                    </div>
                </div>
            </div>
            <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                        <label className="form-label fw-bold">Correo electrónico</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                            <input type="email" name="correo" className={inputClass("correo")} value={formData.correo} onChange={handleChange} />
                        </div>
                        <div className="small text-danger mt-1">{erroresBackend.correo}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
            <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} id="switchActivo" />
                <label className="form-check-label fw-semibold" htmlFor="switchActivo">Proveedor habilitado</label>
            </div>
            <div className="gap-2 d-flex">
                <button type="button" className="btn btn-light px-4" onClick={() => navigate("/proveedores")}>Cancelar</button>
                <button type="submit" className="btn btn-primary px-5 fw-bold">Guardar Cambios</button>
            </div>
        </div>
      </form>
    </div>
  );
}