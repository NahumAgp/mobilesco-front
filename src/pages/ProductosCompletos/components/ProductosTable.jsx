const getFecha = (valor) => {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "-" : fecha.toLocaleDateString();
};

const contarImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes.length;
  if (!imagenes || typeof imagenes !== "object") return 0;

  const totalVariantes = Object.values(imagenes.variantes || {}).reduce((acc, lista) => {
    if (!Array.isArray(lista)) return acc;
    return acc + lista.length;
  }, 0);

  return totalVariantes + (imagenes.modelo ? 1 : 0);
};

export default function ProductosTable({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-box-seam fs-1 text-muted"></i>
          <p className="mt-3 mb-0">No hay productos creados aun</p>
          <small className="text-muted">Usa el boton "Nuevo Producto" para comenzar</small>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Variantes</th>
              <th>Imagenes</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((producto) => {
              const modelo = producto?.modelo || {};
              const variantes = Array.isArray(producto?.variantes) ? producto.variantes : [];
              const totalImagenes = contarImagenes(producto?.imagenes);

              return (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>
                    <code>{modelo.codigo || "-"}</code>
                  </td>
                  <td className="fw-semibold">{modelo.nombre || "-"}</td>
                  <td>
                    <span className="badge bg-info">{variantes.length} variantes</span>
                  </td>
                  <td>
                    <span className="badge bg-warning">{totalImagenes} imagenes</span>
                  </td>
                  <td>
                    <span className={`badge ${modelo.activo ? "bg-success" : "bg-secondary"}`}>
                      {modelo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{getFecha(producto.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
