import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { obtenerCuentaPorPagarPorId, registrarPagoCuentaPorPagar } from "../services/compras.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export default function CuentaPorPagarDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [pago, setPago] = useState({
    fechaPago: new Date().toISOString().split("T")[0],
    monto: "",
    metodoPago: "TRANSFERENCIA",
    referencia: "",
    observaciones: ""
  });

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerCuentaPorPagarPorId(id);
      setCuenta(data);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo cargar la cuenta por pagar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const saldo = Number(cuenta?.saldoPendiente || 0);
  const puedePagar = cuenta && saldo > 0 && cuenta.estado !== "CANCELADA";

  const detalles = useMemo(() => cuenta?.compra?.detalles || [], [cuenta]);

  const pagarTotal = () => {
    setPago((prev) => ({ ...prev, monto: saldo.toFixed(2) }));
  };

  const registrarPago = async (event) => {
    event.preventDefault();
    try {
      const monto = Number(pago.monto || 0);
      if (monto <= 0) {
        setToastType("danger");
        setToastMessage("Captura un monto mayor a 0");
        return;
      }
      if (monto > saldo) {
        setToastType("danger");
        setToastMessage("El pago no puede ser mayor al saldo pendiente");
        return;
      }

      const actualizada = await registrarPagoCuentaPorPagar(id, {
        ...pago,
        monto
      });
      setCuenta(actualizada);
      setPago({
        fechaPago: new Date().toISOString().split("T")[0],
        monto: "",
        metodoPago: "TRANSFERENCIA",
        referencia: "",
        observaciones: ""
      });
      setToastType("success");
      setToastMessage("Pago registrado correctamente");
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo registrar el pago");
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <PageHeader
        title="Detalle de cuenta por pagar"
        subtitle={cuenta ? `${cuenta.compraFolio || "Compra"} - ${cuenta.proveedorRazonSocial || "Proveedor"}` : "Cargando detalle"}
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate("/compras/cuentas-por-pagar")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        }
      />

      {loading && <div className="alert alert-info">Cargando cuenta por pagar...</div>}

      {cuenta && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small">Total compra</div>
                  <div className="fs-5 fw-bold">{formatCurrency(cuenta.montoTotal)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small">Pagado</div>
                  <div className="fs-5 fw-bold text-success">{formatCurrency(cuenta.montoPagado)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small">Saldo pendiente</div>
                  <div className="fs-5 fw-bold text-danger">{formatCurrency(cuenta.saldoPendiente)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small">Estado</div>
                  <div className="fs-5 fw-bold">{cuenta.estado}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-header bg-white fw-semibold">Detalle de compra pendiente</div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <div className="text-muted small">Proveedor</div>
                      <div className="fw-semibold">{cuenta.proveedorRazonSocial || "-"}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Fecha compra</div>
                      <div className="fw-semibold">{formatDate(cuenta.fechaCompra)}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Metodo de pago</div>
                      <div className="fw-semibold">{cuenta.metodoPagoCompra || "-"}</div>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Insumo</th>
                          <th className="text-end">Cantidad</th>
                          <th>Unidad</th>
                          <th className="text-end">Precio</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.length > 0 ? detalles.map((detalle) => (
                          <tr key={detalle.id}>
                            <td>{detalle.insumoNombre}</td>
                            <td className="text-end">{Number(detalle.cantidad || 0).toFixed(2)}</td>
                            <td>{detalle.unidadCompraSimbolo || "-"}</td>
                            <td className="text-end">{formatCurrency(detalle.precioUnitario)}</td>
                            <td className="text-end fw-semibold">{formatCurrency(detalle.subtotal)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-3">Sin detalles de compra.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/compras/${cuenta.compraId}/ver`)}>
                      Abrir compra completa
                    </button>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white fw-semibold">Historial de pagos</div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Metodo</th>
                        <th>Referencia</th>
                        <th>Usuario</th>
                        <th className="text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuenta.pagos?.length > 0 ? cuenta.pagos.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.fechaPago)}</td>
                          <td>{item.metodoPago || "-"}</td>
                          <td>{item.referencia || "-"}</td>
                          <td>{item.usuario || "-"}</td>
                          <td className="text-end fw-semibold">{formatCurrency(item.monto)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-3">Aun no hay pagos registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <form className="card border-0 shadow-sm" onSubmit={registrarPago}>
                <div className="card-header bg-white fw-semibold">Registrar pago</div>
                <div className="card-body">
                  {!puedePagar && (
                    <div className="alert alert-success">
                      Esta cuenta no tiene saldo pendiente.
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha de pago</label>
                    <input
                      type="date"
                      className="form-control"
                      value={pago.fechaPago}
                      onChange={(event) => setPago((prev) => ({ ...prev, fechaPago: event.target.value }))}
                      disabled={!puedePagar}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <label className="form-label fw-semibold">Monto</label>
                      <button type="button" className="btn btn-link btn-sm p-0" onClick={pagarTotal} disabled={!puedePagar}>
                        Pagar total
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={saldo}
                      className="form-control"
                      value={pago.monto}
                      onChange={(event) => setPago((prev) => ({ ...prev, monto: event.target.value }))}
                      disabled={!puedePagar}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Metodo de pago</label>
                    <select
                      className="form-select"
                      value={pago.metodoPago}
                      onChange={(event) => setPago((prev) => ({ ...prev, metodoPago: event.target.value }))}
                      disabled={!puedePagar}
                    >
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Referencia</label>
                    <input
                      className="form-control"
                      value={pago.referencia}
                      onChange={(event) => setPago((prev) => ({ ...prev, referencia: event.target.value }))}
                      disabled={!puedePagar}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={pago.observaciones}
                      onChange={(event) => setPago((prev) => ({ ...prev, observaciones: event.target.value }))}
                      disabled={!puedePagar}
                    />
                  </div>
                  <button type="submit" className="btn btn-success w-100" disabled={!puedePagar}>
                    Registrar pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
