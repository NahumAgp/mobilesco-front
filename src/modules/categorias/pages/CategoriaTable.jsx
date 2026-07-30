import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";
import CatalogTable, { CatalogEmptyState } from "../../../components/ui/CatalogTable.jsx";

export default function CategoriaTable({ data, onEditar, onCambiarEstado }) {
  return (
    <CatalogTable className="categorias-table-card" scrollClassName="categorias-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head categorias-table-head">
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
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
              <CatalogEmptyState
                colSpan={7}
                icon="bi-folder"
                title="No hay categorías registradas"
                description="Ajusta los filtros o crea una nueva categoría."
              />
            )}
          </tbody>
        </table>
    </CatalogTable>
  );
}
