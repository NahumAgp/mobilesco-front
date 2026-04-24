export default function ColorTable({ data, onEditar, onEliminar }) {
  return (
    <div className="card">
      <div className="table-responsive" style={{ height: "calc(100vh - 350px)", overflowY: "auto" }}>
        <table className="table table-hover mb-0">
          <thead
            className="table-light"
            style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "white" }}
          >
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Hex</th>
              <th>Muestra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((color) => (
                <tr key={color.id} style={{ cursor: "pointer" }} onClick={() => onEditar(color)}>
                  <td>{color.id}</td>
                  <td>
                    <span className="badge bg-secondary">{color.codigo || "-"}</span>
                  </td>
                  <td>{color.nombre || "-"}</td>
                  <td>{color.hex || "-"}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 28,
                        height: 18,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        background: color.hex || "#ffffff"
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(color);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(color.id);
                      }}
                    >
                      <i className="bi bi-trash me-1"></i>Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  <i className="bi bi-palette fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay colores registrados</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
