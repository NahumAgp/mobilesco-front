import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEmpleado } from "../hooks/useEmpleado";
import EmpleadosTable from "./EmpleadosTable";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser } from "../../auth/services/authService";
import "./EmpleadoPage.css";

const PAGE_SIZE = 10;
const ROLES_GESTION_EMPLEADOS = ["ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"];

export default function EmpleadoPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);
  const currentUser = getUser();
  const puedeGestionarEmpleados = currentUser?.roles?.some((rol) => ROLES_GESTION_EMPLEADOS.includes(rol));

  const { empleados, loadingLista, error, cambiarEstadoEmpleado } = useEmpleado();

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
  const empleadosPagina = empleadosFiltrados.slice(
    paginaActual * PAGE_SIZE,
    paginaActual * PAGE_SIZE + PAGE_SIZE
  );

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
        title="CatÃ¡logo de Empleados"
        subtitle="AdministraciÃ³n de empleados y colaboradores"
        actions={puedeGestionarEmpleados ? (
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn empleados-brand-primary"
              onClick={() => navigate("/usuarios/accesos")}
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
                placeholder="Buscar por nombre, apellidos, telÃ©fono, correo o ID..."
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
                  Ajusta los filtros para ver empleados en esta pÃ¡gina
                </p>
              </div>
            </div>
          ) : (
            <EmpleadosTable
              data={empleadosPagina}
              onEditar={abrirEditar}
              onCambiarEstado={manejarCambioEstado}
            />
          )}

          {totalElements > 0 && (
            <CatalogPagination
              currentPage={paginaActual}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={empleadosPagina.length}
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

