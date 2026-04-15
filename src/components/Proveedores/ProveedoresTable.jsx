// Recibimos props desde la página:
// data → lista de proveedores
// onEditar → función para editar
// onEliminar → función para eliminar
export default function ProveedoresTable({ data, onEditar, onEliminar }) {

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
              <th>Id</th>
              <th>Razón Social</th>
              <th>Contacto</th>
              <th>Tipo de Insumo</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Fecha de Registro</th>
              <th>Ultima Fecha de Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>

          {/* ================== CUERPO ================== */}
          <tbody>

            {data && data.length > 0 ? (

              data.map((proveedor) => (
                <tr
                  key={proveedor.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onEditar(proveedor)}
                >

                  <td>{proveedor.id}</td>
                  <td>{proveedor.razonSocial}</td>
                  <td>
                    {proveedor.nombre} {proveedor.apellidoPaterno} {proveedor.apellidoMaterno}
                  </td>
                  <td>
                    {proveedor.tipoInsumo}
                  </td>
                  <td>{proveedor.correo}</td>
                  <td>{proveedor.telefono}</td>

                  <td>
                    <span
                      className={
                        proveedor.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {proveedor.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    {proveedor.fechaRegistro
                      ? new Date(proveedor.fechaRegistro).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {proveedor.fechaUltimoContacto
                      ? new Date(proveedor.fechaUltimoContacto).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(proveedor);
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(proveedor.id);
                      }}
                    >
                      Eliminar
                    </button>
                  </td>

                </tr>
              ))

            ) : (

              <tr>
                {/* 🔥 Tienes 10 columnas */}
                <td colSpan="10" className="text-center text-muted py-3">
                  No hay proveedores registrados
                </td>
              </tr>

            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}
