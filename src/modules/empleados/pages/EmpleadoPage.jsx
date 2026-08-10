import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEmpleado } from "../hooks/useEmpleado";
import EmpleadosTable from "./EmpleadosTable";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import "./EmpleadoPage.css";

const PAGE_SIZE = 10;

export default function EmpleadoPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);
  const currentUser = getUser();
  const puedeEditarEmpleado = hasPermission(currentUser, "ACTION_EMPLOYEES_EDIT");
  const puedeCambiarEstadoEmpleado = hasPermission(currentUser, "ACTION_EMPLOYEES_STATUS");
  const puedeCrearEmpleado = hasPermission(currentUser, "ACTION_EMPLOYEES_CREATE");
  const activo = filtroEstatus === "TODOS" && !soloActivos
    ? undefined
    : filtroEstatus === "INACTIVO"
      ? false
      : true;

  const { empleados, pageInfo, loadingLista, error, cambiarEstadoEmpleado } = useEmpleado({
    page,
    size: PAGE_SIZE,
    busqueda,
    activo
  });

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages - 1), 0);
      return () => window.clearTimeout(timer);
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

  const manejarCambioEstado = async (empleado) => {
    const confirmacion = window.confirm(
      empleado.activo ? "Desactivar este empleado?" : "Activar este empleado?"
    );
    if (!confirmacion) return;

    try {
      const nuevoEstado = !empleado.activo;
      await cambiarEstadoEmpleado(empleado.id, nuevoEstado);
      setToastType("success");
      setToastMessage(nuevoEstado ? "Empleado activado correctamente" : "Empleado desactivado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del empleado");
    }
  };

  const mostrarVacio = !loadingLista && !error && empleados.length === 0 && totalElements === 0 && !busqueda && activo === undefined;
  const mostrarSinCoincidencias = !loadingLista && !error && empleados.length === 0 && totalElements === 0 && !mostrarVacio;

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Catalogo de Empleados"
        subtitle="Administracion de empleados y colaboradores"
        actions={puedeCrearEmpleado ? (
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn empleados-brand-primary"
              onClick={() => navigate("/empleados/nuevo")}
            >
              <i className="bi bi-person-plus me-1"></i>
              Nuevo Empleado
            </button>
          </div>
        ) : null}
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
                placeholder="Buscar por nombre, apellidos, telefono, correo o ID..."
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
                  Ajusta los filtros para ver empleados en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <EmpleadosTable
              data={empleados}
              onEditar={puedeEditarEmpleado ? abrirEditar : undefined}
              onCambiarEstado={puedeCambiarEstadoEmpleado ? manejarCambioEstado : undefined}
            />
          )}

          {totalElements > 0 && (
            <CatalogPagination
              currentPage={paginaActual}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={empleados.length}
              itemLabel="empleados"
              ariaLabel="Paginacion de empleados"
              onPageChange={setPage}
              className="empleados-pagination-panel"
            />
          )}
        </div>
      )}
    </>
  );
}
