import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  crearEmpleado,
  obtenerEmpleadoPorId,
  actualizarEmpleado
} from "../../services/empleados";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function EmpleadoFormPage() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [mostrarCuenta, setMostrarCuenta] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    fechaNacimiento: "",
    activo: true,
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    if (isEditing) {
      cargarEmpleado();
    }
  }, [id]);

  const cargarEmpleado = async () => {

    try {

      setLoading(true);

      const data = await obtenerEmpleadoPorId(id);

      console.log("Empleado cargado:", data);

      setFormData({
        nombre: data.nombre || "",
        apellidoPaterno: data.apellidoPaterno || "",
        apellidoMaterno: data.apellidoMaterno || "",
        telefono: data.telefono || "",
        fechaNacimiento: data.fechaNacimiento || "",
        activo: data.activo ?? true,
        email: data.correo || "",
        password: ""
      });

      setMostrarCuenta(data.tieneCuenta === true);

    } catch (error) {

      console.error("Error al cargar empleado:", error);

      setToastType("danger");
      setToastMessage("Error al cargar empleado");

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

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = "El apellido paterno es requerido";
    }

    const email = formData.email?.trim();
    const pass = formData.password?.trim();

    if (email && !pass) {
      newErrors.password = "Debes ingresar contraseña";
    }

    if (!email && pass) {
      newErrors.email = "Debes ingresar correo";
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

    const datos = {

      nombre: formData.nombre.trim(),
      apellidoPaterno: formData.apellidoPaterno.trim(),
      apellidoMaterno: formData.apellidoMaterno.trim(),
      telefono: formData.telefono?.trim(),
      fechaNacimiento: formData.fechaNacimiento || null,
      activo: formData.activo

      
    };
    console.log(formData);

    if (formData.email && formData.password) {

      datos.email = formData.email.trim();
      datos.password = formData.password.trim();

    }

    try {

      setSaving(true);

      if (isEditing) {

        await actualizarEmpleado(id, datos);

        setToastType("success");
        setToastMessage("Empleado actualizado correctamente");

      } else {

        await crearEmpleado(datos);

        setToastType("success");
        setToastMessage("Empleado creado correctamente");

      }

      setTimeout(() => {
        navigate("/empleados");
      }, 1500);

    } catch (error) {

      console.error("Error al guardar empleado:", error);

      setToastType("danger");
      setToastMessage("Error al guardar empleado");

    } finally {

      setSaving(false);

    }

  };

  if (loading) {

    return (
      <div className="container mt-4">
        <div className="alert alert-info">
          Cargando empleado...
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
        title={isEditing ? "Editar Empleado" : "Nuevo Empleado"}
        subtitle="Registro de empleado"
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/empleados")}
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

                <div className="col-md-4 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                  {errors.nombre && (
                    <div className="invalid-feedback">{errors.nombre}</div>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Apellido Paterno *</label>
                  <input
                    className={`form-control ${errors.apellidoPaterno ? 'is-invalid' : ''}`}
                    name="apellidoPaterno"
                    value={formData.apellidoPaterno}
                    onChange={handleChange}
                  />
                  {errors.apellidoPaterno && (
                    <div className="invalid-feedback">{errors.apellidoPaterno}</div>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Apellido Materno</label>
                  <input
                    className="form-control"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-control"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Fecha Nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 mb-3 d-flex align-items-center">

                  <div className="form-check mt-4">

                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />

                    <label className="form-check-label">
                      Activo
                    </label>

                  </div>

                </div>

              </div>

              {!mostrarCuenta && (
                <div className="col-12 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setMostrarCuenta(true)}
                  >
                    Crear cuenta
                  </button>
                </div>
              )}

              {mostrarCuenta && (
                <>
                  <div className="col-md-6 mb-3">
                    <label>Correo</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Dejar vacío para no cambiar"
                    />
                  </div>
                </>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/empleados")}
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