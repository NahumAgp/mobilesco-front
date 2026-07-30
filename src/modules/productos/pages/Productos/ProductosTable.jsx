import CatalogRowActions from "../../../../components/ui/CatalogRowActions.jsx";
import CatalogStatusBadge from "../../../../components/ui/CatalogStatusBadge.jsx";
import CatalogTable, { CatalogEmptyState } from "../../../../components/ui/CatalogTable.jsx";

export default function ProductosTable({
  data,
  onVer,
  onEditar,
  onDesactivar,
  canEliminarDefinitivo = false
}) {
  return (
    <CatalogTable className="productos-table-card" scrollClassName="productos-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head productos-table-head">
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Línea</th>
              <th>Familia</th>
              <th>Subfamilia</th>
              <th>Nivel</th>
              <th>Material</th>
              <th>Peso volumetrico (kg)</th>
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
                  <td>{producto.familiaNombre || producto.familia?.nombre || '-'}</td>
                  <td>{producto.subfamiliaNombre || producto.subfamilia?.nombre || producto.modelo?.subfamilia?.nombre || '-'}</td>
                  <td>{producto.nivelNombre || producto.categoriaNombre || '-'}</td>
                  <td>{producto.materialNombre || '-'}</td>
                  <td className="text-end">{producto.pesoVolumetrico != null ? Number(producto.pesoVolumetrico).toFixed(2) : '-'}</td>
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
                          onToggle={onDesactivar}
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
              <CatalogEmptyState
                colSpan={12}
                icon="bi-box"
                title="No hay productos registrados"
                description="Ajusta los filtros o crea un nuevo producto."
              />
            )}
          </tbody>
        </table>
    </CatalogTable>
  );
}
