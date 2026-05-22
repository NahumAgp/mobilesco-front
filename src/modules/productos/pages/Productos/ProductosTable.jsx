import CatalogRowActions from "../../../../components/ui/CatalogRowActions.jsx";
import CatalogStatusBadge from "../../../../components/ui/CatalogStatusBadge.jsx";

export default function ProductosTable({
  data,
  onVer,
  onEditar,
  onDesactivar,
  canEliminarDefinitivo = false
}) {
  return (
    <div className="card shadow-sm border-0 catalog-table-card productos-table-card">
      <div className="table-responsive catalog-table-scroll productos-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head productos-table-head">
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
                  className="catalog-table-row productos-table-row"
                  onClick={() => onVer(producto)}
                  role="button"
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
                    <CatalogStatusBadge active={producto.activo} />
                  </td>
                  <td className="catalog-actions productos-actions">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn catalog-brand-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVer(producto);
                        }}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Ver
                      </button>
                      {canEliminarDefinitivo && (
                        <CatalogRowActions
                          item={producto}
                          active={producto.activo}
                          onEdit={onEditar}
                          onToggle={(productoActual) => onDesactivar(productoActual.id)}
                          toggleDisabled={!producto.activo}
                          toggleTitle={producto.activo ? "Desactivar" : "Producto inactivo"}
                          group={false}
                        />
                      )}
                      {!canEliminarDefinitivo && (
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
