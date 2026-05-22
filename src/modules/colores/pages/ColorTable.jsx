import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

export default function ColorTable({ data, onEditar, onCambiarEstado }) {
  return (
    <div className="card shadow-sm border-0 catalog-table-card colores-table-card">
      <div className="table-responsive catalog-table-scroll colores-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head colores-table-head">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
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
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-palette fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay colores registrados</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
