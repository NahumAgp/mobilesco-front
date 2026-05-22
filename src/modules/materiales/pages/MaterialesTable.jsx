// pages/Materiales/components/MaterialesTable.jsx
import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

export default function MaterialesTable({ data, onEditar, onCambiarEstado }) {
  const formatearFecha = (valor) => {
    if (!valor) return "-";

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "-";

    return fecha.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <div className="card shadow-sm border-0 catalog-table-card materiales-table-card">
      <div className="table-responsive catalog-table-scroll materiales-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head materiales-table-head">
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Fecha Actualizacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((material) => (
                <tr
                  key={material.id}
                  className="catalog-table-row materiales-table-row"
                  onClick={() => onEditar(material)}
                  role="button"
                >
                  <td>{material.id}</td>
                  <td>
                    <span className="badge text-bg-light border catalog-code-badge materiales-code-badge">
                      {material.codigo || "-"}
                    </span>
                  </td>
                  <td>
                    <span className="fw-semibold">{material.nombre || "-"}</span>
                  </td>
                  <td>
                    <span className="catalog-description materiales-description text-muted">
                      {material.descripcion || "-"}
                    </span>
                  </td>
                  <td>
                    <CatalogStatusBadge active={material.activo} />
                  </td>
                  <td>{formatearFecha(material.fechaRegistro)}</td>
                  <td>{formatearFecha(material.fechaActualizacion)}</td>
                  <td className="catalog-actions materiales-actions">
                    <CatalogRowActions
                      item={material}
                      active={material.activo}
                      onEdit={onEditar}
                      onToggle={onCambiarEstado}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-5">
                  <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5 d-block">No hay materiales registrados</span>
                  <p className="text-secondary mt-2 mb-0">
                    Comienza creando un nuevo material
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
