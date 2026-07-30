import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";
import CatalogTable, { CatalogEmptyState } from "../../../components/ui/CatalogTable.jsx";

export default function ColorTable({ data, onEditar, onCambiarEstado }) {
  return (
    <CatalogTable className="colores-table-card" scrollClassName="colores-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head colores-table-head">
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Hex</th>
              <th>Muestra</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((color) => (
                <tr
                  key={color.id}
                  className="catalog-table-row colores-table-row"
                  onClick={() => onEditar(color)}
                  role="button"
                >
                  <td>{color.id}</td>
                  <td>
                    <span className="badge text-bg-light border catalog-code-badge colores-code-badge">{color.codigo || "-"}</span>
                  </td>
                  <td>{color.nombre || "-"}</td>
                  <td className="text-truncate" style={{ maxWidth: 220 }}>
                    {color.descripcion || "-"}
                  </td>
                  <td>{color.hex || "-"}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 28,
                        height: 18,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        background: color.hex || "#ffffff"
                      }}
                    />
                  </td>
                  <td>
                    <CatalogStatusBadge active={color.activo} />
                  </td>
                  <td className="catalog-actions colores-actions">
                    <CatalogRowActions
                      item={color}
                      active={color.activo}
                      onEdit={onEditar}
                      onToggle={onCambiarEstado}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <CatalogEmptyState
                colSpan={8}
                icon="bi-palette"
                title="No hay colores registrados"
                description="Ajusta la búsqueda o crea un nuevo color."
              />
            )}
          </tbody>
        </table>
    </CatalogTable>
  );
}
