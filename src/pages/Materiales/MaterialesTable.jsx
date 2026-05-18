// pages/Materiales/components/MaterialesTable.jsx
export default function MaterialesTable({ data, onEditar, onCambiarEstado }) {
  const formatearFecha = (valor) => {
    if (!valor) return "-";

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "-";

    return fecha.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <div className="card shadow-sm border-0 materiales-table-card">
      <div className="table-responsive materiales-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light materiales-table-head">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Fecha Actualizacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((material) => (
                <tr
                  key={material.id}
                  className="materiales-table-row"
                  onClick={() => onEditar(material)}
                  role="button"
                >
                  <td>{material.id}</td>
                  <td>
                    <span className="badge text-bg-light border materiales-code-badge">
                      {material.codigo || "-"}
                    </span>
                  </td>
                  <td>
                    <span className="fw-semibold">{material.nombre || "-"}</span>
                  </td>
                  <td>
                    <span className="materiales-description text-muted">
                      {material.descripcion || "-"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        material.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {material.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{formatearFecha(material.fechaRegistro)}</td>
                  <td>{formatearFecha(material.fechaActualizacion)}</td>
                  <td className="materiales-actions">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn materiales-brand-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(material);
                        }}
                        title="Editar"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </button>
                      <button
                        className="btn materiales-brand-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCambiarEstado(material);
                        }}
                        title={material.activo ? "Desactivar" : "Activar"}
                      >
                        <i className={`bi ${material.activo ? "bi-toggle-on" : "bi-toggle-off"} me-1`}></i>
                        {material.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5 d-block">No hay materiales registrados</span>
                  <p className="text-secondary mt-2 mb-0">
                    Comienza creando un nuevo material
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
