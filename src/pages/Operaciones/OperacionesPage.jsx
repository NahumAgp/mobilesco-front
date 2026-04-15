import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useOperaciones } from "./useOperaciones";
import OperacionesTable from "./OperacionesTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function OperacionesPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    operaciones,
    loadingLista,
    error,
    eliminarOperacion
  } = useOperaciones();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [filtroCentroTrabajo, setFiltroCentroTrabajo] = useState("");

  const abrirEditar = (operacion) => {
    navigate(`/operaciones/${operacion.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta operación?");
    if (!confirmacion) return;

    try {

      await eliminarOperacion(id);

      setToastType("success");
      setToastMessage("Operación eliminada correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar operación");
    }
  };

  // Obtener centros de trabajo únicos para el filtro
  const centrosUnicos = [...new Set(operaciones.map(op => op.centroTrabajoNombre).filter(Boolean))];

 const operacionesFiltradas = operaciones.filter((operacion) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(' ');

    const infoOperacion = [
      operacion.codigo,
      operacion.nombre,
      operacion.descripcion,
      operacion.centroTrabajoNombre
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => infoOperacion.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && operacion.activo) ||
    (filtroEstatus === "INACTIVO" && !operacion.activo);

  const coincideSoloActivos = !soloActivos || operacion.activo;
  
  const coincideCentro = !filtroCentroTrabajo || operacion.centroTrabajoNombre === filtroCentroTrabajo;

  return pasaFiltroTexto && coincideEstatus && coincideSoloActivos && coincideCentro;
});
  
  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Operaciones"
        subtitle="Catálogo de operaciones de fabricación (Mano de Obra Directa)"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/operaciones/nuevo")}
          >
            Nueva Operación
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando operaciones...
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

            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por código, nombre o descripción..."
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

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroCentroTrabajo}
                onChange={(e) => setFiltroCentroTrabajo(e.target.value)}
              >
                <option value="">Todos los centros</option>
                {centrosUnicos.map(centro => (
                  <option key={centro} value={centro}>{centro}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-center">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={soloActivos}
                  onChange={() => setSoloActivos(!soloActivos)}
                />
                <label className="form-check-label">
                  Solo activos
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <OperacionesTable
        data={operacionesFiltradas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}