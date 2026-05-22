import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

export default function CategoriaTable({ data, onEditar, onCambiarEstado }) {
  return (
    <div className="card shadow-sm border-0 catalog-table-card categorias-table-card">
      <div className="table-responsive catalog-table-scroll categorias-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head categorias-table-head">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Fecha de Creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((categoria) => (
                <tr
                  key={categoria.id}
                  className="catalog-table-row categorias-table-row"
                  onClick={() => onEditar(categoria)}
                  role="button"
                >
                  <td>{categoria.id}</td>
                  <td>
                    <span className="badge text-bg-light border catalog-code-badge categorias-code-badge">{categoria.codigo || "-"}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{categoria.nombre}</span>
                  </td>
                  <td>
                    {categoria.descripcion && categoria.descripcion.length > 50
                      ? `${categoria.descripcion.substring(0, 50)}...`
                      : categoria.descripcion || "-"}
                  </td>
                  <td>
                    <CatalogStatusBadge active={categoria.activo} />
                  </td>
                  <td>
                    {categoria.createdAt
                      ? new Date(categoria.createdAt).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })
                      : "-"}
                  </td>
                  <td className="catalog-actions categorias-actions">
                    <CatalogRowActions
                      item={categoria}
                      active={categoria.activo}
                      onEdit={onEditar}
                      onToggle={onCambiarEstado}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-5">
                  <i className="bi bi-folder fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay categorias registradas</span>
                  <p className="text-secondary mt-2">Comienza creando una nueva categoria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
