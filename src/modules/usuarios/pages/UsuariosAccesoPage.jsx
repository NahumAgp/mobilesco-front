import React, { useEffect, useMemo, useState } from "react";
import { createInvitation, getAvailableRoles } from "../../auth/services/authService";

const initialInvitation = {
  email: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  telefono: "",
  puesto: "",
  rol: ""
};

export default function UsuariosAccesoPage() {
  const [roles, setRoles] = useState([]);
  const [invitacion, setInvitacion] = useState(initialInvitation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenGenerado, setTokenGenerado] = useState("");

  const rolesPermitidos = useMemo(() => {
    return roles.filter((rol) => rol !== "ADMIN" && rol !== "EMPLOYEE");
  }, [roles]);

  const cargarRoles = async () => {
    try {
      const rolesResponse = await getAvailableRoles();
      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los roles.");
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInvitacion((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearInvitacion = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await createInvitation(invitacion);
      setTokenGenerado(response.token);
      setSuccess("Invitacion creada. Comparte el token con la persona invitada.");
      setInvitacion(initialInvitation);
    } catch (err) {
      setError(err.message || "No se pudo crear la invitacion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-xxl-10">
          <div className="text-center mb-4">
            <h1 className="h3 mb-2">Usuarios y accesos</h1>
            <p className="text-muted mb-0">
              Crea invitaciones para que una persona pueda registrarse con su token.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: "1100px" }}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                  <h2 className="h4 mb-2">Nueva invitación</h2>
                  <p className="text-muted mb-0">
                    Captura los datos personales y el acceso que tendrá el usuario.
                  </p>
                </div>
                <span className="badge text-bg-success-subtle text-success-emphasis px-3 py-2">
                  Registro por invitación
                </span>
              </div>

              <form onSubmit={handleCrearInvitacion}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={invitacion.nombre}
                      onChange={handleChange}
                      placeholder="Nombre(s)"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label">Apellido paterno</label>
                    <input
                      type="text"
                      name="apellidoPaterno"
                      className="form-control"
                      value={invitacion.apellidoPaterno}
                      onChange={handleChange}
                      placeholder="Apellido paterno"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label">Apellido materno</label>
                    <input
                      type="text"
                      name="apellidoMaterno"
                      className="form-control"
                      value={invitacion.apellidoMaterno}
                      onChange={handleChange}
                      placeholder="Apellido materno"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-control"
                      value={invitacion.telefono}
                      onChange={handleChange}
                      placeholder="10 dígitos"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-8">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={invitacion.email}
                      onChange={handleChange}
                      placeholder="correo@empresa.com"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Puesto</label>
                    <input
                      type="text"
                      name="puesto"
                      className="form-control"
                      value={invitacion.puesto}
                      onChange={handleChange}
                      placeholder="Ej. Jefe de Almacén"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Rol</label>
                    <select
                      name="rol"
                      className="form-select"
                      value={invitacion.rol}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un rol</option>
                      {rolesPermitidos.map((rol) => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-success px-4" disabled={loading}>
                    {loading ? "Generando..." : "Generar invitación"}
                  </button>
                </div>
              </form>

              {tokenGenerado && (
                <div className="alert alert-info mt-4 mb-0">
                  <div className="fw-semibold mb-1">Token generado</div>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <code className="flex-grow-1">{tokenGenerado}</code>
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={() => navigator.clipboard.writeText(tokenGenerado)}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
