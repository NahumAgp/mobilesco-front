import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

export default function ProveedoresTable({ data, onEditar, onCambiarEstado }) {
  return (
    <div className="card shadow-sm border-0 catalog-table-card proveedores-table-card">
      <div className="table-responsive catalog-table-scroll proveedores-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head proveedores-table-head">
            <tr>
              <th>ID</th>
              <th>Razon social</th>
              <th>Contacto</th>
              <th>Tipo de insumo</th>
              <th>Correo</th>
              <th>Telefono</th>
              <th>Estado</th>
              <th>Fecha de registro</th>
              <th>Ultimo contacto</th>
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
                  <td>{proveedor.tipoInsumo || "-"}</td>
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
              <tr>
                <td colSpan="10" className="text-center text-muted py-5">
                  <i className="bi bi-truck fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5 d-block">No hay proveedores registrados</span>
                  <p className="text-secondary mt-2 mb-0">
                    Comienza creando un nuevo proveedor
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
