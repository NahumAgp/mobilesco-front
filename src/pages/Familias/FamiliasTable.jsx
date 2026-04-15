export default function FamiliasTable({ data, onEditar, onEliminar }) {

  return (
    <div className="card">

      <div className="table-responsive">

        <table className="table table-hover mb-0">

          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {data && data.length > 0 ? (

              data.map((familia) => (
                <tr
                  key={familia.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(familia)}
                >

                  <td>{familia.id}</td>
                  <td>{familia.nombre}</td>
                  <td>{familia.descripcion}</td>
                  <td>
                    {new Date(familia.fechaRegistro).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>

                  <td>
                    <span
                      className={
                        familia.activo
                          ? "badge bg-success"
                          : "badge bg-secondary"
                      }
                    >
                      {familia.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>

                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(familia);
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(familia.id);
                      }}
                    >
                      Eliminar
                    </button>

                  </td>

                </tr>
              ))

            ) : (

              <tr>
                <td colSpan="5" className="text-center text-muted py-3">
                  No hay familias registradas
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}