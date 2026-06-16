import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card.jsx";

export default function KardexTable({ movimientos, loading, insumoNombre }) {
  const navigate = useNavigate();

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

  const movimientosConSaldo = movimientos.reduce((acc, mov) => {
    const saldoAnterior = acc.saldo;
    const saldoAcumulado = mov.tipo === "ENTRADA"
      ? saldoAnterior + mov.cantidad
      : saldoAnterior - mov.cantidad;

    return {
      saldo: saldoAcumulado,
      items: [...acc.items, { ...mov, saldoAcumulado }]
    };
  }, { saldo: 0, items: [] }).items;

  const recepcionesPorCompra = movimientosConSaldo.reduce((acc, mov) => {
    if (mov.tipo === "ENTRADA" && mov.concepto === "COMPRA" && mov.compraId) {
      const key = `${mov.compraId}-${mov.insumoId || "insumo"}`;
      acc[key] = [...(acc[key] || []), mov];
    }

    return acc;
  }, {});
  const recepcionesParciales = Object.values(recepcionesPorCompra).reduce((acc, grupo) => {
    if (grupo.length <= 1) {
      return acc;
    }

    const movimientosOrdenados = [...grupo].sort((a, b) => {
      const fechaA = new Date(a.fecha || 0).getTime();
      const fechaB = new Date(b.fecha || 0).getTime();

      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });
    const cantidadEsperada = Number(movimientosOrdenados.find((mov) => mov.cantidadEsperadaCompra)?.cantidadEsperadaCompra || 0);
    let cantidadAcumulada = 0;

    movimientosOrdenados.forEach((mov, index) => {
      cantidadAcumulada += Number(mov.cantidad || 0);
      const completo = cantidadEsperada > 0
        ? cantidadAcumulada >= cantidadEsperada - 0.0001
        : index === movimientosOrdenados.length - 1;

      acc[mov.id] = { completo };
    });

    return acc;
  }, {});

  const obtenerRecepcionParcial = (mov) => {
    return recepcionesParciales[mov.id] || null;
  };

  return (
    <Card
      title={`Kardex - ${insumoNombre}`}
      icon="bi-journal-text"
    >
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th className="text-center">Fecha</th>
              <th className="text-center">Tipo</th>
              <th className="text-center">Concepto</th>
              <th className="text-center">Documento</th>
              <th className="text-center">Proveedor</th>
              <th className="text-center">Cantidad</th>
              <th className="text-center">Costo Unit.</th>
              <th className="text-center">Costo Total</th>
              <th className="text-center">Stock Anterior</th>
              <th className="text-center">Stock Nuevo</th>
              <th className="text-center">Compra</th>
            </tr>
          </thead>
          <tbody>
            {movimientosConSaldo.map((mov) => {
              const recepcionParcial = obtenerRecepcionParcial(mov);

              return (
                <tr key={mov.id}>
                  <td className="text-center">{formatDate(mov.fecha)}</td>
                  <td className="text-center">{getTipoBadge(mov.tipo)}</td>
                  <td className="text-center">
                    {getConceptoBadge(mov.concepto)}
                    {recepcionParcial && (
                      <span
                        className={`badge d-block mt-1 ${
                          recepcionParcial.completo
                            ? "bg-success-subtle text-success border border-success-subtle"
                            : "bg-warning-subtle text-warning border border-warning-subtle"
                        }`}
                      >
                        Parcial
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {mov.documento || '-'}
                    {mov.compraId && (
                      <small className="d-block text-muted">Compra #{mov.compraId}</small>
                    )}
                  </td>
                  <td className="text-center">{mov.proveedorNombre || '-'}</td>
                  <td className={`text-center fw-bold ${mov.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                    {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad.toFixed(2)}
                  </td>
                  <td className="text-center">{formatCurrency(mov.costoUnitario)}</td>
                  <td className="text-center">{formatCurrency(mov.costoTotal)}</td>
                  <td className="text-center">{mov.stockAnterior?.toFixed(2) || '0.00'}</td>
                  <td className="text-center fw-bold">{mov.stockNuevo?.toFixed(2) || '0.00'}</td>
                  <td className="text-center">
                    {mov.compraId ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate(`/compras/${mov.compraId}/ver`)}
                        title="Ver compra"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>
                        Ver
                      </button>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
