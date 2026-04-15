function Cotizacion() {
    const cotizaciones = [
    {
      folio: "COT-2543",
      cliente: "Escuela Secundaria Técnica #45",
      fecha: "2024-05-14",
      monto: "$45,200",
      estatus: "Seguimiento",
    },
    {
      folio: "COT-2542",
      cliente: "Gobierno del Estado (Hidalgo)",
      fecha: "2024-05-14",
      monto: "$128,500",
      estatus: "Pendiente",
    },
    {
      folio: "COT-2541",
      cliente: "Distribuidora del Centro",
      fecha: "2024-05-13",
      monto: "$18,400",
      estatus: "Cerrada",
    },
    {
      folio: "COT-2540",
      cliente: "Colegio Montessori",
      fecha: "2024-05-12",
      monto: "$32,100",
      estatus: "Seguimiento",
    },
    {
      folio: "COT-2539",
      cliente: "Particular - Ana García",
      fecha: "2024-05-11",
      monto: "$5,800",
      estatus: "Pendiente",
    },
    {
      folio: "COT-2538",
      cliente: "Oficinas Corporativas S.A.",
      fecha: "2024-05-10",
      monto: "$210,000",
      estatus: "Cerrada",
    },
  ];

  const badgePorEstatus = (estatus) => {
    switch (estatus) {
      case "Seguimiento":
        return "bg-warning-subtle text-warning";
      case "Pendiente":
        return "bg-primary-subtle text-primary";
      case "Cerrada":
        return "bg-success-subtle text-success";
      default:
        return "bg-secondary";
    }
  };

    return ( 
        
    <div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Registro de Cotizaciones</h2>
          <p className="text-muted mb-0">
            Historial y seguimiento de cotizaciones generadas.
          </p>
        </div>

        <button className="btn btn-success">
          + Nueva Cotización
        </button>
      </div>

      {/* Filtros fake */}
      <div className="card mb-4">
        <div className="card-body d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por folio o cliente..."
          />
          <select className="form-select w-auto">
            <option>Todos los estatus</option>
            <option>Seguimiento</option>
            <option>Pendiente</option>
            <option>Cerrada</option>
          </select>
          <input type="date" className="form-control w-auto" />
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>No. Cotización</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estatus</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => (
                <tr key={c.folio}>
                  <td className="fw-semibold">{c.folio}</td>
                  <td>{c.cliente}</td>
                  <td className="text-muted">{c.fecha}</td>
                  <td className="fw-semibold">{c.monto}</td>
                  <td>
                    <span className={`badge ${badgePorEstatus(c.estatus)}`}>
                      {c.estatus}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1">
                      👁
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-1">
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
     );
}

export default Cotizacion;