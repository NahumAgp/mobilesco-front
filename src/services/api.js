// 📁 src/api/api.js

import { API_PATHS } from "../config/apiPaths";
import { API_BASE_URL } from "../config/apiConfig";

export { API_BASE_URL };

let isRefreshing = false;
let refreshPromise = null;

function getCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

async function syncCurrentUserSnapshot(accessToken) {
  const response = await fetch(`${API_BASE_URL}${API_PATHS.AUTH_ME}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("No se pudo sincronizar el usuario actual");
  }

  const user = await response.json();
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("userUpdated"));
}

// ============================
// 🔁 REFRESH TOKEN REQUEST
// ============================
async function refreshTokenRequest() {

  const refreshToken = localStorage.getItem("refreshToken");
  const csrfToken = getCookie("XSRF-TOKEN");

  const res = await fetch(`${API_BASE_URL}${API_PATHS.AUTH_REFRESH}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {})
    },
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined
  });

  if (!res.ok) {
    throw new Error("Refresh inválido");
  }

  const data = await res.json();

  // 🔥 IMPORTANTE: actualizar ambos tokens (ROTACIÓN)
  localStorage.setItem("token", data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }

  try {
    await syncCurrentUserSnapshot(data.accessToken);
  } catch (error) {
    console.warn("No se pudo actualizar el usuario local tras renovar la sesion:", error);
  }

  return data.accessToken;
}


// ============================
// 🌐 REQUEST PRINCIPAL
// ============================
async function request(endpoint, options = {}, retry = true) {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const config = {
    ...options,
    credentials: "include",
    headers
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // 🔥 Detectar endpoints públicos (IMPORTANTE)
  const isAuthEndpoint =
    url.includes("/auth/login") ||
    url.includes("/auth/refresh");

  try {

    const response = await fetch(url, config);

    // ============================
    // 🔥 MANEJO DE TOKEN EXPIRADO
    // ============================
    if ((response.status === 401 || response.status === 403) && retry && !isAuthEndpoint) {

      try {

        // evitar múltiples refresh simultáneos
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshTokenRequest();
        }

        await refreshPromise;
        isRefreshing = false;

        // 🔁 reintentar request original
        return request(endpoint, options, false);

      } catch (err) {

        isRefreshing = false;

        // 💥 logout automático si falla refresh
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";

        throw err;
      }
    }

    if (response.ok && options.responseType === "blob") {
      return await response.blob();
    }

    const text = await response.text();

    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const requestError = new Error(
        data?.message ||
        data?.error ||
        "Error del servidor"
      );
      if (data && typeof data === "object") {
        requestError.data = data;
        requestError.errors = data.errors;
        requestError.status = data.status || response.status;
      }
      throw requestError;
    }

    return data;

  } catch (error) {
    console.error("❌ Error en request:", error);
    throw error;
  }
}

export default request;
