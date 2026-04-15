import React from "react";

export default function UnidadesMedidaTable({ data, onEditar, onEliminar }) {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Simbolo</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                No hay unidades de medida registradas
              </td>
            </tr>
          ) : (
            data.map((unidad) => (
              <tr key={unidad.id}>
                <td>{unidad.id}</td>
                <td>{unidad.nombre}</td>
                <td>
                  <span className="badge bg-secondary">
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

                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => onEditar(unidad)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onEliminar(unidad.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}