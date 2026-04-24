export default function CategoriaTable({ data, onEditar, onEliminar }) {
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
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Fecha de Creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((categoria) => (
                <tr key={categoria.id} style={{ cursor: "pointer" }} onClick={() => onEditar(categoria)}>
                  <td>{categoria.id}</td>
                  <td>
                    <span className="badge bg-secondary">{categoria.codigo || "-"}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{categoria.nombre}</span>
                  </td>
                  <td>
                    {categoria.descripcion && categoria.descripcion.length > 50
                      ? `${categoria.descripcion.substring(0, 50)}...`
                      : categoria.descripcion || "-"}
                  </td>
                  <td>
                    <span
                      className={
                        categoria.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {categoria.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    {categoria.createdAt
                      ? new Date(categoria.createdAt).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })
                      : "-"}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(categoria);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(categoria.id);
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
                <td colSpan="7" className="text-center text-muted py-5">
                  <i className="bi bi-folder fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay categorias registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva categoria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
