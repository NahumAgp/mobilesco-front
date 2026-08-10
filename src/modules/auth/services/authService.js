import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================
// LOGIN
// ============================
export async function login(credentials) {

  const data = await request(API_PATHS.AUTH_LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  // 🔥 GUARDAR TOKENS AQUÍ (IMPORTANTE)
  localStorage.setItem("token", data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }

  return data;
}

// ============================
// REGISTRO POR INVITACION
// ============================
export async function registerWithInvitation(payload) {
  return request(API_PATHS.AUTH_REGISTER, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ============================
// OBTENER USUARIO ACTUAL
// ============================
export function getCurrentUser() {
  return request(API_PATHS.AUTH_ME);
}

// ============================
// ROLES DISPONIBLES
// ============================
export function getAvailableRoles() {
  return request(API_PATHS.AUTH_ROLES);
}

export function getPermissions() {
  return request(API_PATHS.AUTH_PERMISOS);
}

export function getRolesConfig(params = {}) {
  return request(`${API_PATHS.AUTH_ROLES_CONFIG}${buildQuery(params)}`);
}

export function createRole(payload) {
  return request(API_PATHS.AUTH_ROLES_CONFIG, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRole(id, payload) {
  return request(`${API_PATHS.AUTH_ROLES_CONFIG}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getAccessUsers(params = {}) {
  return request(`${API_PATHS.AUTH_USUARIOS}${buildQuery(params)}`);
}

export function createAccessUser(payload) {
  return request(API_PATHS.AUTH_USUARIOS, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAccessUser(id, payload) {
  return request(`${API_PATHS.AUTH_USUARIOS}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deactivateAccessUser(id) {
  return request(`${API_PATHS.AUTH_USUARIOS}/${id}/desactivar`, {
    method: "POST"
  });
}

export function hasPermission(user, permission) {
  if (!permission) {
    return true;
  }

  const roles = user?.roles || [];
  if (roles.includes("ADMIN")) {
    return true;
  }

  return (user?.permisos || []).includes(permission);
}

// ============================
// INVITACIONES
// ============================
export function createInvitation(payload) {
  return request(API_PATHS.AUTH_INVITACIONES, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getPendingUsers(params = {}) {
  return request(`${API_PATHS.AUTH_PENDIENTES}${buildQuery(params)}`);
}

export function approvePendingUser(id) {
  return request(`${API_PATHS.AUTH_PENDIENTES}/${id}/aprobar`, {
    method: "POST"
  });
}


// ============================
// LOGOUT
// ============================
export async function logout() {

  const refreshToken = localStorage.getItem("refreshToken");
  const csrfToken = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.slice("XSRF-TOKEN=".length);

  try {
    await request(API_PATHS.AUTH_LOGOUT, {
      method: "POST",
      headers: csrfToken
        ? { "X-CSRF-TOKEN": decodeURIComponent(csrfToken) }
        : {},
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined
    });

  } catch (error) {

    console.warn("Error en logout backend:", error);

  }

  // limpiar sesión local
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  window.location.href = "/login"; // 🔥 agregado
}


// ============================
// TOKEN
// ============================
export function getToken() {
  return localStorage.getItem("token");
}


// ============================
// USUARIO LOCAL
// ============================
export function getUser() {

  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;

}


// ============================
// AUTENTICACIÓN
// ============================
export function isAuthenticated() {

  const token = localStorage.getItem("token");

  if (!token || token === "null" || token === "undefined") {
    return false;
  }

  return true;

}
