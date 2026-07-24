import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getUser } from "../../../auth/services/authService";
import { cambiarEstadoRequisicion, obtenerRequisicion } from "../services/requisiciones";

const estadoClase = {
  ENVIADA: "text-bg-primary",
  EN_REVISION: "text-bg-warning",
  AUTORIZADA: "text-bg-success",
  RECHAZADA: "text-bg-danger",
  CANCELADA: "text-bg-secondary",
};

export default function RequisicionDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roles = getUser()?.roles || [];
  const puedeResolver = roles.some((rol) => ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"].includes(rol));
  const [requisicion, setRequisicion] = useState(null);
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setRequisicion(await obtenerRequisicion(id));
    } catch (err) {
      setError(err?.message || "No fue posible cargar la requisición");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (estado) => {
    if (estado === "RECHAZADA" && !comentario.trim()) {
      setError("Captura el motivo del rechazo.");
      return;
    }
    try {
      setProcesando(true);
      setError("");
      setRequisicion(await cambiarEstadoRequisicion(id, estado, comentario));
      setComentario("");
    } catch (err) {
      setError(err?.message || "No fue posible cambiar el estado");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="container py-5 text-center"><div className="spinner-border text-primary" /></div>;
  if (!requisicion) return <div className="container py-5"><div className="alert alert-danger">{error || "Requisición no encontrada"}</div></div>;

  const abierta = ["ENVIADA", "EN_REVISION"].includes(requisicion.estado);

  return (
    <div className="container-fluid py-4">
      <button className="btn btn-link px-0 text-decoration-none" onClick={() => navigate("/almacen/requisiciones")}><i className="bi bi-arrow-left me-2"></i>Volver</button>
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div><h2 className="mb-1">{requisicion.folio}</h2><p className="text-muted mb-0">Enviada por {requisicion.solicitanteNombre} el {new Date(requisicion.fechaEnvio).toLocaleString("es-MX")}</p></div>
        <span className={`badge fs-6 ${estadoClase[requisicion.estado] || "text-bg-light"}`}>{requisicion.estadoEtiqueta}</span>
      </div>
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3"><h5 className="mb-0">Insumos solicitados</h5></div>
            <div className="table-responsive"><table className="table align-middle mb-0">
              <thead className="table-light"><tr><th>Código</th><th>Insumo</th><th>Cantidad</th><th>Stock al solicitar</th><th>Mínimo al solicitar</th><th>Origen</th></tr></thead>
              <tbody>{requisicion.partidas.map((item) => <tr key={item.id}>
                <td>{item.insumoCodigo}</td><td><div className="fw-semibold">{item.insumoNombre}</div><small className="text-muted">{item.observaciones || ""}</small></td>
                <td className="fw-semibold">{item.cantidadSolicitada} {item.unidadSimbolo || ""}</td><td>{item.stockActualSnapshot}</td><td>{item.stockMinimoSnapshot ?? "Sin mínimo"}</td>
                <td>{item.origenSugerencia ? <span className="badge text-bg-warning">Sugerencia</span> : <span className="badge text-bg-light">Búsqueda</span>}</td>
              </tr>)}</tbody>
            </table></div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm mb-4"><div className="card-body">
            <h5>Información</h5>
            <dl className="mb-0">
              <dt>Destinatario</dt><dd>{requisicion.destinatario}</dd>
              <dt>Observaciones</dt><dd>{requisicion.observaciones || "Sin observaciones"}</dd>
              {requisicion.comentarioResolucion ? <><dt>Respuesta</dt><dd>{requisicion.comentarioResolucion}</dd></> : null}
              {requisicion.resueltoPor ? <><dt>Atendido por</dt><dd>{requisicion.resueltoPor}</dd></> : null}
            </dl>
          </div></div>
          {abierta ? <div className="card border-0 shadow-sm"><div className="card-body">
            <h5>Acciones</h5>
            {puedeResolver ? <>
              <label className="form-label">Comentario de respuesta</label>
              <textarea className="form-control mb-3" rows="3" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength="1000" />
              <div className="d-grid gap-2">
                {requisicion.estado === "ENVIADA" ? <button className="btn btn-outline-warning" disabled={procesando} onClick={() => cambiarEstado("EN_REVISION")}>Marcar en revisión</button> : null}
                <button className="btn btn-success" disabled={procesando} onClick={() => cambiarEstado("AUTORIZADA")}>Autorizar</button>
                <button className="btn btn-outline-danger" disabled={procesando} onClick={() => cambiarEstado("RECHAZADA")}>Rechazar</button>
              </div>
            </> : <button className="btn btn-outline-danger w-100" disabled={procesando} onClick={() => cambiarEstado("CANCELADA")}>Cancelar requisición</button>}
          </div></div> : null}
        </div>
      </div>
    </div>
  );
}
