import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  crearEmpleado,
  obtenerEmpleadoPorId,
  actualizarEmpleado
} from "../../services/empleados";
import { getCurrentUser, getUser } from "../../services/authService";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function EmpleadoFormPage() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const currentUser = getUser();
  const esMiPerfil = isEditing && String(currentUser?.idEmpleado || "") === String(id);

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
    const debeValidarCuenta = !isEditing && mostrarCuenta;

    if (debeValidarCuenta) {
      if (!email) {
        newErrors.email = "Debes ingresar correo";
      }

      if (!pass) {
        newErrors.password = "Debes ingresar contraseña";
      }
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
      apellidoMaterno: formData.apellidoMaterno.trim() || null,
      telefono: formData.telefono?.trim() || null,
      fechaNacimiento: formData.fechaNacimiento || null,
      activo: formData.activo
    };

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

      try {
        const currentUser = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(currentUser));
        window.dispatchEvent(new Event("userUpdated"));
      } catch (refreshError) {
        console.warn("No se pudo refrescar el usuario actual:", refreshError);
      }

      setTimeout(() => {
        navigate("/empleados");
      }, 1500);

    } catch (error) {

      console.error("Error al guardar empleado:", error);
      console.error("Detalle del error empleado:", error?.data || error?.errors || error?.status);

      setToastType("danger");
      const erroresBackend = error?.errors && typeof error.errors === "object"
        ? Object.values(error.errors).filter(Boolean)
        : [];
      setToastMessage(
        erroresBackend.length > 0
          ? erroresBackend[0]
          : error.message || "Error al guardar empleado"
      );

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

      <div className="container-xxl py-4">

        <div className="card shadow-sm border-0">

          <div className="card-body p-4 p-md-5">

            {esMiPerfil && (
              <div className="alert alert-warning border-0 mb-4">
                Estás editando tu propio empleado. Estos cambios impactan tu perfil actual.
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="row g-3">

                <div className="col-md-4">
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

                <div className="col-md-4">
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

                <div className="col-md-4">
                  <label className="form-label">Apellido Materno</label>
                  <input
                    className="form-control"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-control"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Fecha Nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 d-flex align-items-center">

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
                <div className="col-12">
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
                  <div className="col-md-6">
                    <label>Correo</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
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
