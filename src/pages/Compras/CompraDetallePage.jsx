import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { obtenerCompraPorId, recibirCompra, cancelarCompra } from "../../services/compras.js";
import Card from "../../components/ui/Card.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function CompraDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  useEffect(() => {
    cargarCompra();
  }, [id]);

  const cargarCompra = async () => {
    try {
      setLoading(true);
      const data = await obtenerCompraPorId(id);
      setCompra(data);
    } catch (e) {
      setError("Error cargando la compra");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecibir = async () => {
    if (!window.confirm("¿Confirmas que quieres marcar esta compra como RECIBIDA? Esto actualizará el stock de los insumos.")) {
      return;
    }

    try {
      await recibirCompra(id);
      setToastType("success");
      setToastMessage("Compra recibida y stock actualizado");
      cargarCompra(); // Recargar para ver el cambio
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al recibir compra: " + (e.message || "Error desconocido"));
    }
  };

  const handleCancelar = async () => {
    if (!motivoCancelacion.trim()) {
      alert("Debes ingresar un motivo de cancelación");
      return;
    }

    try {
      await cancelarCompra(id, motivoCancelacion);
      setToastType("success");
      setToastMessage("Compra cancelada");
      setShowCancelModal(false);
      setMotivoCancelacion("");
      cargarCompra(); // Recargar para ver el cambio
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al cancelar compra");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      'PENDIENTE': 'warning',
      'RECIBIDA': 'success',
      'CANCELADA': 'danger'
    };
    return colores[estado] || 'secondary';
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted">Cargando compra...</p>
        </div>
      </div>
    );
  }

  if (error || !compra) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error || "Compra no encontrada"}</div>
        <button className="btn btn-primary" onClick={() => navigate("/compras")}>
          Volver a Compras
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3>
          <i className="bi bi-receipt me-2"></i>
          Detalle de Compra: {compra.folio}
        </h3>
        <div>
          {compra.estado === 'PENDIENTE' && (
            <>
              <button 
                className="btn btn-success me-2"
                onClick={handleRecibir}
              >
                <i className="bi bi-check-circle me-2"></i>
                Recibir Compra
              </button>
              <button 
                className="btn btn-danger me-2"
                onClick={() => setShowCancelModal(true)}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </button>
            </>
          )}
          {compra.estado === 'PENDIENTE' && (
            <button 
              className="btn btn-outline-primary me-2"
              onClick={() => navigate(`/compras/${id}`)}
            >
              <i className="bi bi-pencil me-2"></i>
              Editar
            </button>
          )}
          <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>

      {/* Resumen de estado */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Estado</h6>
              <h4>
                <span className={`badge bg-${getEstadoBadge(compra.estado)}`} style={{ fontSize: '1rem' }}>
                  {compra.estado}
                </span>
              </h4>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Total</h6>
              <h4 className="text-primary">{formatCurrency(compra.total)}</h4>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Fecha Compra</h6>
              <h5>{formatDate(compra.fechaCompra)}</h5>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Fecha Recepción</h6>
              <h5>{formatDate(compra.fechaRecepcion) || 'Pendiente'}</h5>
            </div>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <Card title="Información General" icon="bi-info-circle">
            <table className="table table-sm">
              <tbody>
                <tr>
                  <th style={{ width: '40%' }}>Folio:</th>
                  <td>{compra.folio}</td>
                </tr>
                <tr>
                  <th>Tipo Documento:</th>
                  <td>{compra.tipoDocumento}</td>
                </tr>
                <tr>
                  <th>Número Documento:</th>
                  <td>{compra.numeroDocumento || '-'}</td>
                </tr>
                <tr>
                  <th>Observaciones:</th>
                  <td>{compra.observaciones || '-'}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div className="col-md-6">
          <Card title="Proveedor" icon="bi-truck">
            <table className="table table-sm">
              <tbody>
                <tr>
                  <th style={{ width: '40%' }}>Razón Social:</th>
                  <td>{compra.proveedorRazonSocial}</td>
                </tr>
                <tr>
                  <th>RFC:</th>
                  <td>{compra.proveedorRfc}</td>
                </tr>
                <tr>
                  <th>Contacto:</th>
                  <td>{compra.proveedorNombreCompleto}</td>
                </tr>
                <tr>
                  <th></th>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-info"
                      onClick={() => navigate(`/proveedores/${compra.proveedorId}`)}
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      Ver proveedor
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <Card title="Detalles de la Compra" icon="bi-list-ul">
        <div className="table-responsive">
          <table className="table">
            <thead className="table-light">
              <tr>
                <th>Insumo</th>
                <th className="text-end">Cantidad</th>
                <th>Unidad</th>
                <th className="text-end">Precio Unit.</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {compra.detalles?.map((detalle) => (
                <tr key={detalle.id}>
                  <td>
                    {detalle.insumoNombre}
                    {detalle.factorConversion !== 1 && (
                      <small className="d-block text-muted">
                        Factor: {detalle.factorConversion} ({detalle.cantidadEnUnidadConsumo?.toFixed(2)} {detalle.unidadConsumoSimbolo})
                      </small>
                    )}
                  </td>
                  <td className="text-end">{detalle.cantidad.toFixed(2)}</td>
                  <td>{detalle.unidadCompraSimbolo}</td>
                  <td className="text-end">{formatCurrency(detalle.precioUnitario)}</td>
                  <td className="text-end">{formatCurrency(detalle.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="4" className="text-end fw-bold">Subtotal:</td>
                <td className="text-end fw-bold">{formatCurrency(compra.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan="4" className="text-end fw-bold">Impuesto:</td>
                <td className="text-end fw-bold">{formatCurrency(compra.impuesto)}</td>
              </tr>
              <tr>
                <td colSpan="4" className="text-end fw-bold">Total:</td>
                <td className="text-end fw-bold text-primary">{formatCurrency(compra.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancelar Compra</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de cancelar la compra <strong>{compra.folio}</strong>?</p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Motivo de cancelación:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ej: Error en la orden, Proveedor no pudo surtir, etc."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowCancelModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleCancelar}>
                  <i className="bi bi-x-circle me-2"></i>
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}