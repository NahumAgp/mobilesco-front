import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Toast from "../../components/ui/Toast.jsx";
import { obtenerSalidasInsumos } from "../../services/salidasInsumos.js";

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

export default function SalidasInsumosPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [salidas, setSalidas] = useState([]);
  const [salidaSeleccionada, setSalidaSeleccionada] = useState(null);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const salidasResp = await obtenerSalidasInsumos();
        setSalidas(Array.isArray(salidasResp?.content) ? salidasResp.content : Array.isArray(salidasResp) ? salidasResp : []);
      } catch (error) {
        console.error("Error cargando salidas de insumos:", error);
        setToastType("danger");
        setToastMessage("No se pudieron cargar los catálogos");
      }
    };

    cargarCatalogos();
  }, []);

  const verDetalleSalida = (salida) => {
    setSalidaSeleccionada(salida);
  };

  const cerrarDetalleSalida = () => {
    setSalidaSeleccionada(null);
  };

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Salidas de Insumos</h2>
          <p className="text-muted mb-0">Historial y registro de consumos por orden de producción.</p>
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
            <small className="text-muted">Desde aquí puedes revisar quién hizo cada salida y cuándo.</small>
          </div>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => navigate("/salidas-insumos/nueva")}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Nueva salida
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Orden</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                  <th className="text-end">Total</th>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          verDetalleSalida(salida);
                        }
                      }}
                    >
                      <td>
                        <div className="fw-semibold">{salida.ordenProduccion}</div>
                        {salida.observaciones && <small className="text-muted">{salida.observaciones}</small>}
                      </td>
                      <td>{salida.usuario || "--"}</td>
                      <td>{formatoFecha(salida.fechaSalida)}</td>
                      <td className="text-end">
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {Number(salida.cantidadTotal || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      Aún no hay salidas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    {salidaSeleccionada.ordenProduccion} · {formatoFecha(salidaSeleccionada.fechaSalida)}
                  </small>
                </div>
                <button type="button" className="btn btn-light btn-sm" onClick={cerrarDetalleSalida}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted small">Usuario</div>
                      <div className="fw-semibold">{salidaSeleccionada.usuario || "--"}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted small">Cantidad total</div>
                      <div className="fw-semibold">{Number(salidaSeleccionada.cantidadTotal || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
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
                        <th className="text-end">Stock después</th>
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
