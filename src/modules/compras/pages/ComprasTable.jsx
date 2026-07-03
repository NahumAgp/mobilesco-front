export default function ComprasTable({
  data,
  onVer,
  onEliminar,
  puedeEliminar = false
}) {
  const getBadgeColor = (estado) => {
    switch (estado) {
      case "PENDIENTE": return "warning";
      case "RECIBIDA_PARCIAL": return "info";
      case "RECIBIDA": return "success";
      case "CANCELADA": return "danger";
      default: return "secondary";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  return (
    <div className="card">
      <div
        className="table-responsive"
        style={{
          height: "calc(100vh - 400px)",
          overflowY: "auto"
        }}
      >
        <table className="table table-hover mb-0">
          <thead
            className="table-light"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: "white"
            }}
          >
            <tr>
              <th>ID</th>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Documento</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((compra) => (
                <tr
                  key={compra.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onVer?.(compra)}
                  className={
                    compra.estado === "CANCELADA" ? "table-secondary" :
                    compra.estado === "RECIBIDA_PARCIAL" ? "table-info" :
                    compra.estado === "RECIBIDA" ? "table-success" : ""
                  }
                >
                  <td>{compra.id}</td>
                  <td>
                    <span className="fw-semibold">{compra.folio}</span>
                  </td>
                  <td>{formatDate(compra.fechaCompra)}</td>
                  <td>
                    <div>
                      <span className="fw-semibold">{compra.proveedorRazonSocial}</span>
                      <br />
                      <small className="text-muted">{compra.proveedorRfc}</small>
                    </div>
                  </td>
                  <td>
                    <small>
                      {compra.tipoDocumento} {compra.numeroDocumento}
                    </small>
                  </td>
                  <td className="text-end fw-bold">
                    {formatCurrency(compra.total)}
                  </td>
                  <td>
                    <span className={`badge bg-${getBadgeColor(compra.estado)}-subtle text-${getBadgeColor(compra.estado)} border border-${getBadgeColor(compra.estado)}-subtle`}>
                      {compra.estado}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      <a
                        className="btn btn-outline-info"
                        href={`/compras/${compra.id}/ver`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        title="Ver detalles"
                      >
                        <i className="bi bi-list-ul"></i>
                      </a>

                      {compra.estado === "PENDIENTE" && puedeEliminar && (
                        <button
                          className="btn btn-outline-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEliminar(compra.id);
                          }}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-cart fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay compras registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva compra</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
