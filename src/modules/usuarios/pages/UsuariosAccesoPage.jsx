import React, { useEffect, useMemo, useState } from "react";

import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import {
  createInvitation,
  createRole,
  deactivateAccessUser,
  getAccessUsers,
  getAvailableRoles,
  getPermissions,
  getRolesConfig,
  updateRole
} from "../../auth/services/authService";

import "./UsuariosAccesoPage.css";

const PAGE_SIZE_ROLES = 6;
const PAGE_SIZE_USERS = 10;
const PAGE_INFO_ROLES_DEFAULT = {
  page: 0,
  size: PAGE_SIZE_ROLES,
  totalElements: 0,
  totalPages: 0
};
const PAGE_INFO_USERS_DEFAULT = {
  page: 0,
  size: PAGE_SIZE_USERS,
  totalElements: 0,
  totalPages: 0
};

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

function formatDateTime(value) {
  if (!value) {
    return "Sin registro";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getUserFullName(usuario) {
  return [usuario.nombre, usuario.apellidoPaterno, usuario.apellidoMaterno].filter(Boolean).join(" ") || "-";
}

function groupPermissionsByModule(permisos = []) {
  return permisos.reduce((acc, permiso) => {
    const modulo = permiso.modulo || "General";
    if (!acc[modulo]) {
      acc[modulo] = [];
    }
    acc[modulo].push(permiso);
    return acc;
  }, {});
}

export default function UsuariosAccesoPage() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [roles, setRoles] = useState([]);
  const [rolesConfig, setRolesConfig] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [invitacion, setInvitacion] = useState(initialInvitation);
  const [nuevoRol, setNuevoRol] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenGenerado, setTokenGenerado] = useState("");
  const [busquedaRoles, setBusquedaRoles] = useState("");
  const [pageRoles, setPageRoles] = useState(0);
  const [pageInfoRoles, setPageInfoRoles] = useState(PAGE_INFO_ROLES_DEFAULT);
  const [pageUsuarios, setPageUsuarios] = useState(0);
  const [pageInfoUsuarios, setPageInfoUsuarios] = useState(PAGE_INFO_USERS_DEFAULT);
  const [mostrarNuevoRol, setMostrarNuevoRol] = useState(false);
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null);
  const [moduloExpandido, setModuloExpandido] = useState("");

  const permisosPorModulo = useMemo(() => groupPermissionsByModule(permisos), [permisos]);

  const modulosPermisos = useMemo(() => {
    return Object.entries(permisosPorModulo).sort(([a], [b]) =>
      a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })
    );
  }, [permisosPorModulo]);

  const rolesPagina = rolesConfig;
  const totalRolesFiltrados = pageInfoRoles.totalElements || 0;
  const totalPagesRoles = pageInfoRoles.totalPages || 0;
  const paginaRolesActual = totalPagesRoles > 0 ? Math.min(pageRoles, totalPagesRoles - 1) : 0;
  const totalUsuarios = pageInfoUsuarios.totalElements || 0;
  const totalPagesUsuarios = pageInfoUsuarios.totalPages || 0;
  const paginaUsuariosActual = totalPagesUsuarios > 0 ? Math.min(pageUsuarios, totalPagesUsuarios - 1) : 0;

  const rolSeleccionado = useMemo(() => {
    if (!rolSeleccionadoId) {
      return null;
    }

    return rolesConfig.find((rol) => String(rol.id) === String(rolSeleccionadoId)) || null;
  }, [rolesConfig, rolSeleccionadoId]);

  useEffect(() => {
    if (totalPagesRoles > 0 && pageRoles >= totalPagesRoles) {
      setPageRoles(totalPagesRoles - 1);
    }
  }, [pageRoles, totalPagesRoles]);

  useEffect(() => {
    if (totalPagesUsuarios > 0 && pageUsuarios >= totalPagesUsuarios) {
      setPageUsuarios(totalPagesUsuarios - 1);
    }
  }, [pageUsuarios, totalPagesUsuarios]);

  useEffect(() => {
    if (!modulosPermisos.length) {
      return;
    }

    const moduloValido = modulosPermisos.some(([modulo]) => modulo === moduloExpandido);
    if (!moduloValido) {
      setModuloExpandido(modulosPermisos[0][0]);
    }
  }, [moduloExpandido, modulosPermisos]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const [rolesResponse, rolesConfigResponse, permisosResponse, usuariosResponse] = await Promise.all([
        getAvailableRoles(),
        getRolesConfig({
          page: pageRoles,
          size: PAGE_SIZE_ROLES,
          busqueda: busquedaRoles,
          sortBy: "name",
          direction: "asc"
        }),
        getPermissions(),
        getAccessUsers({
          page: pageUsuarios,
          size: PAGE_SIZE_USERS,
          sortBy: "correo",
          direction: "asc"
        })
      ]);

      setRoles(Array.isArray(rolesResponse) ? rolesResponse : []);
      setRolesConfig(Array.isArray(rolesConfigResponse?.content) ? rolesConfigResponse.content : Array.isArray(rolesConfigResponse) ? rolesConfigResponse : []);
      setPageInfoRoles(rolesConfigResponse?.content ? {
        page: rolesConfigResponse.page ?? pageRoles,
        size: rolesConfigResponse.size ?? PAGE_SIZE_ROLES,
        totalElements: rolesConfigResponse.totalElements ?? 0,
        totalPages: rolesConfigResponse.totalPages ?? 0
      } : PAGE_INFO_ROLES_DEFAULT);
      setPermisos(Array.isArray(permisosResponse) ? permisosResponse : []);
      setUsuarios(Array.isArray(usuariosResponse?.content) ? usuariosResponse.content : Array.isArray(usuariosResponse) ? usuariosResponse : []);
      setPageInfoUsuarios(usuariosResponse?.content ? {
        page: usuariosResponse.page ?? pageUsuarios,
        size: usuariosResponse.size ?? PAGE_SIZE_USERS,
        totalElements: usuariosResponse.totalElements ?? 0,
        totalPages: usuariosResponse.totalPages ?? 0
      } : PAGE_INFO_USERS_DEFAULT);
    } catch (err) {
      setError(err.message || "No se pudo cargar la administracion de accesos.");
      setPageInfoRoles(PAGE_INFO_ROLES_DEFAULT);
      setPageInfoUsuarios(PAGE_INFO_USERS_DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [pageRoles, busquedaRoles, pageUsuarios]);

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
      setTokenGenerado(response?.token || "");
      setInvitacion(initialInvitation);
      showSuccess("Invitacion creada. Comparte el token con la persona invitada.");
    } catch (err) {
      showError(err, "No se pudo crear la invitacion.");
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
      const response = await createRole(nuevoRol);
      setNuevoRol(initialRole);
      setMostrarNuevoRol(false);
      await cargarDatos();
      if (response?.id) {
        setRolSeleccionadoId(response.id);
      }
      setPageRoles(0);
      showSuccess("Rol creado correctamente.");
    } catch (err) {
      showError(err, "No se pudo crear el rol.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarRol = (rol) => {
    setRolSeleccionadoId(rol.id);
    if (modulosPermisos.length > 0) {
      setModuloExpandido(modulosPermisos[0][0]);
    }
  };

  const handleRolDescripcionChange = (rolId, value) => {
    setRolesConfig((prev) =>
      prev.map((rol) => (rol.id === rolId ? { ...rol, descripcion: value } : rol))
    );
  };

  const handleRolPermisoToggle = (rolId, permisoCode) => {
    setRolesConfig((prev) =>
      prev.map((rol) =>
        rol.id === rolId
          ? { ...rol, permisos: toggleValue(rol.permisos || [], permisoCode) }
          : rol
      )
    );
  };

  const renderPermissionGroups = (selectedCodes, onToggle) => (
    <div className="accordion roles-permissions-accordion" id="rolesPermissionsAccordion">
      {modulosPermisos.map(([modulo, items], index) => {
        const isOpen = moduloExpandido ? moduloExpandido === modulo : index === 0;
        const selectedInModule = items.filter((item) => (selectedCodes || []).includes(item.code)).length;

        return (
          <div className="accordion-item" key={modulo}>
            <h2 className="accordion-header">
              <button
                type="button"
                className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                onClick={() =>
                  setModuloExpandido((prev) => (prev === modulo ? "" : modulo))
                }
              >
                <span>{modulo}</span>
                <span className="roles-module-count ms-2">{selectedInModule}/{items.length}</span>
              </button>
            </h2>
            <div className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}>
              <div className="accordion-body">
                <div className="roles-permissions-grid">
                  {items.map((permiso) => (
                    <label key={permiso.code} className="form-check roles-permission-item">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={(selectedCodes || []).includes(permiso.code)}
                        onChange={() => onToggle(permiso.code)}
                      />
                      <span className="form-check-label">{permiso.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleBusquedaRoles = (event) => {
    setBusquedaRoles(event.target.value);
    setPageRoles(0);
  };

  const limpiarBusquedaRoles = () => {
    setBusquedaRoles("");
    setPageRoles(0);
  };

  const openNuevoRol = () => {
    setActiveTab("roles");
    setRolSeleccionadoId(null);
    setMostrarNuevoRol(true);
  };

  const handleVolverListadoRoles = () => {
    setRolSeleccionadoId(null);
  };

  const resumenRoles = totalRolesFiltrados > 0
    ? `Mostrando ${rolesPagina.length} de ${totalRolesFiltrados} roles`
    : "Sin roles para mostrar";

  return (
    <div className="container-xxl py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Usuarios, roles y permisos</h1>
          <p className="text-muted mb-0">Administra accesos, visibilidad de vistas e invitaciones del sistema.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-success" onClick={cargarDatos} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualizar
          </button>
          <button type="button" className="btn btn-success" onClick={openNuevoRol}>
            <i className="bi bi-plus-lg me-2"></i>
            Nuevo rol
          </button>
        </div>
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
              <div className="col-12">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Roles</th>
                        <th>Acceso desde</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.idUsuario}>
                          <td>
                            <div className="fw-semibold">{getUserFullName(usuario)}</div>
                          </td>
                          <td>{usuario.correo}</td>
                          <td>{usuario.roles?.length ? usuario.roles.join(", ") : "Sin roles"}</td>
                          <td>{formatDateTime(usuario.accessGrantedAt)}</td>
                          <td>
                            <span className={`badge ${usuario.enabled && !usuario.locked ? "text-bg-success" : "text-bg-secondary"}`}>
                              {usuario.estadoCuenta || "SIN_ESTADO"}
                            </span>
                          </td>
                          <td className="text-end">
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
                {totalUsuarios > 0 && (
                  <CatalogPagination
                    currentPage={paginaUsuariosActual}
                    totalPages={totalPagesUsuarios}
                    totalElements={totalUsuarios}
                    pageSize={PAGE_SIZE_USERS}
                    currentCount={usuarios.length}
                    itemLabel="usuarios"
                    ariaLabel="Paginacion de usuarios"
                    onPageChange={setPageUsuarios}
                    className="mt-3"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="d-grid gap-4">
              {rolSeleccionado ? (
                <div className="card roles-editor-card">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <button
                          type="button"
                          className="btn btn-link px-0 text-decoration-none text-success mb-2"
                          onClick={handleVolverListadoRoles}
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Volver a roles
                        </button>
                        <h2 className="h5 mb-1">{rolSeleccionado.name}</h2>
                        <div className="text-muted small">
                          Edita la descripcion y los permisos del rol seleccionado.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => handleGuardarRol(rolSeleccionado)}
                        disabled={loading}
                      >
                        Guardar permisos
                      </button>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-lg-4">
                        <label className="form-label">Nombre</label>
                        <input className="form-control" value={rolSeleccionado.name} disabled />
                        <div className="form-text">El nombre solo se define al crear el rol.</div>
                      </div>
                      <div className="col-12 col-lg-8">
                        <label className="form-label">Descripcion</label>
                        <input
                          className="form-control"
                          value={rolSeleccionado.descripcion || ""}
                          onChange={(event) =>
                            handleRolDescripcionChange(rolSeleccionado.id, event.target.value)
                          }
                          placeholder="Descripcion del rol"
                        />
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                      <div>
                        <div className="fw-semibold">Permisos</div>
                        <div className="text-muted small">
                          Los permisos estan agrupados por modulo. Haz clic en cada modulo para desplegarlo.
                        </div>
                      </div>
                      <span className="badge text-bg-light border">
                        {rolSeleccionado.permisos?.length || 0} seleccionados
                      </span>
                    </div>

                    {renderPermissionGroups(rolSeleccionado.permisos, (code) =>
                      handleRolPermisoToggle(rolSeleccionado.id, code)
                    )}
                  </div>
                </div>
              ) : (
                <>
              <div className="card roles-create-card">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                      <h2 className="h5 mb-1">Nuevo rol</h2>
                      <p className="text-muted mb-0">
                        Crea el rol primero y luego ajusta sus permisos desde la tabla.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => setMostrarNuevoRol((prev) => !prev)}
                    >
                      {mostrarNuevoRol ? "Ocultar formulario" : "Abrir formulario"}
                    </button>
                  </div>

                  {mostrarNuevoRol && (
                    <form className="row g-3 align-items-end mt-2" onSubmit={handleCrearRol}>
                      <div className="col-12 col-lg-4">
                        <label className="form-label">Nombre</label>
                        <input
                          className="form-control"
                          value={nuevoRol.name}
                          onChange={(event) => setNuevoRol((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Ej. COMPRAS_AUDITOR"
                          required
                        />
                      </div>
                      <div className="col-12 col-lg-6">
                        <label className="form-label">Descripcion</label>
                        <input
                          className="form-control"
                          value={nuevoRol.descripcion}
                          onChange={(event) => setNuevoRol((prev) => ({ ...prev, descripcion: event.target.value }))}
                          placeholder="Responsabilidad del rol"
                        />
                      </div>
                      <div className="col-12 col-lg-2 d-grid">
                        <button type="submit" className="btn btn-success" disabled={loading}>
                          Crear rol
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="card roles-filters-card">
                <div className="card-body">
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-8">
                      <div className="input-group roles-search-group">
                        <span className="input-group-text bg-white">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control roles-search-input"
                          placeholder="Buscar rol por nombre..."
                          value={busquedaRoles}
                          onChange={handleBusquedaRoles}
                        />
                        {busquedaRoles && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={limpiarBusquedaRoles}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-12 col-md-4 d-flex justify-content-md-end">
                      <span className="badge rounded-pill text-bg-light border roles-summary-pill">
                        {resumenRoles}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!loading && !error && totalRolesFiltrados === 0 ? (
                <div className="card shadow-sm border-0 roles-empty-card">
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-shield-lock fs-1 d-block mb-3 text-secondary"></i>
                    <span className="fs-5 d-block">
                      {busquedaRoles ? "No hay coincidencias" : "No hay roles registrados"}
                    </span>
                    <p className="text-secondary mt-2 mb-0">
                      {busquedaRoles
                        ? "Ajusta la busqueda para encontrar el rol que necesitas."
                        : "Crea el primer rol para empezar a administrar permisos."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="roles-page-shell">
                  <div className="card shadow-sm border-0 roles-table-card">
                    <div className="table-responsive roles-table-scroll">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light roles-table-head">
                          <tr>
                            <th>Rol</th>
                            <th>Descripcion</th>
                            <th>Permisos</th>
                            <th>Tipo</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rolesPagina.map((rol) => {
                            const estaSeleccionado = String(rolSeleccionadoId) === String(rol.id);

                            return (
                              <tr
                                key={rol.id}
                                className={`roles-table-row ${estaSeleccionado ? "is-selected" : ""}`}
                                onClick={() => handleSeleccionarRol(rol)}
                                role="button"
                                aria-selected={estaSeleccionado}
                              >
                                <td>
                                  <div className="fw-semibold">{rol.name}</div>
                                  <div className="text-muted small">Haz clic para editar permisos</div>
                                </td>
                                <td>
                                  <div className="roles-description-cell">
                                    {rol.descripcion || "Sin descripcion"}
                                  </div>
                                </td>
                                <td>
                                  <span className="badge text-bg-light border">
                                    {rol.permisos?.length || 0} permisos
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${rol.sistema ? "text-bg-secondary" : "text-bg-success"}`}>
                                    {rol.sistema ? "Sistema" : "Personalizado"}
                                  </span>
                                </td>
                                <td className="text-end roles-table-actions">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSeleccionarRol(rol);
                                    }}
                                  >
                                    Editar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {totalRolesFiltrados > 0 && (
                    <CatalogPagination
                      currentPage={paginaRolesActual}
                      totalPages={totalPagesRoles}
                      totalElements={totalRolesFiltrados}
                      pageSize={PAGE_SIZE_ROLES}
                      currentCount={rolesPagina.length}
                      itemLabel="roles"
                      summary={busquedaRoles ? `Mostrando ${rolesPagina.length} coincidencias en esta pagina` : undefined}
                      ariaLabel="Paginacion de roles"
                      onPageChange={setPageRoles}
                      className="roles-pagination-panel"
                    />
                  )}

                </div>
              )}
              </>
              )}
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
                          required={name !== "apellidoMaterno"}
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
                        {roles.filter((rol) => rol !== "ADMIN" && rol !== "EMPLOYEE").map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
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
