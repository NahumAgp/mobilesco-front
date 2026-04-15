// pages/Materiales/components/MaterialesTable.jsx
export default function MaterialesTable({ data, onEditar, onEliminar }) {
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
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Fecha Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((material) => (
                <tr
                  key={material.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(material)}
                >
                  <td>{material.id}</td>
                  <td>
                    <span className="fw-semibold">{material.nombre}</span>
                  </td>
                  <td>
                    {material.descripcion && material.descripcion.length > 50 
                      ? `${material.descripcion.substring(0, 50)}...` 
                      : material.descripcion || "-"}
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
                  <td>
                    {new Date(material.fechaRegistro).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>

                  <td>
                    {new Date(material.fechaActualizacion).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(material);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(material.id);
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
                  <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay materiales registrados</span>
                  <p className="text-secondary mt-2">Comienza creando un nuevo material</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}