import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  crearEmpleado,
  obtenerEmpleadoPorId,
  actualizarEmpleado,
  eliminarEmpleado,
  subirFotoEmpleado,
  eliminarFotoEmpleado
} from "../services/empleados";
import { obtenerAreasTrabajo } from "../../areas-trabajo/services/areasTrabajo.js";
import { createInvitation, getAvailableRoles, getCurrentUser, getUser } from "../../auth/services/authService";
import { API_BASE_URL } from "../../../config/apiConfig";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./EmpleadoPage.css";

const ROLES_GESTION_EMPLEADOS = ["ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"];
const ROLES_BLOQUEADOS_INVITACION = ["ADMIN", "SUPER_ADMIN"];

function construirFotoSrc(fotoUrl) {
  if (!fotoUrl) return "";
  if (/^https?:\/\//i.test(fotoUrl)) return fotoUrl;
  return `${API_BASE_URL}${fotoUrl}`;
}

function getIniciales(formData) {
  const nombre = formData.nombre?.trim()?.charAt(0) || "";
  const apellido = formData.apellidoPaterno?.trim()?.charAt(0) || "";
  return `${nombre}${apellido}`.trim() || "U";
}

export default function EmpleadoFormPage() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const currentUser = getUser();
  const esMiPerfil = isEditing && String(currentUser?.idEmpleado || "") === String(id);
  const puedeGestionarEmpleados = currentUser?.roles?.some((rol) => ROLES_GESTION_EMPLEADOS.includes(rol));
  const puedeEliminarEmpleado = isEditing && puedeGestionarEmpleados && !esMiPerfil;

  const [fotoUrl, setFotoUrl] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    fechaNacimiento: "",
    activo: true,
    email: "",
    areaId: ""
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [errors, setErrors] = useState({});

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [mostrandoAcceso, setMostrandoAcceso] = useState(false);
  const [rolesAcceso, setRolesAcceso] = useState([]);
  const [areasTrabajo, setAreasTrabajo] = useState([]);
  const [cargandoAreasTrabajo, setCargandoAreasTrabajo] = useState(false);
  const [cargandoRolesAcceso, setCargandoRolesAcceso] = useState(false);
  const [generandoInvitacion, setGenerandoInvitacion] = useState(false);
  const [tokenInvitacion, setTokenInvitacion] = useState("");
  const tokenInvitacionRef = useRef(null);
  const [acceso, setAcceso] = useState({
    email: "",
    rol: "",
    puesto: "EMPLEADO"
  });

  const cargarEmpleado = useCallback(async () => {

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
        areaId: data.areaId ? String(data.areaId) : ""
      });
      setAcceso((prev) => ({
        ...prev,
        email: data.correo || prev.email || ""
      }));
      setFotoUrl(data.fotoUrl || "");

    } catch (error) {

      console.error("Error al cargar empleado:", error);

      setToastType("danger");
      setToastMessage("Error al cargar empleado");

    } finally {

      setLoading(false);

    }

  }, [id]);

  useEffect(() => {
    if (isEditing) {
      cargarEmpleado();
    }
  }, [cargarEmpleado, isEditing]);

  useEffect(() => {
    let activo = true;

    const cargarAreasTrabajo = async () => {
      try {
        setCargandoAreasTrabajo(true);
        const areas = await obtenerAreasTrabajo({ activo: true });
        if (activo) {
          setAreasTrabajo(Array.isArray(areas) ? areas : []);
        }
      } catch (error) {
        console.error("Error al cargar areas de trabajo:", error);
        if (activo) {
          setAreasTrabajo([]);
        }
      } finally {
        if (activo) {
          setCargandoAreasTrabajo(false);
        }
      }
    };

    cargarAreasTrabajo();

    return () => {
      activo = false;
    };
  }, []);

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
      activo: formData.activo,
      areaId: formData.areaId ? Number(formData.areaId) : null
    };

    if (formData.email?.trim()) {
      datos.email = formData.email.trim();
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

  const refrescarUsuarioActual = async () => {
    try {
      const refreshedUser = await getCurrentUser();
      localStorage.setItem("user", JSON.stringify(refreshedUser));
      window.dispatchEvent(new Event("userUpdated"));
    } catch (refreshError) {
      console.warn("No se pudo refrescar el usuario actual:", refreshError);
    }
  };

  const handleFotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      setSubiendoFoto(true);
      const respuesta = await subirFotoEmpleado(id, file);
      const empleadoActualizado = await obtenerEmpleadoPorId(id);
      setFotoUrl(empleadoActualizado?.fotoUrl || respuesta?.fotoUrl || "");

      if (esMiPerfil) {
        await refrescarUsuarioActual();
      }

      setToastType("success");
      setToastMessage("Foto de perfil actualizada");
    } catch (error) {
      console.error("Error al subir foto del empleado:", error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo actualizar la foto");
    } finally {
      setSubiendoFoto(false);
      event.target.value = "";
    }
  };

  const handleEliminarFoto = async () => {
    if (!id || !fotoUrl) return;

    const confirmacion = window.confirm("Eliminar la foto de perfil de este empleado?");
    if (!confirmacion) return;

    try {
      setEliminandoFoto(true);
      await eliminarFotoEmpleado(id);
      setFotoUrl("");

      if (esMiPerfil) {
        await refrescarUsuarioActual();
      }

      setToastType("success");
      setToastMessage("Foto de perfil eliminada");
    } catch (error) {
      console.error("Error al eliminar foto del empleado:", error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar la foto");
    } finally {
      setEliminandoFoto(false);
    }
  };

  const handleEliminarEmpleado = async () => {
    if (!puedeEliminarEmpleado) return;

    const confirmacion = window.confirm(
      "Eliminar este empleado? Solo se eliminara si no tiene actividad en el sistema."
    );
    if (!confirmacion) return;

    try {
      setDeleting(true);
      await eliminarEmpleado(id);
      setToastType("success");
      setToastMessage("Empleado eliminado correctamente");
      setTimeout(() => {
        navigate("/empleados");
      }, 900);
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar el empleado");
    } finally {
      setDeleting(false);
    }
  };

  const abrirAcceso = async () => {
    if (!isEditing || !puedeGestionarEmpleados) return;

    setMostrandoAcceso(true);
    setTokenInvitacion("");
    setAcceso((prev) => ({
      ...prev,
      email: formData.email?.trim() || prev.email || ""
    }));

    if (rolesAcceso.length > 0) {
      return;
    }

    try {
      setCargandoRolesAcceso(true);
      const roles = await getAvailableRoles();
      const disponibles = (Array.isArray(roles) ? roles : []).filter(
        (rol) => !ROLES_BLOQUEADOS_INVITACION.includes(rol)
      );
      setRolesAcceso(disponibles);
      if (disponibles.length > 0) {
        setAcceso((prev) => ({
          ...prev,
          rol: prev.rol || disponibles[0]
        }));
      }
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudieron cargar los roles.");
    } finally {
      setCargandoRolesAcceso(false);
    }
  };

  const handleAccesoChange = (event) => {
    const { name, value } = event.target;
    setAcceso((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const generarInvitacionAcceso = async () => {
    const email = acceso.email?.trim();
    const rol = acceso.rol?.trim();

    if (!email || !rol) {
      setToastType("danger");
      setToastMessage("Correo y rol son obligatorios para generar acceso.");
      return;
    }

    const payload = {
      email,
      nombre: formData.nombre?.trim() || "NOMBRE",
      apellidoPaterno: formData.apellidoPaterno?.trim() || "APELLIDO",
      apellidoMaterno: formData.apellidoMaterno?.trim() || "SIN_DATO",
      telefono: formData.telefono?.trim() || "0000000000",
      puesto: acceso.puesto?.trim() || "EMPLEADO",
      rol,
      empleadoId: Number(id)
    };

    try {
      setGenerandoInvitacion(true);
      const response = await createInvitation(payload);
      const token = response?.token || "";
      setTokenInvitacion(token);
      setToastType("success");
      setToastMessage(token ? "Token de invitacion generado." : "La invitacion se creo, pero no se recibio token.");
      if (token) {
        window.requestAnimationFrame(() => {
          tokenInvitacionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    } catch (error) {
      setToastType("danger");
      if (error?.message?.includes("ya tiene una cuenta registrada")) {
        setToastMessage("Ese correo ya tiene una cuenta. Usa un correo sin cuenta para generar la invitacion.");
      } else {
        setToastMessage(error.message || "No se pudo generar la invitacion.");
      }
    } finally {
      setGenerandoInvitacion(false);
    }
  };

  const copiarTexto = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setToastType("success");
      setToastMessage("Copiado al portapapeles.");
    } catch {
      setToastType("danger");
      setToastMessage("No se pudo copiar.");
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

  const fotoPreview = construirFotoSrc(fotoUrl);

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

            {isEditing && puedeGestionarEmpleados && (
              <div className="empleado-photo-panel mb-4">
                <div className="empleado-form-avatar">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt={`${formData.nombre || "Empleado"} ${formData.apellidoPaterno || ""}`.trim()}
                    />
                  ) : (
                    <span>{getIniciales(formData)}</span>
                  )}
                </div>

                <div className="empleado-photo-content">
                  <div className="fw-semibold">Foto de perfil</div>
                  <div className="text-muted small mb-2">
                    Actualiza la imagen que se muestra en el perfil y en el listado.
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <label className={`btn empleados-brand-outline ${subiendoFoto || eliminandoFoto ? "disabled" : ""}`}>
                      <i className="bi bi-camera me-1"></i>
                      {subiendoFoto ? "Subiendo..." : fotoPreview ? "Cambiar foto" : "Agregar foto"}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={subiendoFoto || eliminandoFoto}
                        onChange={handleFotoChange}
                      />
                    </label>

                    {fotoPreview && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleEliminarFoto}
                        disabled={subiendoFoto || eliminandoFoto}
                      >
                        <i className="bi bi-trash me-1"></i>
                        {eliminandoFoto ? "Eliminando..." : "Eliminar foto"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {esMiPerfil && (
              <div className="alert alert-warning border-0 mb-4">
                Estás editando tu propio empleado. Estos cambios impactan tu perfil actual.
              </div>
            )}

            {isEditing && puedeGestionarEmpleados && (
              <div className="border rounded-3 p-3 mb-4 bg-light-subtle">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <div className="fw-semibold">Acceso de usuario</div>
                    <div className="text-muted small">
                      Genera una invitacion para este empleado sin salir de su edicion.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn ${mostrandoAcceso ? "btn-outline-secondary" : "btn-outline-primary"}`}
                    onClick={() => (mostrandoAcceso ? setMostrandoAcceso(false) : abrirAcceso())}
                    disabled={cargandoRolesAcceso || generandoInvitacion}
                  >
                    <i className="bi bi-key me-1"></i>
                    {mostrandoAcceso ? "Ocultar acceso" : "Dar acceso"}
                  </button>
                </div>

                {mostrandoAcceso && (
                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <label className="form-label">Correo</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={acceso.email}
                        onChange={handleAccesoChange}
                        placeholder="correo@empresa.com"
                      />
                      <div className="form-text">
                        Usa el correo del empleado. Si esta pendiente y sin acceso, se activara con esta invitacion.
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Rol</label>
                      <select
                        className="form-select"
                        name="rol"
                        value={acceso.rol}
                        onChange={handleAccesoChange}
                        disabled={cargandoRolesAcceso}
                      >
                        {rolesAcceso.length === 0 && <option value="">Sin roles disponibles</option>}
                        {rolesAcceso.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Puesto</label>
                      <input
                        type="text"
                        className="form-control"
                        name="puesto"
                        value={acceso.puesto}
                        onChange={handleAccesoChange}
                      />
                    </div>
                    <div className="col-12 d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={generarInvitacionAcceso}
                        disabled={generandoInvitacion || cargandoRolesAcceso}
                      >
                        <i className="bi bi-envelope-paper me-1"></i>
                        {generandoInvitacion ? "Generando..." : "Generar token de invitacion"}
                      </button>
                    </div>
                    {tokenInvitacion && (
                      <div className="col-12" ref={tokenInvitacionRef}>
                        <div className="alert alert-success mb-0">
                          <div className="fw-semibold mb-1">Token generado</div>
                          <div className="small mb-2">
                            Este es el token de invitacion. Copialo o compartelo con el empleado para que complete su registro.
                          </div>
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={tokenInvitacion}
                              readOnly
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => copiarTexto(tokenInvitacion)}
                            >
                              Copiar token
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                  {puedeGestionarEmpleados ? (
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
                  ) : (
                    <div className="mt-4">
                      <span
                        className={
                          formData.activo
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {formData.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Area de trabajo</label>
                  <select
                    className="form-select"
                    name="areaId"
                    value={formData.areaId}
                    onChange={handleChange}
                    disabled={cargandoAreasTrabajo}
                  >
                    <option value="">
                      {cargandoAreasTrabajo ? "Cargando areas..." : "Sin area asignada"}
                    </option>
                    {areasTrabajo.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="col-md-6">
                <label>Correo (opcional)</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@empresa.com"
                />
              </div>

              <div className="d-flex justify-content-between gap-2 mt-3 empleado-form-actions">
                {puedeEliminarEmpleado ? (
                  <button
                    type="button"
                    className="btn empleados-delete-button"
                    onClick={handleEliminarEmpleado}
                    disabled={deleting || saving}
                  >
                    <i className="bi bi-trash me-1"></i>
                    {deleting ? "Eliminando..." : "Eliminar empleado"}
                  </button>
                ) : (
                  <span />
                )}

                <div className="d-flex gap-2">
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
                    disabled={saving || deleting}
                  >
                    {saving ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar")}
                  </button>
                </div>

              </div>

            </form>

          </div>

        </div>

      </div>

    </>
  );

}
