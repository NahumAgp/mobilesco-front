function normalizeApiBaseUrl(value) {
  const raw = (value || '').trim().replace(/\/+$/, '');
  return raw.replace(/\/api\/v1$/i, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
