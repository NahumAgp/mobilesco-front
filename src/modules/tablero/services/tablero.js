import request from "../../../services/api";
import { API_BASE_URL } from "../../../services/api";
import { API_PATHS } from "../../../config/apiPaths";

export const obtenerResumenTablero = (periodo = "MES") =>
  request(`${API_PATHS.TABLERO}/resumen?periodo=${encodeURIComponent(periodo)}`);

const esperar = (ms, signal) => new Promise((resolve) => {
  const timeout = setTimeout(resolve, ms);
  signal.addEventListener("abort", () => { clearTimeout(timeout); resolve(); }, { once: true });
});

export function conectarEventosTablero({ onConnect, onChange, onDisconnect }) {
  const controller = new AbortController();
  const { signal } = controller;

  const escuchar = async () => {
    let demora = 1000;
    while (!signal.aborted) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_PATHS.TABLERO}/eventos`, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          credentials: "include",
          cache: "no-store",
          signal,
        });
        if (response.status === 401 || response.status === 403) {
          await obtenerResumenTablero(); // Renueva la sesión con el flujo de autenticación existente.
          throw new Error("Sesión renovada; reconectando eventos");
        }
        if (!response.ok || !response.body) throw new Error("No se pudo conectar al tablero");
        demora = 1000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pendiente = "";
        while (!signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          pendiente += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
          const eventos = pendiente.split("\n\n");
          pendiente = eventos.pop() || "";
          for (const evento of eventos) {
            if (evento.includes("event:conectado") || evento.includes("event: conectado")) onConnect();
            if (evento.includes("event:cambio") || evento.includes("event: cambio")) onChange();
          }
        }
      } catch {
        if (signal.aborted) break;
      }
      if (signal.aborted) break;
      onDisconnect();
      await esperar(demora, signal);
      demora = Math.min(demora * 2, 30000);
    }
  };
  void escuchar();
  return () => controller.abort();
}
