import React from "react";

function SortHeader({ field, children, sortField, sortDirection, onSort }) {
  const activo = sortField === field;
  const icono = activo && sortDirection === "desc" ? "bi-sort-down" : "bi-sort-up";

  return (
    <button
      type="button"
      className="btn btn-link p-0 unidades-sort-button"
      onClick={() => onSort(field)}
    >
      {children}
      <i className={`bi ${activo ? icono : "bi-arrow-down-up"} small`}></i>
    </button>
  );
}

export default function UnidadesMedidaTable({
  data,
  onEditar,
  onEliminar,
  sortField,
  sortDirection,
  onSort
}) {
  return (
    <div className="card unidades-table-card">
      <div className="table-responsive unidades-table-scroll">
        <table className="table table-hover align-middle mb-0">
        <thead className="unidades-table-head">
          <tr>
            <th>
              <SortHeader field="id" sortField={sortField} sortDirection={sortDirection} onSort={onSort}>
                ID
              </SortHeader>
            </th>
            <th>
              <SortHeader field="nombre" sortField={sortField} sortDirection={sortDirection} onSort={onSort}>
                Nombre
              </SortHeader>
            </th>
            <th>
              <SortHeader field="simbolo" sortField={sortField} sortDirection={sortDirection} onSort={onSort}>
                Simbolo
              </SortHeader>
            </th>
            <th>
              <SortHeader field="tipo" sortField={sortField} sortDirection={sortDirection} onSort={onSort}>
                Tipo
              </SortHeader>
            </th>
            <th>
              <SortHeader field="estado" sortField={sortField} sortDirection={sortDirection} onSort={onSort}>
                Estado
              </SortHeader>
            </th>
            <th>Fecha registro</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center text-muted py-4">
                No hay unidades de medida registradas
              </td>
            </tr>
          ) : (
            data.map((unidad) => (
              <tr key={unidad.id} className="unidades-table-row">
                <td className="text-muted">#{unidad.id}</td>
                <td className="fw-semibold">{unidad.nombre}</td>
                <td>
                  <span className="badge text-bg-light border unidades-symbol-badge">
                    {unidad.simbolo}
                  </span>
                </td>
                <td>{unidad.tipo || "-"}</td>

                 <td>
                    <span
                      className={
                        unidad.estado
                          ? "badge bg-success-subtle text-success border border-success-subtle"
                          : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                      }
                    >
                      {unidad.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                <td className="text-muted">{unidad.fechaRegistro || "-"}</td>

                <td className="text-end unidades-actions">
                  <button
                    className="btn btn-sm unidades-brand-outline me-2"
                    onClick={() => onEditar(unidad)}
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    Editar
                  </button>
                  <button
                    className="btn btn-sm unidades-brand-danger"
                    onClick={() => onEliminar(unidad.id)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
