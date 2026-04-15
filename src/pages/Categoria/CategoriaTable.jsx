// Recibimos props desde la página:
// data → lista de categorías
// onEditar → función para editar
// onEliminar → función para eliminar
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
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>

          {/* ================== CUERPO ================== */}
          <tbody>

            {data && data.length > 0 ? (

              data.map((categoria) => (
                <tr
                  key={categoria.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(categoria)}
                >

                  <td>{categoria.id}</td>
                  
                  <td>
                    <span className="fw-semibold">
                      {categoria.nombre}
                    </span>
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
                    {new Date(categoria.fechaRegistro).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
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
                {/* 🔥 Tienes 6 columnas */}
                <td colSpan="6" className="text-center text-muted py-5">
                  <i className="bi bi-folder fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay categorías registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva categoría</p>
                </td>
              </tr>

            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}