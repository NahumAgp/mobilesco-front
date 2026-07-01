import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { obtenerCompraPorId } from "../services/compras.js";
import Card from "../../../components/ui/Card.jsx";
import Toast from "../../../components/ui/Toast.jsx";

export default function CompraDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType] = useState("success");

  const cargarCompra = useCallback(async () => {
    try {
      setLoading(true);
      const data = await obtenerCompraPorId(id);
      setCompra(data);
    } catch (error) {
      setError("Error cargando la compra");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarCompra();
  }, [cargarCompra]);

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
      'RECIBIDA_PARCIAL': 'info',
      'RECIBIDA': 'success',
      'CANCELADA': 'danger'
    };
    return colores[estado] || 'secondary';
  };

  const totalDetalles = compra.detalles?.length || 0;
  const totalPendiente = compra.detalles?.reduce(
    (sum, detalle) => sum + Number(detalle.cantidadPendiente || 0),
    0
  ) || 0;

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
      
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="text-muted small">Compra registrada</div>
          <h3 className="mb-1">
            <i className="bi bi-receipt me-2"></i>
            Detalle de Compra: {compra.folio}
          </h3>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className={`badge bg-${getEstadoBadge(compra.estado)}`}>{compra.estado}</span>
            <span className="text-muted small">{totalDetalles} renglones · {formatCurrency(compra.total)}</span>
          </div>
        </div>
        <div>
          <button
            className="btn btn-primary me-2"
            onClick={() => navigate(`/almacen/entradas/${id}`)}
          >
            <i className="bi bi-box-arrow-in-down me-2"></i>
            Ir a Entradas
          </button>
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
              <h5>{compra.fechaRecepcion ? formatDate(compra.fechaRecepcion) : 'Pendiente'}</h5>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Renglones</h6>
              <h4 className="text-dark">{totalDetalles}</h4>
              <small className="text-muted">{totalPendiente.toFixed(2)} pendientes</small>
            </div>
          </Card>
        </div>
      </div>

      <div className="alert alert-info d-flex align-items-center justify-content-between">
        <div>
          <strong>Recepción operativa:</strong> se gestiona desde Entradas para permitir recepción parcial y actualización de stock.
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/almacen/entradas/${id}`)}>
          Abrir recepción
        </button>
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
                  <th>Estado:</th>
                  <td>
                    <span className={`badge bg-${getEstadoBadge(compra.estado)}`}>{compra.estado}</span>
                  </td>
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
                <tr>
                  <th>Entregado por:</th>
                  <td>{compra.entregadoPor || '-'}</td>
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
                <th className="text-end">Recibida</th>
                <th className="text-end">Pendiente</th>
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
                    {detalle.motivoNoRecepcion && (
                      <small className="d-block text-warning">
                        Motivo: {detalle.motivoNoRecepcion}
                      </small>
                    )}
                  </td>
                  <td className="text-end">{detalle.cantidad.toFixed(2)}</td>
                  <td className="text-end">{Number(detalle.cantidadRecibida || 0).toFixed(2)}</td>
                  <td className="text-end">{Number(detalle.cantidadPendiente || 0).toFixed(2)}</td>
                  <td>{detalle.unidadCompraSimbolo}</td>
                  <td className="text-end">{formatCurrency(detalle.precioUnitario)}</td>
                  <td className="text-end">{formatCurrency(detalle.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="6" className="text-end fw-bold">Subtotal:</td>
                <td className="text-end fw-bold">{formatCurrency(compra.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan="6" className="text-end fw-bold">Impuesto:</td>
                <td className="text-end fw-bold">{formatCurrency(compra.impuesto)}</td>
              </tr>
              <tr>
                <td colSpan="6" className="text-end fw-bold">Total:</td>
                <td className="text-end fw-bold text-primary">{formatCurrency(compra.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="ms-panel mt-3">
          <div className="ms-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(compra.subtotal)}</strong>
          </div>
          <div className="ms-row">
            <span>Impuesto</span>
            <strong>{formatCurrency(compra.impuesto)}</strong>
          </div>
          <div className="ms-row total">
            <span>Total</span>
            <strong>{formatCurrency(compra.total)}</strong>
          </div>
        </div>
      </Card>

    </div>
  );
}

