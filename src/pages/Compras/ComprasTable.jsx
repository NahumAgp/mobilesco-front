import { useState } from "react";

export default function ComprasTable({ 
  data, 
  onVer, 
  onEditar, 
  onEliminar, 
  onRecibir, 
  onCancelar 
}) {
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [showDetallesModal, setShowDetallesModal] = useState(false);

  const verDetalles = (compra, e) => {
    e.stopPropagation();
    setCompraSeleccionada(compra);
    setShowDetallesModal(true);
  };

  const getBadgeColor = (estado) => {
    switch(estado) {
      case 'PENDIENTE': return 'warning';
      case 'RECIBIDA': return 'success';
      case 'CANCELADA': return 'danger';
      default: return 'secondary';
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
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <>
      <div className="card">
        <div
          className="table-responsive"
          style={{
            height: "calc(100vh - 400px)",
            overflowY: "auto"
          }}
        >
          <table className="table table-hover mb-0">
            <thead
              className="table-light"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                backgroundColor: "white"
              }}
            >
              <tr>
                <th>ID</th>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Documento</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((compra) => (
                  <tr
                    key={compra.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onVer(compra)}
                    className={
                      compra.estado === 'CANCELADA' ? 'table-secondary' :
                      compra.estado === 'RECIBIDA' ? 'table-success' : ''
                    }
                  >
                    <td>{compra.id}</td>
                    <td>
                      <span className="fw-semibold">{compra.folio}</span>
                    </td>
                    <td>{formatDate(compra.fechaCompra)}</td>
                    <td>
                      <div>
                        <span className="fw-semibold">{compra.proveedorRazonSocial}</span>
                        <br />
                        <small className="text-muted">{compra.proveedorRfc}</small>
                      </div>
                    </td>
                    <td>
                      <small>
                        {compra.tipoDocumento} {compra.numeroDocumento}
                      </small>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(compra.total)}
                    </td>
                    <td>
                      <span className={`badge bg-${getBadgeColor(compra.estado)}-subtle text-${getBadgeColor(compra.estado)} border border-${getBadgeColor(compra.estado)}-subtle`}>
                        {compra.estado}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-info"
                          onClick={(e) => verDetalles(compra, e)}
                          title="Ver detalles"
                        >
                          <i className="bi bi-list-ul"></i>
                        </button>
                        
                        {compra.estado === 'PENDIENTE' && (
                          <>
                            <button
                              className="btn btn-outline-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRecibir(compra.id);
                              }}
                              title="Recibir compra"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelar(compra.id);
                              }}
                              title="Cancelar compra"
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </>
                        )}
                        
                        
                        
                        {compra.estado === 'PENDIENTE' && (
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminar(compra.id);
                            }}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-5">
                    <i className="bi bi-cart fs-1 d-block mb-3 text-secondary"></i>
                    <span className="fs-5">No hay compras registradas</span>
                    <p className="text-secondary mt-2">Comienza creando una nueva compra</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetallesModal && compraSeleccionada && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalles de Compra: {compraSeleccionada.folio}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDetallesModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Proveedor:</strong> {compraSeleccionada.proveedorRazonSocial}</p>
                    <p><strong>RFC:</strong> {compraSeleccionada.proveedorRfc}</p>
                    <p><strong>Contacto:</strong> {compraSeleccionada.proveedorNombreCompleto}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Documento:</strong> {compraSeleccionada.tipoDocumento} {compraSeleccionada.numeroDocumento}</p>
                    <p><strong>Fecha compra:</strong> {formatDate(compraSeleccionada.fechaCompra)}</p>
                    <p><strong>Fecha recepción:</strong> {formatDate(compraSeleccionada.fechaRecepcion)}</p>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Insumos</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
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
                      {compraSeleccionada.detalles?.map((detalle) => (
                        <tr key={detalle.id}>
                          <td>{detalle.insumoNombre}</td>
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
                        <td className="text-end fw-bold">{formatCurrency(compraSeleccionada.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Impuesto:</td>
                        <td className="text-end fw-bold">{formatCurrency(compraSeleccionada.impuesto)}</td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Total:</td>
                        <td className="text-end fw-bold text-primary">{formatCurrency(compraSeleccionada.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {compraSeleccionada.observaciones && (
                  <div className="mt-3">
                    <p><strong>Observaciones:</strong></p>
                    <p className="text-muted">{compraSeleccionada.observaciones}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetallesModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}