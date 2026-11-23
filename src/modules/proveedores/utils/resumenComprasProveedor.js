const fechaCompra = (compra) => String(compra?.fechaCompra || "").slice(0, 10);
const importeCompra = (compra) => {
  const importe = Number(compra?.total);
  return Number.isFinite(importe) ? importe : 0;
};

export function resumirComprasProveedor(compras, hoy = new Date()) {
  const ordenadas = [...(Array.isArray(compras) ? compras : [])]
    .sort((a, b) => fechaCompra(b).localeCompare(fechaCompra(a)));
  const vigentes = ordenadas.filter((compra) => compra.estado !== "CANCELADA");
  const monto = vigentes.reduce((total, compra) => total + importeCompra(compra), 0);
  const ultimaFecha = ordenadas.find((compra) => fechaCompra(compra))?.fechaCompra || null;
  const referencia = ultimaFecha && /^\d{4}-\d{2}/.test(ultimaFecha)
    ? new Date(Number(ultimaFecha.slice(0, 4)), Number(ultimaFecha.slice(5, 7)) - 1, 1)
    : hoy;
  const meses = Array.from({ length: 6 }, (_, index) => {
    const fecha = new Date(referencia.getFullYear(), referencia.getMonth() - 5 + index, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    return {
      clave,
      etiqueta: new Intl.DateTimeFormat("es-MX", { month: "short" }).format(fecha).replace(".", ""),
      anio: fecha.getFullYear(),
      monto: vigentes.filter((compra) => fechaCompra(compra).startsWith(clave))
        .reduce((total, compra) => total + importeCompra(compra), 0),
    };
  });
  const estados = [
    { clave: "recibidas", etiqueta: "Recibidas", cantidad: ordenadas.filter((compra) => compra.estado === "RECIBIDA").length },
    { clave: "proceso", etiqueta: "En proceso", cantidad: ordenadas.filter((compra) => compra.estado !== "RECIBIDA" && compra.estado !== "CANCELADA").length },
    { clave: "canceladas", etiqueta: "Canceladas", cantidad: ordenadas.filter((compra) => compra.estado === "CANCELADA").length },
  ];
  return {
    ordenadas,
    cantidad: ordenadas.length,
    monto,
    promedio: vigentes.length ? monto / vigentes.length : 0,
    ultimaFecha,
    meses,
    estados,
  };
}
