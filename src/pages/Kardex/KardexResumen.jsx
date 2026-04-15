import React from "react";
import Card from "../../../components/ui/Card.jsx";

export default function KardexResumen({ insumo, costoPromedio }) {
  if (!insumo) return null;

  const stockActual = insumo.stockActual || 0;
  const stockMinimo = insumo.stockMinimo || 0;
  const unidad = insumo.unidadMedida?.simbolo || '';
  const valorInventario = stockActual * costoPromedio;

  const getStockStatus = () => {
    if (stockActual <= 0) return { class: 'danger', text: 'Agotado' };
    if (stockMinimo && stockActual <= stockMinimo) return { class: 'warning', text: 'Stock Bajo' };
    return { class: 'success', text: 'Normal' };
  };

  const status = getStockStatus();

  return (
    <div className="row mb-4">
      <div className="col-md-3">
        <Card>
          <div className="text-center">
            <h6 className="text-muted mb-2">Stock Actual</h6>
            <h3 className="mb-0">
              {stockActual.toFixed(2)}
              <small className="text-muted fs-6 ms-1">{unidad}</small>
            </h3>
            <span className={`badge bg-${status.class} mt-2`}>{status.text}</span>
          </div>
        </Card>
      </div>

      <div className="col-md-3">
        <Card>
          <div className="text-center">
            <h6 className="text-muted mb-2">Stock Mínimo</h6>
            <h3 className="mb-0">
              {stockMinimo.toFixed(2)}
              <small className="text-muted fs-6 ms-1">{unidad}</small>
            </h3>
          </div>
        </Card>
      </div>

      <div className="col-md-3">
        <Card>
          <div className="text-center">
            <h6 className="text-muted mb-2">Costo Promedio</h6>
            <h3 className="mb-0 text-primary">
              ${costoPromedio.toFixed(2)}
              <small className="text-muted fs-6 ms-1">por {unidad}</small>
            </h3>
          </div>
        </Card>
      </div>

      <div className="col-md-3">
        <Card>
          <div className="text-center">
            <h6 className="text-muted mb-2">Valor Inventario</h6>
            <h3 className="mb-0 text-success">
              ${valorInventario.toFixed(2)}
            </h3>
          </div>
        </Card>
      </div>
    </div>
  );
}