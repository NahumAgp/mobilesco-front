import React, { useEffect, useMemo, useState } from "react";
import {
  createInvitation,
  createRole,
  deactivateAccessUser,
  getAccessUsers,
  getAvailableRoles,
  getPermissions,
  getRolesConfig,
  updateAccessUser,
  updateRole
} from "../../auth/services/authService";
import "./UsuariosAccesoPage.css";

const initialInvitation = {
  email: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  telefono: "",
  puesto: "",
  rol: ""
};

const initialRole = {
  name: "",
  descripcion: "",
  permisos: []
};

export default function UsuariosAccesoPage() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [roles, setRoles] = useState([]);
  const [rolesConfig, setRolesConfig] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [invitacion, setInvitacion] = useState(initialInvitation);
  const [nuevoRol, setNuevoRol] = useState(initialRole);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenGenerado, setTokenGenerado] = useState("");

  const permisosPorModulo = useMemo(() => {
    return permisos.reduce((acc, permiso) => {
      const modulo = permiso.modulo || "General";
      acc[modulo] = [...(acc[modulo] || []), permiso];
      return acc;
    }, {});
  }, [permisos]);

  const rolesPermitidos = useMemo(() => {
    return roles.filter((rol) => rol !== "ADMIN" && rol !== "EMPLOYEE");
  }, [roles]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesResponse, rolesConfigResponse, permisosResponse, usuariosResponse] = await Promise.all([
        getAvailableRoles(),
        getRolesConfig(),
        getPermissions(),
        getAccessUsers()
      ]);
      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
      setRolesConfig(Array.isArray(rolesConfigResponse) ? rolesConfigResponse : []);
      setPermisos(Array.isArray(permisosResponse) ? permisosResponse : []);
      setUsuarios(Array.isArray(usuariosResponse) ? usuariosResponse : []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la administracion de accesos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");
  };

  const showError = (err, fallback) => {
    setError(err.message || fallback);
    setSuccess("");
  };

  const toggleValue = (values = [], value) => {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  };

  const handleCrearInvitacion = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await createInvitation(invitacion);
      setTokenGenerado(response.token);
      setInvitacion(initialInvitation);
      showSuccess("Invitacion creada. Comparte el token con la persona invitada.");
    } catch (err) {
      showError(err, "No se pudo crear la invitacion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarUsuario = async () => {
    if (!usuarioSeleccionado) {
      return;
    }

    setLoading(true);
    try {
      await updateAccessUser(usuarioSeleccionado.idUsuario, {
        roles: usuarioSeleccionado.roles,
        permisosDirectos: usuarioSeleccionado.permisosDirectos,
        enabled: usuarioSeleccionado.enabled,
        locked: usuarioSeleccionado.locked
      });
      setUsuarioSeleccionado(null);
      await cargarDatos();
      showSuccess("Usuario actualizado correctamente.");
    } catch (err) {
      showError(err, "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivarUsuario = async (usuario) => {
    setLoading(true);
    try {
      await deactivateAccessUser(usuario.idUsuario);
      await cargarDatos();
      showSuccess("Usuario desactivado correctamente.");
    } catch (err) {
      showError(err, "No se pudo desactivar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarRol = async (rol) => {
    setLoading(true);
    try {
      await updateRole(rol.id, {
        descripcion: rol.descripcion,
        permisos: rol.permisos
      });
      await cargarDatos();
      showSuccess("Rol actualizado correctamente.");
    } catch (err) {
      showError(err, "No se pudo actualizar el rol.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearRol = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createRole(nuevoRol);
      setNuevoRol(initialRole);
      await cargarDatos();
      showSuccess("Rol creado correctamente.");
    } catch (err) {
      showError(err, "No se pudo crear el rol.");
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionChecks = (selected, onToggle) => (
    <div className="row g-3">
      {Object.entries(permisosPorModulo).map(([modulo, items]) => (
        <div className="col-12 col-lg-6" key={modulo}>
          <div className="border rounded-2 p-3 h-100">
            <div className="fw-semibold mb-2">{modulo}</div>
            <div className="d-grid gap-2">
              {items.map((permiso) => (
                <label key={permiso.code} className="form-check small">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={(selected || []).includes(permiso.code)}
                    onChange={() => onToggle(permiso.code)}
                  />
                  <span className="form-check-label">
                    {permiso.nombre}
                    <span className="text-muted d-block">{permiso.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container-xxl py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Usuarios, roles y permisos</h1>
          <p className="text-muted mb-0">Administra accesos, visibilidad de vistas e invitaciones del sistema.</p>
        </div>
        <button type="button" className="btn btn-outline-success" onClick={cargarDatos} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Actualizar
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card border-0 shadow-sm usuarios-access-shell">
        <div className="usuarios-access-tabs nav nav-tabs" role="tablist" aria-label="Usuarios, roles y permisos">
          {[
            ["usuarios", "Usuarios", "bi-people"],
            ["roles", "Roles y permisos", "bi-shield-lock"],
            ["invitaciones", "Invitaciones", "bi-send"]
          ].map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              className={`nav-link usuarios-access-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
              role="tab"
              aria-selected={activeTab === key}
            >
              <i className={`bi ${icon} me-2`}></i>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="card-body">
          {activeTab === "usuarios" && (
            <div className="row g-4">
              <div className="col-12 col-xl-7">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Roles</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.idUsuario}>
                          <td>
                            <div className="fw-semibold">{usuario.correo}</div>
                            <div className="text-muted small">
                              {[usuario.nombre, usuario.apellidoPaterno, usuario.apellidoMaterno].filter(Boolean).join(" ")}
                            </div>
                          </td>
                          <td>{usuario.roles?.length ? usuario.roles.join(", ") : "Sin roles"}</td>
                          <td>
                            <span className={`badge ${usuario.enabled && !usuario.locked ? "text-bg-success" : "text-bg-secondary"}`}>
                              {usuario.estadoCuenta || "SIN_ESTADO"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => setUsuarioSeleccionado({ ...usuario })}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDesactivarUsuario(usuario)}
                              disabled={!usuario.enabled || loading}
                            >
                              Desactivar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-12 col-xl-5">
                <div className="border rounded-2 p-3">
                  <h2 className="h5 mb-3">Edicion de accesos</h2>
                  {!usuarioSeleccionado ? (
                    <p className="text-muted mb-0">Selecciona un usuario para editar roles y permisos directos.</p>
                  ) : (
                    <div className="d-grid gap-3">
                      <div>
                        <label className="form-label">Correo</label>
                        <input className="form-control" value={usuarioSeleccionado.correo} disabled />
                      </div>
                      <div className="d-grid gap-2">
                        <label className="form-label mb-0">Roles</label>
                        <div className="text-muted small">
                          Puedes dejar todos los roles desmarcados. El usuario quedara sin acceso hasta que le asignes uno.
                        </div>
                        {roles.map((rol) => (
                          <label className="form-check" key={rol}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={usuarioSeleccionado.roles?.includes(rol)}
                              onChange={() =>
                                setUsuarioSeleccionado((prev) => ({
                                  ...prev,
                                  roles: toggleValue(prev.roles, rol)
                                }))
                              }
                            />
                            <span className="form-check-label">{rol}</span>
                          </label>
                        ))}
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={usuarioSeleccionado.enabled}
                          onChange={(event) =>
                            setUsuarioSeleccionado((prev) => ({ ...prev, enabled: event.target.checked }))
                          }
                        />
                        <label className="form-check-label">Cuenta activa</label>
                      </div>
                      {renderPermissionChecks(usuarioSeleccionado.permisosDirectos, (code) =>
                        setUsuarioSeleccionado((prev) => ({
                          ...prev,
                          permisosDirectos: toggleValue(prev.permisosDirectos, code)
                        }))
                      )}
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setUsuarioSeleccionado(null)}>
                          Cancelar
                        </button>
                        <button type="button" className="btn btn-success" onClick={handleGuardarUsuario} disabled={loading}>
                          Guardar usuario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="d-grid gap-4">
              <form className="border rounded-2 p-3" onSubmit={handleCrearRol}>
                <h2 className="h5 mb-3">Nuevo rol</h2>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      value={nuevoRol.name}
                      onChange={(event) => setNuevoRol((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Ej. COMPRAS_AUDITOR"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Descripcion</label>
                    <input
                      className="form-control"
                      value={nuevoRol.descripcion}
                      onChange={(event) => setNuevoRol((prev) => ({ ...prev, descripcion: event.target.value }))}
                      placeholder="Responsabilidad del rol"
                    />
                  </div>
                  <div className="col-12 col-md-2 d-grid">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                      Crear rol
                    </button>
                  </div>
                </div>
              </form>

              {rolesConfig.map((rol) => (
                <div className="border rounded-2 p-3" key={rol.id}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h2 className="h5 mb-1">{rol.name}</h2>
                      <input
                        className="form-control form-control-sm"
                        value={rol.descripcion || ""}
                        onChange={(event) =>
                          setRolesConfig((prev) =>
                            prev.map((item) => item.id === rol.id ? { ...item, descripcion: event.target.value } : item)
                          )
                        }
                        placeholder="Descripcion del rol"
                      />
                    </div>
                    <button type="button" className="btn btn-outline-success" onClick={() => handleGuardarRol(rol)} disabled={loading}>
                      Guardar permisos
                    </button>
                  </div>
                  {renderPermissionChecks(rol.permisos, (code) =>
                    setRolesConfig((prev) =>
                      prev.map((item) => item.id === rol.id ? { ...item, permisos: toggleValue(item.permisos, code) } : item)
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "invitaciones" && (
            <div className="row justify-content-center">
              <div className="col-12 col-xl-9">
                <form onSubmit={handleCrearInvitacion} className="d-grid gap-3">
                  <div className="row g-3">
                    {[
                      ["nombre", "Nombre", "Nombre(s)", "text"],
                      ["apellidoPaterno", "Apellido paterno", "Apellido paterno", "text"],
                      ["apellidoMaterno", "Apellido materno", "Apellido materno", "text"],
                      ["telefono", "Telefono", "10 digitos", "tel"],
                      ["email", "Correo", "correo@empresa.com", "email"],
                      ["puesto", "Puesto", "Ej. Jefe de Almacen", "text"]
                    ].map(([name, label, placeholder, type]) => (
                      <div className="col-12 col-md-6" key={name}>
                        <label className="form-label">{label}</label>
                        <input
                          type={type}
                          name={name}
                          className="form-control"
                          value={invitacion[name]}
                          onChange={(event) => setInvitacion((prev) => ({ ...prev, [name]: event.target.value }))}
                          placeholder={placeholder}
                          required
                        />
                      </div>
                    ))}

                    <div className="col-12 col-md-6">
                      <label className="form-label">Rol</label>
                      <select
                        name="rol"
                        className="form-select"
                        value={invitacion.rol}
                        onChange={(event) => setInvitacion((prev) => ({ ...prev, rol: event.target.value }))}
                        required
                      >
                        <option value="">Selecciona un rol</option>
                        {rolesPermitidos.map((rol) => (
                          <option key={rol} value={rol}>{rol}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-success px-4" disabled={loading}>
                      {loading ? "Generando..." : "Generar invitacion"}
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
          )}
        </div>
      </div>
    </div>
  );
}
