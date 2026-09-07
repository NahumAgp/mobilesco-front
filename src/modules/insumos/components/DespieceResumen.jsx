export default function DespieceResumen({ asignaciones }) {
  if (!asignaciones.some((item) => item.conjunto)) return null;
  const totales = new Map();
  for (const item of asignaciones) {
    const factor = Number(item.cantidad || 0) * (1 + Number(item.desperdicioPorcentaje || 0) / 100);
    const componentes = item.conjunto ? item.componentes || [] : [{
      insumoId: item.insumoId ?? item.id, nombre: item.insumoNombre ?? item.nombre,
      unidadMedida: item.insumoUnidad ?? item.unidadMedida?.simbolo ?? item.unidadMedida,
      cantidad: 1
    }];
    for (const c of componentes) {
      const key = String(c.insumoId);
      const anterior = totales.get(key);
      totales.set(key, { ...c, cantidad: (anterior?.cantidad || 0) + Number(c.cantidad) * factor });
    }
  }
  return <details className="mt-3">
    <summary className="fw-semibold">Total de insumos del despiece</summary>
    <div className="table-responsive"><table className="table table-sm mt-2">
      <thead><tr><th>Insumo</th><th className="text-end">Cantidad con desperdicio</th><th>Unidad</th></tr></thead>
      <tbody>{[...totales.values()].map((c) => <tr key={c.insumoId}><td>{c.nombre}</td>
        <td className="text-end">{c.cantidad.toLocaleString("es-MX", { maximumFractionDigits: 4 })}</td><td>{c.unidadMedida}</td></tr>)}</tbody>
    </table></div>
  </details>;
}
