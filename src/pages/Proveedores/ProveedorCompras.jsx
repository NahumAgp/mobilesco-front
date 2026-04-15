// pages/Proveedores/components/ProveedorCompras.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerComprasPorProveedor } from "../../services/compras.js";
import Card from "../../components/ui/Card.jsx";

export default function ProveedorCompras({ proveedorId, proveedorNombre }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (proveedorId) {
      cargarCompras();
    }
  }, [proveedorId]);

  const cargarCompras = async () => {
    try {
      setLoading(true);
      const data = await obtenerComprasPorProveedor(proveedorId);
      setCompras(data || []);
    } catch (error) {
      console.error("Error cargando compras del proveedor:", error);
    } finally {
      setLoading(false);
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

  const getEstadoBadge = (estado) => {
    const colores = {
      'PENDIENTE': 'warning',
      'RECIBIDA': 'success',
      'CANCELADA': 'danger'
    };
    return colores[estado] || 'secondary';
  };

  const verDetalleCompra = (e, compraId) => {
    e.stopPropagation(); // 👈 IMPORTANTE: Evita que el evento suba al padre
    navigate(`/compras/${compraId}/ver`);
  };

  const irAComprasProveedor = () => {
    navigate(`/compras?proveedor=${proveedorId}`);
  };

  const crearNuevaCompra = (e) => {
    e.stopPropagation();
    navigate(`/compras/nueva?proveedorId=${proveedorId}`);
  };

  // Mostrar solo las últimas 5 compras
  const ultimasCompras = compras.slice(0, 5);

  return (
    <Card 
      title={`Compras realizadas a ${proveedorNombre || 'este proveedor'}`}
      icon="bi-cart"
      headerClassName="bg-light"
    >
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : compras.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead className="table-light">
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Documento</th>
                  <th className="text-end">Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ultimasCompras.map((compra) => (
                  <tr 
                    key={compra.id} 
                    style={{ cursor: 'pointer' }} 
                    onClick={(e) => verDetalleCompra(e, compra.id)} // 👈 Pasar el evento
                  >
                    <td>
                      <span className="fw-semibold">{compra.folio}</span>
                    </td>
                    <td>{formatDate(compra.fechaCompra)}</td>
                    <td>
                      <small>
                        {compra.tipoDocumento} {compra.numeroDocumento}
                      </small>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(compra.total)}
                    </td>
                    <td>
                      <span className={`badge bg-${getEstadoBadge(compra.estado)}-subtle text-${getEstadoBadge(compra.estado)} border border-${getEstadoBadge(compra.estado)}-subtle`}>
                        {compra.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => verDetalleCompra(e, compra.id)} // 👈 Misma función
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {compras.length > 5 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted small">
                Mostrando 5 de {compras.length} compras
              </span>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={irAComprasProveedor}
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>
                Ver todas las compras
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-cart-x fs-1 d-block mb-3 text-secondary"></i>
          <p className="text-muted mb-0">No hay compras registradas para este proveedor</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={crearNuevaCompra}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Crear primera compra
          </button>
        </div>
      )}
    </Card>
  );
}