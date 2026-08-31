import { useCallback, useEffect, useMemo, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { useNavigate } from "react-router-dom";

import Toast from "../../../components/ui/Toast.jsx";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { uniqueOptionsByValue } from "../../../utils/uniqueOptions.js";
import { getUser, hasPermission } from "../../auth/services/authService.js";
import { eliminarSalidaInsumo, obtenerSalidasInsumos } from "../services/salidasInsumos.js";

const PAGE_SIZE = 10;
const PAGE_INFO_DEFAULT = {
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
};
const FILTROS_DEFAULT = {
  busqueda: "",
  filtroArea: "",
  filtroResponsable: "",
  fechaInicio: "",
  fechaFin: ""
};

function formatoFecha(valor) {
  if (!valor) return "--";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function etiquetaOrdenSalida(salida) {
  if (salida?.tipoSalida === "INDIRECTA") {
    return "Salida indirecta";
  }

  return salida?.ordenProduccion || "Salida directa";
}

export default function SalidasInsumosPage() {
  const navigate = useNavigate();
  const user = getUser();
  const puedeRegistrarSalida = hasPermission(user, "ACTION_INVENTORY_OUTPUTS_CREATE");
  const puedeEliminarSalida = hasPermission(user, "ACTION_INVENTORY_OUTPUTS_DELETE");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [salidas, setSalidas] = useState([]);
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [filtros, setFiltros] = usePersistedState("salidas-insumos:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, filtroArea, filtroResponsable, fechaInicio, fechaFin } = filtros;
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const [paginaActual, setPaginaActual] = useState(() => getInitialPaginationPage("salidas-insumos"));
  usePersistedPagination("salidas-insumos", paginaActual);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);

  const cargarSalidas = useCallback(async () => {
    try {
      const salidasResp = await obtenerSalidasInsumos({
        page: paginaActual,
        size: PAGE_SIZE,
        busqueda,
        area: filtroArea,
        responsable: filtroResponsable,
        fechaInicio,
        fechaFin
      });
      setSalidas(Array.isArray(salidasResp?.content) ? salidasResp.content : Array.isArray(salidasResp) ? salidasResp : []);
      setPageInfo(salidasResp?.content ? {
        page: salidasResp.page ?? paginaActual,
        size: salidasResp.size ?? PAGE_SIZE,
        totalElements: salidasResp.totalElements ?? 0,
        totalPages: salidasResp.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
    } catch (error) {
      console.error("Error cargando salidas de insumos:", error);
      setToastType("danger");
      setToastMessage("No se pudieron cargar las salidas");
      setPageInfo(PAGE_INFO_DEFAULT);
    }
  }, [paginaActual, busqueda, filtroArea, filtroResponsable, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarSalidas();
  }, [cargarSalidas]);

  const areas = useMemo(
    () => uniqueOptionsByValue(
      salidas.map((salida) => salida.area).filter(Boolean),
      (area) => area
    ).sort(),
    [salidas]
  );

  const responsables = useMemo(
    () => uniqueOptionsByValue(
      salidas.map((salida) => salida.responsable).filter(Boolean),
      (responsable) => responsable
    ).sort(),
    [salidas]
  );

  const totalPaginas = Math.max(1, pageInfo.totalPages || 1);
  const paginaSegura = Math.min(paginaActual, totalPaginas - 1);

  useEffect(() => {
    setPaginaActual(0);
  }, [busqueda, filtroArea, filtroResponsable, fechaInicio, fechaFin]);

  useEffect(() => {
    if (pageInfo.totalPages > 0 && paginaActual >= pageInfo.totalPages) {
      setPaginaActual(pageInfo.totalPages - 1);
    }
  }, [pageInfo.totalPages, paginaActual]);

  const limpiarFiltros = () => {
    setFiltros(FILTROS_DEFAULT);
  };

  const verDetalleSalida = (salida) => {
    setSalidaSeleccionada(salida);
  };

  const cerrarDetalleSalida = () => {
    setSalidaSeleccionada(null);
  };

  const eliminarSalida = async (salida) => {
    if (!salida?.id || eliminandoId) return;

    const confirmado = window.confirm(
      "Esta accion eliminara la salida por error de captura y regresara el stock de sus insumos. ¿Deseas continuar?"
    );
    if (!confirmado) return;

    try {
      setEliminandoId(salida.id);
      await eliminarSalidaInsumo(salida.id);
      setSalidaSeleccionada(null);
      setToastType("success");
      setToastMessage("Salida eliminada y stock revertido correctamente");
      await cargarSalidas();
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar la salida");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Salidas de Insumos</h2>
          <p className="text-muted mb-0">Historial y registro de salidas directas e indirectas.</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/insumos")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver a insumos
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-clock-history me-2"></i>Historial de salidas
            </h5>
            <small className="text-muted">Busca por orden, area, responsable, usuario o insumo.</small>
          </div>
          {puedeRegistrarSalida && (
            <button type="button" className="btn btn-success" onClick={() => navigate("/salidas-insumos/nueva")}>
              <i className="bi bi-plus-lg me-2"></i>
              Nueva salida
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <input
                className="form-control"
                value={busquedaInput}
                onChange={(event) => setFiltros((actuales) => ({ ...actuales, busqueda: event.target.value }))}
                placeholder="Buscar salidas..."
              />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filtroArea} onChange={(event) => setFiltros((actuales) => ({ ...actuales, filtroArea: event.target.value }))}>
                <option value="">Todas las areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filtroResponsable} onChange={(event) => setFiltros((actuales) => ({ ...actuales, filtroResponsable: event.target.value }))}>
                <option value="">Todos los responsables</option>
                {responsables.map((responsable) => (
                  <option key={responsable} value={responsable}>{responsable}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={fechaInicio} onChange={(event) => setFiltros((actuales) => ({ ...actuales, fechaInicio: event.target.value }))} />
            </div>
            <div className="col-md-2">
              <div className="input-group">
                <input type="date" className="form-control" value={fechaFin} onChange={(event) => setFiltros((actuales) => ({ ...actuales, fechaFin: event.target.value }))} />
                <button className="btn btn-outline-secondary" type="button" onClick={limpiarFiltros} title="Limpiar filtros">
                  <i className="bi bi-eraser"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">
              Mostrando {salidas.length} de {pageInfo.totalElements || 0} salidas filtradas
            </small>
            <small className="text-muted">Pagina {paginaSegura + 1} de {totalPaginas}</small>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Orden / tipo</th>
                  <th>Area</th>
                  <th>Responsable</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
                  {puedeEliminarSalida && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {salidas.length > 0 ? (
                  salidas.map((salida) => (
                    <tr
                      key={salida.id}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => verDetalleSalida(salida)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          verDetalleSalida(salida);
                        }
                      }}
                    >
                      <td>
                        <div className="fw-semibold">{etiquetaOrdenSalida(salida)}</div>
                        {salida.tipoSalida && (
                          <span className="badge bg-light text-secondary border me-2">
                            {salida.tipoSalida === "INDIRECTA" ? "Indirecta" : "Directa"}
                          </span>
                        )}
                        {salida.observaciones && <small className="text-muted">{salida.observaciones}</small>}
                      </td>
                      <td>{salida.area || "--"}</td>
                      <td>{salida.responsable || "--"}</td>
                      <td>{salida.usuario || "--"}</td>
                      <td>{formatoFecha(salida.fechaSalida)}</td>
                      <td className="text-end">
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {Number(salida.cantidadTotal || 0).toFixed(2)}
                        </span>
                      </td>
                      {puedeEliminarSalida && (
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={eliminandoId === salida.id}
                            title="Eliminar salida por error de captura"
                            onClick={(event) => {
                              event.stopPropagation();
                              eliminarSalida(salida);
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={puedeEliminarSalida ? 7 : 6} className="text-center text-muted py-4">
                      No hay salidas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pageInfo.totalElements > PAGE_SIZE && (
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={paginaSegura <= 0}
                onClick={() => setPaginaActual((prev) => Math.max(0, prev - 1))}
              >
                Anterior
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={paginaSegura >= totalPaginas - 1}
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas - 1, prev + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {salidaSeleccionada && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-success text-white">
                  <div>
                    <h5 className="modal-title mb-0">Detalle de salida</h5>
                    <small className="text-white-50">
                      {etiquetaOrdenSalida(salidaSeleccionada)} - {formatoFecha(salidaSeleccionada.fechaSalida)}
                    </small>
                  </div>
                  <button type="button" className="btn btn-light btn-sm" onClick={cerrarDetalleSalida}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-3">
                      <div className="border rounded p-3 h-100">
                        <div className="text-muted small">Area</div>
                        <div className="fw-semibold">{salidaSeleccionada.area || "--"}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border rounded p-3 h-100">
                        <div className="text-muted small">Responsable</div>
                        <div className="fw-semibold">{salidaSeleccionada.responsable || "--"}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border rounded p-3 h-100">
                        <div className="text-muted small">Usuario</div>
                        <div className="fw-semibold">{salidaSeleccionada.usuario || "--"}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="border rounded p-3 h-100">
                        <div className="text-muted small">Cantidad total</div>
                        <div className="fw-semibold">{Number(salidaSeleccionada.cantidadTotal || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="col-md-12 mt-2">
                      <div className="border rounded p-3 h-100">
                        <div className="text-muted small">Fecha de registro</div>
                        <div className="fw-semibold">{formatoFecha(salidaSeleccionada.fechaRegistro)}</div>
                      </div>
                    </div>
                  </div>

                  {salidaSeleccionada.observaciones && (
                    <div className="alert alert-light border mb-3">
                      <div className="fw-semibold mb-1">Observaciones</div>
                      <div>{salidaSeleccionada.observaciones}</div>
                    </div>
                  )}

                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Insumo</th>
                          <th>Unidad</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-end">Stock antes</th>
                          <th className="text-end">Stock despues</th>
                          <th className="text-end">Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salidaSeleccionada.detalles?.length > 0 ? (
                          salidaSeleccionada.detalles.map((detalle) => (
                            <tr key={detalle.id}>
                              <td>{detalle.insumoNombre}</td>
                              <td>{detalle.insumoUnidad || "--"}</td>
                              <td className="text-end">{Number(detalle.cantidad || 0).toFixed(2)}</td>
                              <td className="text-end">{Number(detalle.stockAnterior || 0).toFixed(2)}</td>
                              <td className="text-end">{Number(detalle.stockNuevo || 0).toFixed(2)}</td>
                              <td className="text-end">
                                {Number(detalle.costoTotal || 0).toFixed(2)}
                                <small className="text-muted d-block">
                                  {Number(detalle.costoUnitario || 0).toFixed(2)} c/u
                                </small>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-3">
                              Esta salida no tiene detalles.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  {puedeEliminarSalida && (
                    <button
                      type="button"
                      className="btn btn-outline-danger me-auto"
                      disabled={eliminandoId === salidaSeleccionada.id}
                      onClick={() => eliminarSalida(salidaSeleccionada)}
                    >
                      <i className="bi bi-trash me-2"></i>
                      {eliminandoId === salidaSeleccionada.id ? "Eliminando..." : "Eliminar salida"}
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-secondary" onClick={cerrarDetalleSalida}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
