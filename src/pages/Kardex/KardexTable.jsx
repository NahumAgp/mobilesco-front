import React from "react";
import Card from "../../components/ui/Card.jsx";

export default function KardexTable({ movimientos, loading, insumoNombre }) {

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const getTipoBadge = (tipo) => {
    switch(tipo) {
      case 'ENTRADA':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">ENTRADA</span>;
      case 'SALIDA':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">SALIDA</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary">{tipo}</span>;
    }
  };

  const getConceptoBadge = (concepto) => {
    switch(concepto) {
      case 'COMPRA':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">COMPRA</span>;
      case 'PRODUCCION':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">PRODUCCIÓN</span>;
      case 'AJUSTE':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">AJUSTE</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary">{concepto}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando movimientos...</p>
        </div>
      </Card>
    );
  }

  if (!insumoNombre) {
    return (
      <Card>
        <div className="text-center py-5">
          <i className="bi bi-archive fs-1 d-block mb-3 text-secondary"></i>
          <h5>Selecciona un insumo para ver su kardex</h5>
          <p className="text-muted">Elige un insumo del listado y haz clic en Consultar</p>
        </div>
      </Card>
    );
  }

  if (movimientos.length === 0) {
    return (
      <Card>
        <div className="text-center py-5">
          <i className="bi bi-journal-x fs-1 d-block mb-3 text-secondary"></i>
          <h5>No hay movimientos registrados</h5>
          <p className="text-muted">
            {insumoNombre} no tiene movimientos en el período seleccionado
          </p>
        </div>
      </Card>
    );
  }

  // Calcular saldo acumulado
  let saldo = 0;
  const movimientosConSaldo = movimientos.map(m => {
    if (m.tipo === 'ENTRADA') {
      saldo += m.cantidad;
    } else {
      saldo -= m.cantidad;
    }
    return { ...m, saldoAcumulado: saldo };
  });

  return (
    <Card
      title={`Kardex - ${insumoNombre}`}
      icon="bi-journal-text"
    >
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Documento</th>
              <th>Referencia</th>
              <th className="text-end">Cantidad</th>
              <th className="text-end">Costo Unit.</th>
              <th className="text-end">Costo Total</th>
              <th className="text-end">Stock Anterior</th>
              <th className="text-end">Stock Nuevo</th>
              <th className="text-end">Saldo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientosConSaldo.map((mov) => (
              <tr key={mov.id}>
                <td>{formatDate(mov.fecha)}</td>
                <td>{getTipoBadge(mov.tipo)}</td>
                <td>{getConceptoBadge(mov.concepto)}</td>
                <td>
                  {mov.documento || '-'}
                  {mov.compraId && (
                    <small className="d-block text-muted">Compra #{mov.compraId}</small>
                  )}
                </td>
                <td>
                  {mov.referencia || '-'}
                  {mov.produccionId && (
                    <small className="d-block text-muted">Prod. #{mov.produccionId}</small>
                  )}
                </td>
                <td className={`text-end fw-bold ${mov.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                  {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad.toFixed(2)}
                </td>
                <td className="text-end">{formatCurrency(mov.costoUnitario)}</td>
                <td className="text-end">{formatCurrency(mov.costoTotal)}</td>
                <td className="text-end">{mov.stockAnterior?.toFixed(2) || '0.00'}</td>
                <td className="text-end fw-bold">{mov.stockNuevo?.toFixed(2) || '0.00'}</td>
                <td className="text-end fw-bold text-primary">{mov.saldoAcumulado.toFixed(2)}</td>
                <td>
                  <small className="text-muted">{mov.observaciones || '-'}</small>
                  {mov.usuario && (
                    <small className="d-block text-muted">Por: {mov.usuario}</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}