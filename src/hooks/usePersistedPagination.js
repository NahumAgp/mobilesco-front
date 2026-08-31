import { useEffect } from "react";

const STORAGE_PREFIX = "mobilesco:pagination:";

function normalizePage(page) {
  const numericPage = Number(page);
  if (!Number.isFinite(numericPage) || numericPage < 0) return 0;
  return Math.floor(numericPage);
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function getInitialPaginationPage(key) {
  if (!key || !canUseSessionStorage()) return 0;

  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return normalizePage(stored);
  } catch {
    return 0;
  }
}

export function usePersistedPagination(key, page) {
  useEffect(() => {
    if (!key || !canUseSessionStorage()) return;

    try {
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, String(normalizePage(page)));
    } catch {
      // La paginacion sigue funcionando aunque el navegador bloquee sessionStorage.
    }
  }, [key, page]);
}
