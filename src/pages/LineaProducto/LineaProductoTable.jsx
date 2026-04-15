// Recibimos props desde la página:
// data → lista de líneas de producto
// onEditar → función para editar
// onEliminar → función para eliminar
export default function LineaProductoTable({ data, onEditar, onEliminar }) {

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

              data.map((linea) => (
                <tr
                  key={linea.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(linea)}
                >

                  <td>{linea.id}</td>
                  
                  <td>
                    <span className="fw-semibold">
                      {linea.nombre}
                    </span>
                  </td>
                  
                  <td>
                    {linea.descripcion && linea.descripcion.length > 50 
                      ? `${linea.descripcion.substring(0, 50)}...` 
                      : linea.descripcion || "-"}
                  </td>

                  <td>
                    <span
                      className={
                        linea.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {linea.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    {new Date(linea.fechaRegistro).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(linea);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(linea.id);
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
                  <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay líneas de producto registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva línea de producto</p>
                </td>
              </tr>

            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}