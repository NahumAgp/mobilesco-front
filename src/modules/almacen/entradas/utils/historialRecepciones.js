function getLlaveVisita(movimiento) {
  if (movimiento.recepcionId) return movimiento.recepcionId;
  const fecha = new Date(movimiento.fechaRegistro || movimiento.fecha || 0);
  if (Number.isNaN(fecha.getTime())) return `mov-${movimiento.id}`;
  fecha.setSeconds(0, 0);
  return fecha.toISOString();
}

export function agruparMovimientosPorVisita(movimientos) {
  const grupos = new Map();

  movimientos.forEach((movimiento) => {
    const llave = getLlaveVisita(movimiento);
    const existente = grupos.get(llave) || {
      llave,
      fecha: movimiento.fechaRegistro || movimiento.fecha,
      movimientos: []
    };
    existente.movimientos.push(movimiento);
    grupos.set(llave, existente);
  });

  return Array.from(grupos.values()).sort((a, b) =>
    new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
  );
}
