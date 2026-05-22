export default function OperacionesTable({ data, onEditar, onEliminar }) {
  return (
    <div className="card">
      <div
        className="table-responsive"
        style={{
          height: "calc(100vh - 350px)",
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
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Centro Trabajo</th>
              <th>Costo/Min</th>
              <th>Costo/Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((operacion) => (
                <tr
                  key={operacion.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(operacion)}
                >
                  <td>{operacion.id}</td>
                  <td>
                    <span className="badge bg-secondary">{operacion.codigo}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{operacion.nombre}</span>
                  </td>
                  <td>
                    {operacion.descripcion && operacion.descripcion.length > 50 
                      ? `${operacion.descripcion.substring(0, 50)}...` 
                      : operacion.descripcion || "-"}
                  </td>
                  <td>
                    <span className="badge bg-info-subtle text-info border border-info-subtle">
                      {operacion.centroTrabajoNombre || "-"}
                    </span>
                  </td>
                  <td className="text-end">
                    {operacion.costoMinuto ? `$${operacion.costoMinuto.toFixed(2)}` : "-"}
                  </td>
                  <td className="text-end">
                    {operacion.costoHora ? `$${operacion.costoHora.toFixed(2)}` : "-"}
                  </td>
                  <td>
                    <span
                      className={
                        operacion.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {operacion.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(operacion);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(operacion.id);
                      }}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted py-5">
                  <i className="bi bi-tools fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay operaciones registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva operación</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}