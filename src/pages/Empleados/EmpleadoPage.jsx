import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEmpleado } from "./useEmpleado";
import EmpleadosTable from "./EmpleadosTable";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./EmpleadoPage.css";

const PAGE_SIZE = 10;

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) {
    paginas.push("...");
  }

  for (let page = inicio; page <= fin; page += 1) {
    paginas.push(page);
  }

  if (fin < totalPages - 2) {
    paginas.push("...");
  }

  paginas.push(totalPages - 1);
  return paginas;
}

export default function EmpleadoPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);

  const { empleados, loadingLista, error, eliminarEmpleado } = useEmpleado();

  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((emp) => {
      const pasaFiltroTexto = (() => {
        if (!terminoBusqueda) return true;

        const palabras = terminoBusqueda.split(" ");
        const infoEmpleado = [
          emp.id?.toString(),
          emp.nombre,
          emp.apellidoPaterno,
          emp.apellidoMaterno,
          emp.telefono,
          emp.correo
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return palabras.every((palabra) => infoEmpleado.includes(palabra));
      })();

      const coincideEstatus =
        filtroEstatus === "TODOS" ||
        (filtroEstatus === "ACTIVO" && emp.activo) ||
        (filtroEstatus === "INACTIVO" && !emp.activo);

      const coincideSoloActivos = !soloActivos || emp.activo;

      return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
    });
  }, [empleados, filtroEstatus, soloActivos, terminoBusqueda]);

  const totalElements = empleadosFiltrados.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? paginaActual * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? Math.min(paginaActual * PAGE_SIZE + PAGE_SIZE, totalElements) : 0;
  const empleadosPagina = empleadosFiltrados.slice(
    paginaActual * PAGE_SIZE,
    paginaActual * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    if (page > 0 && totalPages === 0) {
      setPage(0);
      return;
    }

    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const handleBusquedaChange = (event) => {
    setBusqueda(event.target.value);
    setPage(0);
  };

  const handleFiltroEstatusChange = (event) => {
    setFiltroEstatus(event.target.value);
    setPage(0);
  };

  const handleSoloActivosChange = (event) => {
    setSoloActivos(event.target.checked);
    setPage(0);
  };

  const abrirEditar = (empleado) => {
    navigate(`/empleados/${empleado.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar este empleado?");
    if (!confirmacion) return;

    try {
      await eliminarEmpleado(id);
      setToastType("success");
      setToastMessage("Empleado eliminado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar empleado");
    }
  };

  const mostrarVacio = !loadingLista && !error && empleados.length === 0;
  const mostrarSinCoincidencias = !loadingLista && !error && empleados.length > 0 && totalElements === 0;

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Catálogo de Empleados"
        subtitle="Administración de empleados y colaboradores"
        actions={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-success"
              onClick={() => navigate("/empleados/nuevo")}
            >
              Nuevo Empleado
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando empleados...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3 empleados-filters-card shadow-sm border-0">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-lg-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, apellidos, teléfono, correo o ID..."
                value={busqueda}
                onChange={handleBusquedaChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={handleFiltroEstatusChange}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-12 col-md-3 d-flex justify-content-md-end">
              <div className="form-check form-switch empleados-filters-switch-col mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivos"
                  checked={soloActivos}
                  onChange={handleSoloActivosChange}
                />
                <label className="form-check-label" htmlFor="soloActivos">
                  Solo activos
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 empleados-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-people fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay empleados registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Crea el primer empleado para empezar a administrar el personal
            </p>
          </div>
        </div>
      ) : (
        <div className="empleados-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 empleados-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver empleados en esta página
                </p>
              </div>
            </div>
          ) : (
            <EmpleadosTable
              data={empleadosPagina}
              onEditar={abrirEditar}
              onEliminar={manejarEliminar}
            />
          )}

          {totalElements > 0 && (
            <div className="empleados-pagination-panel">
              <div className="empleados-pagination-summary">
                Mostrando {desde} a {hasta} de {totalElements} empleados
              </div>

              <nav aria-label="Paginación de empleados">
                <ul className="pagination mb-0 flex-wrap">
                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(0)}
                      disabled={page <= 0}
                      type="button"
                    >
                      Primera
                    </button>
                  </li>

                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 0}
                      type="button"
                    >
                      Anterior
                    </button>
                  </li>

                  {paginasVisibles.map((pagina, index) => (
                    pagina === "..." ? (
                      <li key={`dots-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li
                        key={`page-${pagina}`}
                        className={`page-item ${page === pagina ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage(pagina)}
                          type="button"
                        >
                          {pagina + 1}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      type="button"
                    >
                      Siguiente
                    </button>
                  </li>

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      type="button"
                    >
                      Última
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}
    </>
  );
}
