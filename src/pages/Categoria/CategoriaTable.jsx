export default function CategoriaTable({ data, onEditar, onCambiarEstado }) {
  return (
    <div className="card shadow-sm border-0 categorias-table-card">
      <div className="table-responsive categorias-table-scroll">
        <table className="table table-hover mb-0">
          <thead className="table-light categorias-table-head">
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
                <tr key={categoria.id} className="categorias-table-row" onClick={() => onEditar(categoria)}>
                  <td>{categoria.id}</td>
                  <td>
                    <span className="badge text-bg-light border categorias-code-badge">{categoria.codigo || "-"}</span>
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
                  <td className="categorias-actions">
                    <button
                      className="btn btn-sm categorias-brand-outline me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(categoria);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm categorias-brand-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCambiarEstado?.(categoria);
                      }}
                    >
                      <i className={`bi me-1 ${categoria.activo ? "bi-toggle-off" : "bi-toggle-on"}`}></i>
                      {categoria.activo ? "Desactivar" : "Activar"}
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
