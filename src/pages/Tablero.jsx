export default function Tablero() {
  const stats = [
    {
      titulo: "Cotizaciones Activas",
      valor: 12,
      nota: "+2 hoy",
      color: "primary",
    },
    {
      titulo: "Por Aprobar Viabilidad",
      valor: 4,
      nota: "Requiere atención",
      color: "warning",
    },
    {
      titulo: "Cotizado este mes",
      valor: "$452,000",
      nota: "+12% vs mes anterior",
      color: "success",
    },
    {
      titulo: "Tasa de Cierre",
      valor: "68%",
      nota: "Estable",
      color: "secondary",
    },
  ];

  const cotizaciones = [
    {
      id: 2543,
      cliente: "Escuela Secundaria Técnica #45",
      detalle: "30 Mesas Binarias",
      monto: "$45,200",
      tiempo: "Hace 2 horas",
      estado: "En Proceso",
      badge: "dark",
    },
    {
      id: 2542,
      cliente: "Gobierno del Estado (Hidalgo)",
      detalle: "Lote Mobiliario Oficina",
      monto: "$128,500",
      tiempo: "Hace 5 horas",
      estado: "Revisión Viabilidad",
      badge: "danger",
    },
    {
      id: 2541,
      cliente: "Distribuidora del Centro",
      detalle: "12 Pizarrones Blancos",
      monto: "$18,400",
      tiempo: "Ayer",
      estado: "Enviada",
      badge: "success",
    },
    {
      id: 2540,
      cliente: "Colegio Montessori",
      detalle: "Estantería Personalizada",
      monto: "$32,100",
      tiempo: "Ayer",
      estado: "Borrador",
      badge: "secondary",
    },
  ];

  return (
    <div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tablero Principal</h2>
          <p className="text-muted mb-0">
            Resumen de actividad y alertas pendientes.
          </p>
        </div>

        <button className="btn btn-success">
          + Nueva Cotización
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-md-3" key={i}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">{s.titulo}</span>
                  <span
                    className={`text-${s.color} fw-bold`}
                    style={{ fontSize: 12 }}
                  >
                    ●
                  </span>
                </div>

                <h3 className="fw-bold mt-2 mb-1">{s.valor}</h3>
                <small className="text-muted">{s.nota}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="row g-3">

        {/* Cotizaciones recientes */}
        <div className="col-md-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-1">Cotizaciones Recientes</h5>
              <p className="text-muted mb-3">
                Últimos movimientos registrados en el sistema.
              </p>

              {cotizaciones.map((c) => (
                <div
                  key={c.id}
                  className="d-flex justify-content-between align-items-center py-3 border-bottom"
                >
                  <div className="d-flex gap-3 align-items-center">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                      style={{ width: 42, height: 42 }}
                    >
                      <strong>{c.id}</strong>
                    </div>

                    <div>
                      <div className="fw-semibold">{c.cliente}</div>
                      <small className="text-muted">{c.detalle}</small>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="fw-semibold">{c.monto}</div>
                    <small className="text-muted">{c.tiempo}</small>
                  </div>

                  <span className={`badge bg-${c.badge}`}>
                    {c.estado}
                  </span>
                </div>
              ))}

              <div className="text-center mt-3">
                <button className="btn btn-link text-decoration-none">
                  Ver todas las cotizaciones
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-1">Alertas de Sistema</h5>
              <p className="text-muted mb-3">Acciones requeridas.</p>

              <div className="alert alert-warning">
                <strong>Cambio de Precios</strong>
                <p className="mb-2 small">
                  Se detectó una actualización en la lista de precios de
                  proveedores de madera (Tableros). Revisar impacto en márgenes.
                </p>
                <button className="btn btn-sm btn-outline-warning">
                  Revisar Precios
                </button>
              </div>

              <div className="alert alert-primary">
                <strong>Recordatorios de Seguimiento</strong>
                <p className="mb-0 small">
                  3 cotizaciones vencen esta semana.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
