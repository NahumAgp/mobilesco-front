import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerNotificaciones,
} from "../services/notificaciones";

const tipoClase = {
  INFORMACION: "text-bg-primary",
  ACCION_REQUERIDA: "text-bg-warning",
  EXITO: "text-bg-success",
  ALERTA: "text-bg-danger",
};

export default function NotificacionesPage() {
  const navigate = useNavigate();
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [page, setPage] = useState(0);
  const [resultado, setResultado] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setResultado(await obtenerNotificaciones({
        page,
        size: 20,
        leida: soloNoLeidas ? false : "",
      }));
    } catch (err) {
      setError(err?.message || "No fue posible cargar las notificaciones");
    } finally {
      setCargando(false);
    }
  }, [page, soloNoLeidas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrir = async (item) => {
    if (!item.leida) await marcarNotificacionLeida(item.id);
    window.dispatchEvent(new Event("notificaciones:actualizar"));
    if (item.ruta) navigate(item.ruta);
    else cargar();
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasNotificacionesLeidas();
      window.dispatchEvent(new Event("notificaciones:actualizar"));
      await cargar();
    } catch (err) {
      setError(err?.message || "No fue posible marcar las notificaciones");
    }
  };

  const cambiarFiltro = (event) => {
    setSoloNoLeidas(event.target.checked);
    setPage(0);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <h2 className="mb-1">Notificaciones</h2>
          <p className="text-muted mb-0">Avisos relacionados con tus responsabilidades dentro del ERP.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={marcarTodas}>
          <i className="bi bi-check2-all me-2"></i>Marcar todas como leídas
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <span>{resultado.totalElements || 0} notificaciones</span>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" id="soloNoLeidas" checked={soloNoLeidas} onChange={cambiarFiltro} />
            <label className="form-check-label" htmlFor="soloNoLeidas">Sólo no leídas</label>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card border-0 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : resultado.content.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>No hay notificaciones
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {resultado.content.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`list-group-item list-group-item-action p-3 ${item.leida ? "" : "bg-primary-subtle"}`}
                onClick={() => abrir(item)}
              >
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <strong>{item.titulo}</strong>
                      <span className={`badge ${tipoClase[item.tipo] || "text-bg-secondary"}`}>
                        {item.tipo.replaceAll("_", " ")}
                      </span>
                      {!item.leida ? <span className="badge rounded-pill text-bg-danger">Nueva</span> : null}
                    </div>
                    <p className="mb-1">{item.mensaje}</p>
                    <small className="text-muted">
                      {item.modulo || "Sistema"} · {new Date(item.fechaCreacion).toLocaleString("es-MX")}
                    </small>
                  </div>
                  {item.ruta ? <i className="bi bi-chevron-right align-self-center"></i> : null}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <small className="text-muted">Página {page + 1} de {Math.max(resultado.totalPages, 1)}</small>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page + 1 >= resultado.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
