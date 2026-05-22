import React from "react";
import { API_BASE_URL } from "../../../config/apiConfig";
import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";

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

export default function EmpleadosTable({ data, onEditar, onCambiarEstado }) {

  return (

    <div className="card shadow-sm border-0 catalog-table-card empleados-table-card">
      <div className="table-responsive catalog-table-scroll">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light catalog-table-head empleados-table-head">
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
                  <tr
                    key={e.id}
                    className="catalog-table-row empleados-table-row"
                    onClick={() => onEditar?.(e)}
                    role="button"
                  >
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
                      <CatalogStatusBadge active={e.tieneCuenta} activeText="Activa" inactiveText="Inactiva" />
                    </td>

                    <td>
                      <CatalogStatusBadge active={e.activo} />
                    </td>

                    <td className="catalog-actions empleados-actions text-end">
                      <CatalogRowActions
                        item={e}
                        active={e.activo}
                        onEdit={onEditar}
                        onToggle={onCambiarEstado}
                      />
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
