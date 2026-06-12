import CatalogRowActions from "../../../components/ui/CatalogRowActions.jsx";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge.jsx";

export default function CategoriaProductosTable({ data, loading = false, onVer, onEditar }) {
  return (
    <div className="card shadow-sm border-0 catalog-table-card categorias-table-card">
      <div className="table-responsive catalog-table-scroll categorias-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head categorias-table-head">
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Material</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="spinner-border text-secondary" role="status" aria-hidden="true"></div>
                    <span className="fs-5">Cargando productos...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((producto) => (
                <tr
                  key={producto.id}
                  className="catalog-table-row categorias-table-row"
                  onClick={() => onVer?.(producto)}
                  role={onVer ? "button" : undefined}
                >
                  <td>{producto.id}</td>
                  <td>
                    <span className="badge bg-secondary">{producto.sku || "-"}</span>
                  </td>
                  <td>
                    <span className="fw-semibold">{producto.nombre || "-"}</span>
                  </td>
                  <td>{producto.modeloNombre || "-"}</td>
                  <td>{producto.colorNombre || "-"}</td>
                  <td>{producto.materialNombre || "-"}</td>
                  <td>
                    <CatalogStatusBadge active={producto.activo} />
                  </td>
                  <td className="catalog-actions categorias-actions">
                    <div className="btn-group btn-group-sm" role="group">
                      {onVer && (
                        <button
                          type="button"
                          className="btn catalog-brand-outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            onVer(producto);
                          }}
                          title="Ver detalles"
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver
                        </button>
                      )}
                      {onEditar && (
                        <CatalogRowActions
                          item={producto}
                          active={producto.activo}
                          onEdit={onEditar}
                          group={false}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-box fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay productos en esta categoria</span>
                  <p className="text-secondary mt-2">Aun no se han asignado productos con este nivel</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
