export function detectarCambiosPrecio(detalles, preciosAnteriores) {
  return detalles.flatMap((detalle) => {
    const anterior = preciosAnteriores?.[String(detalle.insumoId)];
    if (!anterior) return [];
    const factorAnterior = Number(anterior.factorConversion) || 1;
    const factorNuevo = Number(detalle.factorConversion) || 1;
    const precioAnterior = Number(anterior.precioUnitario);
    const precioNuevo = Number(detalle.precioUnitario);
    if (!Number.isFinite(precioAnterior) || !Number.isFinite(precioNuevo)) return [];
    if (Math.abs(precioAnterior / factorAnterior - precioNuevo / factorNuevo) <= 0.000001) return [];
    return [{
      insumoNombre: detalle.insumoNombre || anterior.insumoNombre,
      precioAnterior,
      unidadAnterior: anterior.unidadCompraSimbolo,
      precioNuevo,
      unidadNueva: detalle.unidadCompraSimbolo,
    }];
  });
}
