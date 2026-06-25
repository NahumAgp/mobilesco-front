import request from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

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
  localStorage.setItem("refreshToken", data.refreshToken);

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

export function getRolesConfig() {
  return request(API_PATHS.AUTH_ROLES_CONFIG);
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

export function getAccessUsers() {
  return request(API_PATHS.AUTH_USUARIOS);
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
  if (roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN")) {
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

export function getPendingUsers() {
  return request(API_PATHS.AUTH_PENDIENTES);
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

  try {

    if (refreshToken) {

      await request(API_PATHS.AUTH_LOGOUT, {
        method: "POST",
        body: JSON.stringify({
          refreshToken
        })
      });

    }

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
