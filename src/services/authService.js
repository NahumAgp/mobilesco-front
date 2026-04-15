import request from "./api";
import { API_PATHS } from "../config/apiPaths";

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
// OBTENER USUARIO ACTUAL
// ============================
export function getCurrentUser() {
  return request(API_PATHS.AUTH_ME);
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