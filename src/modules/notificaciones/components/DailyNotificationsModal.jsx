import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marcarNotificacionLeida, obtenerNotificaciones } from "../services/notificaciones";
import "./DailyNotificationsModal.css";

const STORAGE_PREFIX = "mobilesco:daily-notifications:";

function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function wasDismissedToday(userId) {
  try {
    return window.localStorage.getItem(storageKey(userId)) === localDay();
  } catch {
    return false;
  }
}

export default function DailyNotificationsModal({ userId }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);
  const [open, setOpen] = useState(() => Boolean(userId && !wasDismissedToday(userId)));
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    const checkNewDay = () => {
      if (!open && !wasDismissedToday(userId)) {
        setLoading(true);
        setOpen(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkNewDay();
    };
    window.addEventListener("focus", checkNewDay);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", checkNewDay);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    obtenerNotificaciones({ page: 0, size: 20 })
      .then((data) => {
        if (!active) return;
        setItems(data.content || []);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "No fue posible cargar tus notificaciones.");
      })
      .finally(() => { if (active) setLoading(false); });
    closeRef.current?.focus();
    return () => { active = false; };
  }, [open, retry]);

  if (!open) return null;

  const close = () => {
    try {
      window.localStorage.setItem(storageKey(userId), localDay());
    } catch {
      // La ventana puede cerrarse aunque el almacenamiento no esté disponible.
    }
    setOpen(false);
  };

  const openItem = async (item) => {
    if (!item.leida) {
      try {
        await marcarNotificacionLeida(item.id);
        window.dispatchEvent(new Event("notificaciones:actualizar"));
      } catch {
        // La navegación sigue disponible si falla la actualización de lectura.
      }
    }
    close();
    navigate(item.ruta || "/notificaciones");
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...event.currentTarget.querySelectorAll("button:not([disabled])")];
    if (!buttons.length) return;
    if (event.shiftKey && document.activeElement === buttons[0]) {
      event.preventDefault();
      buttons.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
      event.preventDefault();
      buttons[0].focus();
    }
  };

  return (
    <div className="daily-notifications-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="daily-notifications-dialog" role="dialog" aria-modal="true" aria-labelledby="daily-notifications-title"
        onKeyDown={handleDialogKeyDown}>
        <header className="daily-notifications-header">
          <div>
            <span className="daily-notifications-eyebrow">Resumen diario</span>
            <h2 id="daily-notifications-title">Tus notificaciones</h2>
          </div>
          <button ref={closeRef} type="button" className="daily-notifications-close" aria-label="Cerrar notificaciones" onClick={close}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>
        <div className="daily-notifications-content">
          {loading ? <p role="status">Cargando notificaciones...</p> : error ? (
            <div role="alert"><p>{error}</p><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { setLoading(true); setRetry((current) => current + 1); }}>Reintentar</button></div>
          ) : items.length ? items.map((item) => (
            <button type="button" key={item.id} className={`daily-notifications-item${item.leida ? "" : " is-unread"}`} onClick={() => openItem(item)}>
              <span><strong>{item.titulo}</strong><small>{item.mensaje}</small></span>
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          )) : <p className="daily-notifications-empty">Hoy no tienes notificaciones.</p>}
        </div>
        <footer className="daily-notifications-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={close}>Continuar</button>
          <button type="button" className="btn btn-primary" onClick={() => { close(); navigate("/notificaciones"); }}>Ver todas</button>
        </footer>
      </section>
    </div>
  );
}
