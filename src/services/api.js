// 📁 src/api/api.js

import { API_PATHS } from "../config/apiPaths";
import { API_BASE_URL } from "../config/apiConfig";

export { API_BASE_URL };

let isRefreshing = false;
let refreshPromise = null;

// ============================
// 🔁 REFRESH TOKEN REQUEST
// ============================
async function refreshTokenRequest() {

  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`${API_BASE_URL}${API_PATHS.AUTH_REFRESH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok) {
    throw new Error("Refresh inválido");
  }

  const data = await res.json();

  // 🔥 IMPORTANTE: actualizar ambos tokens (ROTACIÓN)
  localStorage.setItem("token", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

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
        localStorage.clear();
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
