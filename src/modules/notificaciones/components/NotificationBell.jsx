import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  contarNotificacionesNoLeidas,
  marcarNotificacionLeida,
  obtenerNotificaciones,
} from "../services/notificaciones";
import "./NotificationBell.css";

const iconos = {
  INFORMACION: "bi-info-circle text-primary",
  ACCION_REQUERIDA: "bi-exclamation-circle text-warning",
  EXITO: "bi-check-circle text-success",
  ALERTA: "bi-x-circle text-danger",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [conteo, setConteo] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarConteo = useCallback(async () => {
    try {
      const data = await contarNotificacionesNoLeidas();
      setConteo(data.noLeidas || 0);
    } catch {
      // La campana no debe interrumpir la navegación si el contador falla.
    }
  }, []);

  const cargarRecientes = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerNotificaciones({ page: 0, size: 8 });
      setNotificaciones(data.content || []);
    } catch {
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConteo();
    const timer = window.setInterval(cargarConteo, 60000);
    const refrescar = () => cargarConteo();
    window.addEventListener("notificaciones:actualizar", refrescar);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("notificaciones:actualizar", refrescar);
    };
  }, [cargarConteo]);

  useEffect(() => {
    const cerrar = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const alternar = async () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) await cargarRecientes();
  };

  const abrirNotificacion = async (item) => {
    if (!item.leida) {
      await marcarNotificacionLeida(item.id);
      setConteo((actual) => Math.max(actual - 1, 0));
    }
    setAbierto(false);
    navigate(item.ruta || "/notificaciones");
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button type="button" className="notification-bell__button" onClick={alternar} aria-label={`Notificaciones, ${conteo} sin leer`} title="Notificaciones">
        <i className="bi bi-bell"></i>
        {conteo > 0 ? <span className="notification-bell__count">{conteo > 99 ? "99+" : conteo}</span> : null}
      </button>

      {abierto ? (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <div><strong>Notificaciones</strong><small>{conteo} sin leer</small></div>
            <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={() => { setAbierto(false); navigate("/notificaciones"); }}>Ver todas</button>
          </div>
          <div className="notification-bell__list">
            {cargando ? <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div> :
              notificaciones.length === 0 ? <div className="text-center text-muted py-4"><i className="bi bi-bell-slash d-block fs-3 mb-2"></i>Sin notificaciones</div> :
                notificaciones.map((item) => (
                  <button type="button" key={item.id} className={`notification-item ${item.leida ? "" : "notification-item--unread"}`} onClick={() => abrirNotificacion(item)}>
                    <i className={`bi ${iconos[item.tipo] || iconos.INFORMACION}`}></i>
                    <span>
                      <strong>{item.titulo}</strong>
                      <small>{item.mensaje}</small>
                      <time>{new Date(item.fechaCreacion).toLocaleString("es-MX")}</time>
                    </span>
                  </button>
                ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
