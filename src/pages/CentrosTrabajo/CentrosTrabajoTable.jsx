export default function CentrosTrabajoTable({ data, onEditar, onEliminar }) {
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
              <th>Costo/Hora</th>
              <th>Capacidad</th>
              <th>Horas/Día</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((centro) => (
                <tr
                  key={centro.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(centro)}
                >
                  <td>{centro.id}</td>
                  <td>
                    <span className="badge bg-secondary">{centro.codigo}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{centro.nombre}</span>
                  </td>
                  <td>
                    {centro.descripcion && centro.descripcion.length > 50 
                      ? `${centro.descripcion.substring(0, 50)}...` 
                      : centro.descripcion || "-"}
                  </td>
                  <td className="text-end">
                    {centro.costoHora ? `$${centro.costoHora.toFixed(2)}` : "-"}
                  </td>
                  <td className="text-end">
                    {centro.capacidadDiaria ? `${centro.capacidadDiaria} ${centro.unidadCapacidad || ''}` : "-"}
                  </td>
                  <td className="text-end">
                    {centro.horasDisponiblesDia ? `${centro.horasDisponiblesDia} h` : "-"}
                  </td>
                  <td>
                    <span
                      className={
                        centro.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {centro.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(centro);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(centro.id);
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
                  <i className="bi bi-gear-wide-connected fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay centros de trabajo registrados</span>
                  <p className="text-secondary mt-2">Comienza creando un nuevo centro de trabajo</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}