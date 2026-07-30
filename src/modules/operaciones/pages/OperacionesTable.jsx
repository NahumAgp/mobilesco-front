import CatalogRowActions from "../../../components/ui/CatalogRowActions.jsx";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge.jsx";
import CatalogTable, { CatalogEmptyState } from "../../../components/ui/CatalogTable.jsx";

export default function OperacionesTable({ data, onEditar, onEliminar }) {
  return (
    <CatalogTable>
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light catalog-table-head">
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Centro de trabajo</th>
            <th>Costo/min</th>
            <th>Costo/hora</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data?.length > 0 ? (
            data.map((operacion) => (
              <tr
                key={operacion.id}
                className="catalog-table-row"
                onClick={() => onEditar(operacion)}
              >
                <td>{operacion.id}</td>
                <td>
                  <span className="badge text-bg-light border catalog-code-badge">
                    {operacion.codigo}
                  </span>
                </td>
                <td><span className="fw-semibold">{operacion.nombre}</span></td>
                <td>
                  {operacion.descripcion?.length > 50
                    ? `${operacion.descripcion.substring(0, 50)}…`
                    : operacion.descripcion || "-"}
                </td>
                <td>
                  <span className="badge bg-info-subtle text-info border border-info-subtle">
                    {operacion.centroTrabajoNombre || "-"}
                  </span>
                </td>
                <td className="text-end">
                  {operacion.costoMinuto ? `$${operacion.costoMinuto.toFixed(2)}` : "-"}
                </td>
                <td className="text-end">
                  {operacion.costoHora ? `$${operacion.costoHora.toFixed(2)}` : "-"}
                </td>
                <td><CatalogStatusBadge active={operacion.activo} /></td>
                <td className="catalog-actions">
                  <CatalogRowActions
                    item={operacion}
                    active={operacion.activo}
                    onEdit={onEditar}
                    onToggle={onEliminar}
                    toggleActiveLabel="Eliminar"
                    toggleInactiveLabel="Eliminar"
                    toggleTitle="Eliminar operación"
                  />
                </td>
              </tr>
            ))
          ) : (
            <CatalogEmptyState
              colSpan={9}
              icon="bi-tools"
              title="No hay operaciones registradas"
              description="Ajusta los filtros o crea una nueva operación."
            />
          )}
        </tbody>
      </table>
    </CatalogTable>
  );
}
