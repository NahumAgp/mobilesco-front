import { useEffect, useState } from "react";

const STORAGE_PREFIX = "mobilesco:state:";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function readPersistedState(key, fallback) {
  if (!key || !canUseSessionStorage()) return fallback;

  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);

    if (
      fallback &&
      typeof fallback === "object" &&
      !Array.isArray(fallback) &&
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return { ...fallback, ...parsed };
    }

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export default function usePersistedState(key, fallback) {
  const [state, setState] = useState(() => readPersistedState(key, fallback));

  useEffect(() => {
    if (!key || !canUseSessionStorage()) return;

    try {
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
    } catch {
      // La pantalla sigue funcionando aunque el navegador bloquee sessionStorage.
    }
  }, [key, state]);

  return [state, setState];
}
