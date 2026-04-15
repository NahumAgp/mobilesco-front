import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEmpleados } from "../../pages/Empleados/useEmpleado.js";
import EmpleadosTable from "../../components/Empleados/EmpleadosTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function EmpleadosPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    empleados,
    loadingLista,
    error,
    eliminarEmpleado
  } = useEmpleados();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

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
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al eliminar empleado");
    }
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    // 1. Normalizamos la búsqueda del usuario
    const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Filtro por texto - buscamos en los campos que existen en tu modelo
    const pasaFiltroTexto = (() => {
      if (!terminoBusqueda) return true;

      const palabras = terminoBusqueda.split(' ');

      // Construimos un string con la información disponible del empleado
      const infoEmpleado = [
        emp.nombre,
        emp.apellidoPaterno,
        emp.apellidoMaterno,
        emp.telefono,
        emp.id?.toString()
      ].filter(Boolean).join(' ').toLowerCase();

      return palabras.every(palabra => infoEmpleado.includes(palabra));
    })();

    // 2. Filtros de Estatus (Select)
    const coincideEstatus =
      filtroEstatus === "TODOS" ||
      (filtroEstatus === "ACTIVO" && emp.activo) ||
      (filtroEstatus === "INACTIVO" && !emp.activo);

    // 3. Filtro de Switch (Solo activos)
    const coincideSoloActivos = !soloActivos || emp.activo;

    return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
  });

  // Función para formatear fecha si la necesitas mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-MX');
  };

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
          <button
            className="btn btn-success"
            onClick={() => navigate("/empleados/nuevo")}
          >
            Nuevo Empleado
          </button>
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

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">

            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, apellidos, teléfono o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-center">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivos"
                  checked={soloActivos}
                  onChange={(e) => setSoloActivos(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="soloActivos">
                  Solo activos
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <EmpleadosTable
        data={empleadosFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}