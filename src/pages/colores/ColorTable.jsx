export default function ColorTable({ data, onEditar, onCambiarEstado }) {
  return (
    <div className="card shadow-sm border-0 colores-table-card">
      <div className="table-responsive colores-table-scroll">
        <table className="table table-hover mb-0">
          <thead className="table-light colores-table-head">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Hex</th>
              <th>Muestra</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((color) => (
                <tr key={color.id} className="colores-table-row" onClick={() => onEditar(color)}>
                  <td>{color.id}</td>
                  <td>
                    <span className="badge text-bg-light border colores-code-badge">{color.codigo || "-"}</span>
                  </td>
                  <td>{color.nombre || "-"}</td>
                  <td className="text-truncate" style={{ maxWidth: 220 }}>
                    {color.descripcion || "-"}
                  </td>
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
                    <span
                      className={
                        color.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {color.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="colores-actions">
                    <button
                      className="btn btn-sm colores-brand-outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(color);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCambiarEstado?.(color);
                      }}
                    >
                      <i className={`bi me-1 ${color.activo ? "bi-toggle-off" : "bi-toggle-on"}`}></i>
                      {color.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
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
