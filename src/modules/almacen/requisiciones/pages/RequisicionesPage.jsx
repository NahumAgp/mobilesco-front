import { useCallback, useEffect, useState } from "react";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import { getUser, hasPermission } from "../../../auth/services/authService";
import { obtenerRequisiciones } from "../services/requisiciones";

const estadoClase = {
  ENVIADA: "text-bg-primary",
  EN_REVISION: "text-bg-warning",
  AUTORIZADA: "text-bg-success",
  RECHAZADA: "text-bg-danger",
  CANCELADA: "text-bg-secondary",
};
const FILTROS_DEFAULT = { busqueda: "", estado: "" };

export default function RequisicionesPage() {
  const navigate = useNavigate();
  const puedeCrear = hasPermission(getUser(), "ACTION_WAREHOUSE_REQUISITIONS_CREATE");
  const [filtros, setFiltros] = usePersistedState("almacen-requisiciones:filtros", FILTROS_DEFAULT);
  const busqueda = useDebouncedValue(filtros.busqueda, 350);
  const [page, setPage] = useState(() => getInitialPaginationPage("almacen-requisiciones"));
  usePersistedPagination("almacen-requisiciones", page);
  const [resultado, setResultado] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const data = await obtenerRequisiciones({
        page,
        size: 10,
        busqueda: busqueda.trim(),
        estado: filtros.estado,
      });
      setResultado(data);
    } catch (err) {
      setError(err?.message || "No fue posible cargar las requisiciones");
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtros.estado, page]);

  useEffect(() => {
    const timer = setTimeout(cargar, 250);
    return () => clearTimeout(timer);
  }, [cargar]);

  const cambiarFiltro = (event) => {
    const { name, value } = event.target;
    setFiltros((actual) => ({ ...actual, [name]: value }));
    setPage(0);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <h2 className="mb-1">Requisiciones de almacén</h2>
          <p className="text-muted mb-0">Solicitudes de insumos dirigidas a Subdirección Administrativa.</p>
        </div>
        {puedeCrear ? (
          <button className="btn btn-primary" onClick={() => navigate("/almacen/requisiciones/nueva")}>
            <i className="bi bi-file-earmark-plus me-2"></i>Nueva requisición
          </button>
        ) : null}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label fw-semibold">Buscar requisición</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input className="form-control" name="busqueda" value={filtros.busqueda} onChange={cambiarFiltro} placeholder="Folio o solicitante" />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Estatus</label>
              <select className="form-select" name="estado" value={filtros.estado} onChange={cambiarFiltro}>
                <option value="">Todos</option>
                <option value="ENVIADA">Enviada</option>
                <option value="EN_REVISION">En revisión</option>
                <option value="AUTORIZADA">Autorizada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr><th>Folio</th><th>Solicitante</th><th>Fecha</th><th>Partidas</th><th>Destinatario</th><th>Estatus</th><th></th></tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : resultado.content.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-muted py-5"><i className="bi bi-inbox fs-1 d-block mb-2"></i>No hay requisiciones</td></tr>
              ) : resultado.content.map((item) => (
                <tr key={item.id} role="button" onClick={() => navigate(`/almacen/requisiciones/${item.id}`)}>
                  <td className="fw-semibold">{item.folio}</td>
                  <td>{item.solicitanteNombre}</td>
                  <td>{new Date(item.fechaEnvio).toLocaleString("es-MX")}</td>
                  <td>{item.totalPartidas}</td>
                  <td>{item.destinatario}</td>
                  <td><span className={`badge ${estadoClase[item.estado] || "text-bg-light"}`}>{item.estadoEtiqueta}</span></td>
                  <td className="text-end"><i className="bi bi-chevron-right"></i></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <small className="text-muted">{resultado.totalElements || 0} requisiciones</small>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span className="btn btn-outline-secondary btn-sm disabled">{page + 1} / {Math.max(resultado.totalPages, 1)}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page + 1 >= resultado.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
