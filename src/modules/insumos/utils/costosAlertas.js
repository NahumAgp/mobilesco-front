export const DIAS_REVISION_COSTO = 90;
export const UMBRAL_DESVIACION_COSTO = 0.15;

export function evaluarAlertasCosto(item, ahora = new Date()) {
  const costo = Number(item.costoCotizacion || 0);
  if (costo <= 0) return ["Sin costo de cotización"];

  const alertas = [];
  const fecha = item.fechaCostoCotizacion ? new Date(item.fechaCostoCotizacion) : null;
  if (!fecha || Number.isNaN(fecha.getTime())) {
    alertas.push("Costo sin fecha de revisión");
  } else if ((ahora.getTime() - fecha.getTime()) / 86400000 > DIAS_REVISION_COSTO) {
    alertas.push(`Costo sin revisar en más de ${DIAS_REVISION_COSTO} días`);
  }

  const referencia = Number(item.ultimoCostoCompra || 0) > 0
    ? Number(item.ultimoCostoCompra) : Number(item.costoPromedio || 0);
  if (referencia > 0 && Math.abs(costo - referencia) / referencia >= UMBRAL_DESVIACION_COSTO) {
    alertas.push("Difiere 15% o más del costo de compra de referencia");
  }
  return alertas;
}
