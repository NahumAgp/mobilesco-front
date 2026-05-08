import React from "react";
import { API_BASE_URL } from "../../config/apiConfig";

function getFotoSrc(empleado) {
  if (!empleado?.fotoUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(empleado.fotoUrl)) {
    return empleado.fotoUrl;
  }

  return `${API_BASE_URL}${empleado.fotoUrl}`;
}

function getIniciales(empleado) {
  const nombre = empleado?.nombre?.trim()?.charAt(0) || "";
  const apellido = empleado?.apellidoPaterno?.trim()?.charAt(0) || "";
  return `${nombre}${apellido}`.trim() || "U";
}

export default function EmpleadosTable({ data, onEditar, onEliminar }) {

  return (

    <div className="card shadow-sm border-0 empleados-table-card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Foto</th>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Fecha de Registro</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5 text-muted">
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              data.map((e) => {
                const fotoSrc = getFotoSrc(e);

                return (
                  <tr key={e.id}>
                    <td>
                      {fotoSrc ? (
                        <img
                          src={fotoSrc}
                          alt={`${e.nombre || "Empleado"} ${e.apellidoPaterno || ""}`.trim()}
                          className="empleados-avatar"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            const fallback = event.currentTarget.nextElementSibling;
                            if (fallback) {
                              fallback.classList.remove("d-none");
                            }
                          }}
                        />
                      ) : null}
                      <div className={`empleados-avatar placeholder ${fotoSrc ? "d-none" : ""}`}>
                        {getIniciales(e)}
                      </div>
                    </td>

                    <td>{e.id}</td>

                    <td>
                      <div className="fw-semibold">
                        {e.nombre} {e.apellidoPaterno} {e.apellidoMaterno}
                      </div>
                    </td>

                    <td>{e.telefono || "-"}</td>

                    <td>{e.correo || "-"}</td>

                    <td>
                      {e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }) : "-"}
                    </td>

                    <td>
                      <span
                        className={
                          e.tieneCuenta
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {e.tieneCuenta ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          e.activo
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {e.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => onEditar?.(e)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onEliminar?.(e.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

  );

}
