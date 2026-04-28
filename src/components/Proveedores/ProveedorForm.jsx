import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  obtenerTiposInsumo
} from "../../services/proveedores.js";
import Toast from "../ui/Toast.jsx";

const emptyForm = {
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
};

const normalizeText = (value) => (value == null ? "" : String(value).trim());

export default function ProveedorForm({ proveedorId, proveedor: proveedorProp, errores: erroresExternos = {} }) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [tiposInsumo, setTiposInsumo] = useState([]);

  const navigate = useNavigate();
  const esEdicion = Boolean(proveedorId || proveedorProp?.id);

  const [formData, setFormData] = useState(emptyForm);

  const erroresCampo = useMemo(() => {
    return {
      ...erroresExternos,
      ...erroresBackend
    };
  }, [erroresBackend, erroresExternos]);

  const campoTieneError = (field) => Boolean(erroresCampo[field]);
  const textoError = (field) => erroresCampo[field] || "";
  const inputClass = (field) => `form-control ${campoTieneError(field) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${campoTieneError(field) ? "is-invalid" : "border-soft"}`;

  useEffect(() => {
    const cargarTiposInsumo = async () => {
      try {
        const tipos = await obtenerTiposInsumo();
        setTiposInsumo(Array.isArray(tipos) ? tipos.filter(Boolean) : []);
      } catch (error) {
        console.error("Error cargando tipos de insumo:", error);
      }
    };

    cargarTiposInsumo();
  }, []);

  useEffect(() => {
    const cargarProveedor = async () => {
      const id = proveedorProp?.id || proveedorId;
      if (!id) return;

      try {
        const data = proveedorProp || (await obtenerProveedorPorId(id));
        setFormData({
          ...emptyForm,
          ...data,
          tipoInsumo: data?.tipoInsumo || ""
        });
      } catch (error) {
        console.error("Error cargando proveedor:", error);
      }
    };

    cargarProveedor();
  }, [proveedorId, proveedorProp]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (erroresBackend[name]) {
      setErroresBackend((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  }

  const construirPayload = () => ({
    razonSocial: normalizeText(formData.razonSocial),
    rfc: normalizeText(formData.rfc),
    nombre: normalizeText(formData.nombre),
    apellidoPaterno: normalizeText(formData.apellidoPaterno),
    apellidoMaterno: normalizeText(formData.apellidoMaterno),
    tipoInsumo: normalizeText(formData.tipoInsumo) || null,
    estado: normalizeText(formData.estado),
    ciudad: normalizeText(formData.ciudad),
    colonia: normalizeText(formData.colonia),
    calle: normalizeText(formData.calle),
    numeroExterior: normalizeText(formData.numeroExterior),
    numeroInterior: normalizeText(formData.numeroInterior),
    codigoPostal: normalizeText(formData.codigoPostal),
    telefono: normalizeText(formData.telefono),
    correo: normalizeText(formData.correo),
    activo: Boolean(formData.activo)
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = construirPayload();

    if (!payload.tipoInsumo) {
      setErroresBackend((prev) => ({
        ...prev,
        tipoInsumo: "Selecciona un tipo de insumo"
      }));
      setToastType("danger");
      setToastMessage("Revisa el formulario antes de guardar.");
      return;
    }

    try {
      setErroresBackend({});

      if (esEdicion) {
        await actualizarProveedor(proveedorId || proveedorProp?.id, payload);
        setToastMessage("Proveedor actualizado con exito");
      } else {
        await crearProveedor(payload);
        setToastMessage("Proveedor registrado con exito");
      }

      setToastType("success");
      setTimeout(() => navigate("/proveedores"), 1500);
    } catch (error) {
      console.log("ERROR COMPLETO:", error);

      if (error.errors) {
        setErroresBackend(error.errors);
        setToastType("danger");
        setToastMessage("Revisa los campos marcados.");
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  }

  const renderFieldError = (field) =>
    campoTieneError(field) ? <div className="invalid-feedback d-block">{textoError(field)}</div> : null;

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">{esEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
        <span className={`badge ${formData.activo ? "bg-success" : "bg-secondary"}`}>
          {formData.activo ? "Cuenta Activa" : "Inactiva"}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-person-badge me-2"></i>Informacion General
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Razon Social</label>
                <input type="text" name="razonSocial" className={inputClass("razonSocial")} value={formData.razonSocial} onChange={handleChange} placeholder="Nombre legal de la empresa" />
                {renderFieldError("razonSocial")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">RFC</label>
                <input type="text" name="rfc" className={inputClass("rfc")} value={formData.rfc} onChange={handleChange} placeholder="ABC123456XYZ" />
                {renderFieldError("rfc")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-tags me-1"></i>
                  Tipo de Insumo <span className="text-danger">*</span>
                </label>
                <select
                  name="tipoInsumo"
                  className={selectClass("tipoInsumo")}
                  value={formData.tipoInsumo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un tipo...</option>
                  {tiposInsumo.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                {renderFieldError("tipoInsumo")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Nombre del Contacto</label>
                <input type="text" name="nombre" className={inputClass("nombre")} value={formData.nombre} onChange={handleChange} />
                {renderFieldError("nombre")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Apellido Paterno</label>
                <input type="text" name="apellidoPaterno" className={inputClass("apellidoPaterno")} value={formData.apellidoPaterno} onChange={handleChange} />
                {renderFieldError("apellidoPaterno")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Apellido Materno</label>
                <input type="text" name="apellidoMaterno" className={inputClass("apellidoMaterno")} value={formData.apellidoMaterno} onChange={handleChange} />
                {renderFieldError("apellidoMaterno")}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-geo-alt me-2"></i>Ubicacion
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Calle</label>
                <input type="text" name="calle" className={inputClass("calle")} value={formData.calle} onChange={handleChange} />
                {renderFieldError("calle")}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Num. Ext</label>
                <input type="text" name="numeroExterior" className={inputClass("numeroExterior")} value={formData.numeroExterior} onChange={handleChange} />
                {renderFieldError("numeroExterior")}
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Num. Int</label>
                <input type="text" name="numeroInterior" className={inputClass("numeroInterior")} value={formData.numeroInterior} onChange={handleChange} />
                {renderFieldError("numeroInterior")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Colonia</label>
                <input type="text" name="colonia" className={inputClass("colonia")} value={formData.colonia} onChange={handleChange} />
                {renderFieldError("colonia")}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Ciudad / Municipio</label>
                <input type="text" name="ciudad" className={inputClass("ciudad")} value={formData.ciudad} onChange={handleChange} />
                {renderFieldError("ciudad")}
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Estado</label>
                <input type="text" name="estado" className={inputClass("estado")} value={formData.estado} onChange={handleChange} />
                {renderFieldError("estado")}
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">C.P.</label>
                <input type="text" name="codigoPostal" className={inputClass("codigoPostal")} value={formData.codigoPostal} onChange={handleChange} />
                {renderFieldError("codigoPostal")}
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <label className="form-label fw-bold">Telefono de contacto</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-telephone"></i>
                  </span>
                  <input type="text" name="telefono" className={inputClass("telefono")} value={formData.telefono} onChange={handleChange} />
                </div>
                {renderFieldError("telefono")}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <label className="form-label fw-bold">Correo electronico</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input type="email" name="correo" className={inputClass("correo")} value={formData.correo} onChange={handleChange} />
                </div>
                {renderFieldError("correo")}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} id="switchActivo" />
            <label className="form-check-label fw-semibold" htmlFor="switchActivo">
              Proveedor habilitado
            </label>
          </div>

          <div className="gap-2 d-flex">
            <button type="button" className="btn btn-light px-4" onClick={() => navigate("/proveedores")}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary px-5 fw-bold">
              Guardar Cambios
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
