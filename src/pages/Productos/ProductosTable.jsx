export default function ProductosTable({ data, onVer, onEditar, onEliminar }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="card">
      <div
        className="table-responsive"
        style={{
          height: "calc(100vh - 400px)",
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
              <th>SKU</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Línea</th>
              <th>Categoría</th>
              <th>Material</th>
              <th>Peso (kg)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((producto) => (
                <tr
                  key={producto.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onVer(producto)}
                >
                  <td>{producto.id}</td>
                  <td>
                    <span className="badge bg-secondary">{producto.sku}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{producto.nombre}</span>
                  </td>
                  <td>{producto.tipoProductoNombre || '-'}</td>
                  <td>{producto.lineaNombre || '-'}</td>
                  <td>{producto.categoriaNombre || '-'}</td>
                  <td>{producto.materialNombre || '-'}</td>
                  <td className="text-end">{producto.pesoKg?.toFixed(2) || '-'}</td>
                  <td>
                    <span
                      className={
                        producto.activo
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-outline-info"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVer(producto);
                        }}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(producto);
                        }}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminar(producto.id);
                        }}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-muted py-5">
                  <i className="bi bi-box fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay productos registrados</span>
                  <p className="text-secondary mt-2">Comienza creando un nuevo producto</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}