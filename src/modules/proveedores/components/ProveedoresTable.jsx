import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";
import CatalogTable, { CatalogEmptyState } from "../../../components/ui/CatalogTable.jsx";
import ProveedorPrioridadBadge from "./ProveedorPrioridadBadge.jsx";

function formatearCalificacion(value) {
  if (value === null || value === undefined || value === "") {
    return "Sin calificar";
  }

  const numero = Number(value);
  return Number.isFinite(numero) ? `${numero.toFixed(2)} / 100` : "Sin calificar";
}

export default function ProveedoresTable({ data, onEditar, onCambiarEstado }) {
  return (
    <CatalogTable className="proveedores-table-card" scrollClassName="proveedores-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head proveedores-table-head">
            <tr>
              <th>ID</th>
              <th>Razón social</th>
              <th>Contacto</th>
              <th>Tipo de insumo</th>
              <th>Calificación</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Fecha de registro</th>
              <th>Último contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((proveedor) => (
                <tr
                  key={proveedor.id}
                  className="catalog-table-row proveedores-table-row"
                  onClick={() => onEditar(proveedor)}
                  role="button"
                >
                  <td>{proveedor.id}</td>
                  <td>
                    <span className="fw-semibold">{proveedor.razonSocial || "-"}</span>
                  </td>
                  <td>
                    {[proveedor.nombre, proveedor.apellidoPaterno, proveedor.apellidoMaterno]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </td>
                  <td>{proveedor.tipoInsumoNombre || proveedor.tipoInsumo || "-"}</td>
                  <td>
                    <div className="d-flex flex-column align-items-start gap-1">
                      <span className={proveedor.calificacionProveedor == null ? "text-muted" : "fw-semibold"}>
                        {formatearCalificacion(proveedor.calificacionProveedor)}
                      </span>
                      <ProveedorPrioridadBadge calificacion={proveedor.calificacionProveedor} />
                    </div>
                  </td>
                  <td>{proveedor.correo || "-"}</td>
                  <td>{proveedor.telefono || "-"}</td>
                  <td>
                    <CatalogStatusBadge active={proveedor.activo} />
                  </td>
                  <td>
                    {proveedor.fechaRegistro
                      ? new Date(proveedor.fechaRegistro).toLocaleDateString("es-MX")
                      : "-"}
                  </td>
                  <td>
                    {proveedor.fechaUltimoContacto
                      ? new Date(proveedor.fechaUltimoContacto).toLocaleDateString("es-MX")
                      : "-"}
                  </td>
                  <td className="catalog-actions proveedores-actions">
                    <CatalogRowActions
                      item={proveedor}
                      active={proveedor.activo}
                      onEdit={onEditar}
                      onToggle={onCambiarEstado}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <CatalogEmptyState
                colSpan={11}
                icon="bi-truck"
                title="No hay proveedores registrados"
                description="Ajusta los filtros o crea un nuevo proveedor."
              />
            )}
          </tbody>
        </table>
    </CatalogTable>
  );
}
