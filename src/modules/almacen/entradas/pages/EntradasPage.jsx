import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../../components/ui/Toast.jsx";
import { obtenerMovimientosPorCompra } from "../../../kardex/services/kardex.js";
import { obtenerEntradas } from "../services/entradas.js";

function formatoFecha(valor) {
  if (!valor) return "--";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatoFechaHora(valor) {
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

function colorEstado(estado) {
  switch (estado) {
    case "RECIBIDA":
      return "success";
    case "RECIBIDA_PARCIAL":
      return "warning";
    case "POR_CERRAR":
      return "info";
    case "CANCELADA":
      return "danger";
    default:
      return "secondary";
  }
}

function numero(valor) {
  const normalizado = Number(valor || 0);
  return Number.isFinite(normalizado) ? normalizado : 0;
}

function getPendienteDetalle(detalle) {
  if (detalle.cantidadPendiente !== null && detalle.cantidadPendiente !== undefined) {
    return numero(detalle.cantidadPendiente);
  }

  return Math.max(numero(detalle.cantidad) - numero(detalle.cantidadRecibida), 0);
}

function getResumenEntrada(entrada) {
  const detalles = Array.isArray(entrada.detalles) ? entrada.detalles : [];

  return detalles.reduce(
    (acc, detalle) => ({
      totalComprado: acc.totalComprado + numero(detalle.cantidad),
      totalRecibido: acc.totalRecibido + numero(detalle.cantidadRecibida),
      totalPendiente: acc.totalPendiente + getPendienteDetalle(detalle)
    }),
    { totalComprado: 0, totalRecibido: 0, totalPendiente: 0 }
  );
}

function getEstadoOperativo(entrada) {
  if (entrada.estado === "CANCELADA" || entrada.estado === "RECIBIDA") {
    return entrada.estado;
  }

  const detalles = Array.isArray(entrada.detalles) ? entrada.detalles : [];
  if (detalles.length === 0) {
    return entrada.estado || "PENDIENTE";
  }

  const resumen = getResumenEntrada(entrada);
  if (resumen.totalComprado > 0 && resumen.totalPendiente <= 0) {
    return "POR_CERRAR";
  }

  if (resumen.totalRecibido > 0) {
    return "RECIBIDA_PARCIAL";
  }

  return entrada.estado || "PENDIENTE";
}

function etiquetaEstado(estado) {
  return estado === "POR_CERRAR" ? "POR CERRAR" : estado;
}

function getLlaveVisita(movimiento) {
  const fecha = new Date(movimiento.fechaRegistro || movimiento.fecha || 0);
  if (Number.isNaN(fecha.getTime())) {
    return `mov-${movimiento.id}`;
  }

  fecha.setSeconds(0, 0);
  return fecha.toISOString();
}

function agruparMovimientosPorVisita(movimientos) {
  const grupos = new Map();

  movimientos.forEach((movimiento) => {
    const llave = getLlaveVisita(movimiento);
    const existente = grupos.get(llave) || {
      llave,
      fecha: movimiento.fechaRegistro || movimiento.fecha,
      movimientos: []
    };

    existente.movimientos.push(movimiento);
    grupos.set(llave, existente);
  });

  return Array.from(grupos.values()).sort((a, b) => {
    const fechaA = new Date(a.fecha || 0).getTime();
    const fechaB = new Date(b.fecha || 0).getTime();
    return fechaB - fechaA;
  });
}

export default function EntradasPage() {
  const navigate = useNavigate();
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [historialAbiertoId, setHistorialAbiertoId] = useState(null);
  const [historialCargandoPorCompra, setHistorialCargandoPorCompra] = useState({});
  const [historialPorCompra, setHistorialPorCompra] = useState({});

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await obtenerEntradas();
        setEntradas(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando entradas:", error);
        setToastType("danger");
        setToastMessage("No se pudieron cargar las entradas");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const entradasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return entradas.filter((entrada) => {
      const coincideTexto = !termino ||
        entrada.folio?.toLowerCase().includes(termino) ||
        entrada.proveedorRazonSocial?.toLowerCase().includes(termino) ||
        entrada.proveedorRfc?.toLowerCase().includes(termino) ||
        entrada.numeroDocumento?.toLowerCase().includes(termino) ||
        entrada.entregadoPor?.toLowerCase().includes(termino);

      const estadoOperativo = getEstadoOperativo(entrada);
      const coincideEstado = filtroEstado === "TODOS" || estadoOperativo === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [busqueda, entradas, filtroEstado]);

  const historialCargado = (entradaId) => Object.prototype.hasOwnProperty.call(historialPorCompra, entradaId);

  const cargarHistorial = async (entradaId) => {
    if (historialCargado(entradaId) || historialCargandoPorCompra[entradaId]) {
      return;
    }

    try {
      setHistorialCargandoPorCompra((prev) => ({ ...prev, [entradaId]: true }));
      const data = await obtenerMovimientosPorCompra(entradaId);
      setHistorialPorCompra((prev) => ({
        ...prev,
        [entradaId]: Array.isArray(data) ? data : []
      }));
    } catch (error) {
      console.error("Error cargando historial de recepcion:", error);
      setToastType("danger");
      setToastMessage("No se pudo cargar el historial de recepciones");
      setHistorialAbiertoId(null);
    } finally {
      setHistorialCargandoPorCompra((prev) => {
        const siguiente = { ...prev };
        delete siguiente[entradaId];
        return siguiente;
      });
    }
  };

  const alternarHistorial = async (entradaId) => {
    if (historialAbiertoId === entradaId) {
      setHistorialAbiertoId(null);
      return;
    }

    setHistorialAbiertoId(entradaId);
    await cargarHistorial(entradaId);
  };

  const manejarClickFila = (entrada, cerrada, tieneHistorial) => {
    if (cerrada) {
      if (tieneHistorial) {
        alternarHistorial(entrada.id);
      }
      return;
    }

    navigate(`/almacen/entradas/${entrada.id}`);
  };

  useEffect(() => {
    entradasFiltradas.forEach((entrada) => {
      const resumen = getResumenEntrada(entrada);
      const estadoOperativo = getEstadoOperativo(entrada);
      const esParcialConPendiente = resumen.totalRecibido > 0
        && resumen.totalPendiente > 0
        && estadoOperativo !== "RECIBIDA"
        && estadoOperativo !== "CANCELADA";

      if (esParcialConPendiente) {
        cargarHistorial(entrada.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradasFiltradas, historialPorCompra, historialCargandoPorCompra]);

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Entradas"
        subtitle="Recepción de compras y actualización de stock"
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
            <i className="bi bi-cart-check me-2"></i>
            Ir a compras
          </button>
        }
      />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-7">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por folio, proveedor, RFC, documento o entregante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RECIBIDA_PARCIAL">Parciales</option>
                <option value="POR_CERRAR">Por cerrar</option>
                <option value="RECIBIDA">Recibidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("TODOS");
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Cargando entradas...</div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Folio</th>
                  <th>Proveedor</th>
                  <th>Entregado por</th>
                  <th>Estado</th>
                  <th>Fecha compra</th>
                  <th className="text-end">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entradasFiltradas.length > 0 ? entradasFiltradas.map((entrada) => {
                  const estadoOperativo = getEstadoOperativo(entrada);
                  const color = colorEstado(estadoOperativo);
                  const cerrada = estadoOperativo === "CANCELADA" || estadoOperativo === "RECIBIDA";
                  const resumen = getResumenEntrada(entrada);
                  const tieneHistorial = resumen.totalRecibido > 0 || ["RECIBIDA", "RECIBIDA_PARCIAL", "POR_CERRAR"].includes(estadoOperativo);
                  const historialAbierto = historialAbiertoId === entrada.id;
                  const movimientosHistorial = historialPorCompra[entrada.id] || [];
                  const visitasHistorial = agruparMovimientosPorVisita(movimientosHistorial);
                  const esParcialConPendiente = resumen.totalRecibido > 0 && resumen.totalPendiente > 0 && !cerrada;
                  const mostrarHistorial = historialAbierto || esParcialConPendiente;
                  const tituloFila = cerrada
                    ? "Ver historial de recepcion"
                    : "Recibir materiales pendientes";

                  return (
                    <Fragment key={entrada.id}>
                      <tr
                        className={`${historialAbierto ? "table-active" : ""}`}
                        style={{ cursor: "pointer" }}
                        title={tituloFila}
                        onClick={() => manejarClickFila(entrada, cerrada, tieneHistorial)}
                      >
                        <td className="fw-semibold">{entrada.folio}</td>
                        <td>
                          <div>{entrada.proveedorRazonSocial}</div>
                          <small className="text-muted">{entrada.proveedorRfc}</small>
                        </td>
                        <td>{entrada.entregadoPor || "--"}</td>
                        <td>
                          <span className={`badge bg-${color}-subtle text-${color} border border-${color}-subtle`}>
                            {etiquetaEstado(estadoOperativo)}
                          </span>
                        </td>
                        <td>{formatoFecha(entrada.fechaCompra)}</td>
                        <td className="text-end fw-semibold">${Number(entrada.total || 0).toFixed(2)}</td>
                        <td className="text-end">
                          <div className="d-flex flex-wrap justify-content-end gap-2">
                            {tieneHistorial && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alternarHistorial(entrada.id);
                                }}
                              >
                                <i className={`bi ${historialAbierto ? "bi-chevron-up" : "bi-clock-history"} me-1`}></i>
                                Historial
                              </button>
                            )}
                            {!cerrada && (
                              <button
                                type="button"
                                className={`btn btn-sm ${estadoOperativo === "POR_CERRAR" ? "btn-outline-primary" : "btn-primary"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/almacen/entradas/${entrada.id}`);
                                }}
                              >
                                {estadoOperativo === "POR_CERRAR" ? "Cerrar" : "Recibir"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {mostrarHistorial && (
                        <tr>
                          <td colSpan="7" className="bg-light">
                            {historialCargandoPorCompra[entrada.id] ? (
                              <div className="text-muted py-3">Cargando historial...</div>
                            ) : visitasHistorial.length === 0 ? (
                              <div className="text-muted py-3">Sin movimientos de recepcion registrados.</div>
                            ) : (
                              <div className="py-2">
                                {visitasHistorial.map((visita, index) => (
                                  <div key={visita.llave} className="mb-3">
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                      <div className="fw-semibold">
                                        Registro {visitasHistorial.length - index}
                                        <span className="text-muted fw-normal ms-2">{formatoFechaHora(visita.fecha)}</span>
                                      </div>
                                      <span className="badge text-bg-light border">
                                        {visita.movimientos.length} material{visita.movimientos.length === 1 ? "" : "es"}
                                      </span>
                                    </div>
                                    <div className="table-responsive">
                                      <table className="table table-sm mb-0">
                                        <thead>
                                          <tr>
                                            <th>Insumo</th>
                                            <th className="text-end">Cantidad recibida</th>
                                            <th>Observaciones</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {visita.movimientos.map((movimiento) => (
                                            <tr key={movimiento.id}>
                                              <td>{movimiento.insumoNombre}</td>
                                              <td className="text-end fw-semibold">
                                                {Number(movimiento.cantidad || 0).toFixed(2)} {movimiento.insumoUnidad || ""}
                                              </td>
                                              <td className="text-muted">{movimiento.observaciones || "--"}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No hay entradas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
