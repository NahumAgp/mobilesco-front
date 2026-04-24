const API_BASE_URL = "http://localhost:8081";

const getModeloImagenUrl = (modelo) => {
  const raw =
    modelo?.imagenUrl ||
    modelo?.urlImagen ||
    modelo?.imagenPrincipalUrl ||
    modelo?.fotoUrl ||
    modelo?.imagen?.url ||
    modelo?.imagenPrincipal?.url ||
    "";

  if (!raw || typeof raw !== "string") return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_BASE_URL}${raw}`;
  return `${API_BASE_URL}/${raw}`;
};

export default function TiposProductoTable({ data, onEditar, onEliminar }) {
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
              <th>Descripcion</th>
              <th>Familia</th>
              <th>Codigo</th>
              <th>Estado</th>
              <th>Fecha Creacion</th>
              <th>Acciones</th>
              <th>Imagen</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((tipo) => {
                const imagenUrl = getModeloImagenUrl(tipo);

                return (
                  <tr
                    key={tipo.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onEditar(tipo)}
                  >
                    <td>{tipo.id}</td>
                    <td>
                      <span className="fw-semibold">{tipo.nombre}</span>
                    </td>
                    <td>
                      {tipo.descripcion && tipo.descripcion.length > 50
                        ? `${tipo.descripcion.substring(0, 50)}...`
                        : tipo.descripcion || "-"}
                    </td>
                    <td>{tipo.familiaNombre || "-"}</td>
                    <td>{tipo.codigo || "-"}</td>
                    <td>
                      <span
                        className={
                          tipo.activo
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {tipo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      {tipo.createdAt
                        ? new Date(tipo.createdAt).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit"
                          })
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(tipo);
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminar(tipo.id);
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar
                      </button>
                    </td>
                    <td>
                      {imagenUrl ? (
                        <img
                          src={imagenUrl}
                          alt={`Modelo ${tipo.nombre || tipo.codigo || tipo.id}`}
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6"
                          }}
                        />
                      ) : (
                        <div
                          className="d-inline-flex align-items-center justify-content-center bg-light text-muted border rounded"
                          style={{ width: "42px", height: "42px", fontSize: "11px" }}
                          title="Sin imagen"
                        >
                          N/A
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted py-5">
                  <i className="bi bi-tags fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay tipos de producto registrados</span>
                  <p className="text-secondary mt-2">Comienza creando un nuevo tipo</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
