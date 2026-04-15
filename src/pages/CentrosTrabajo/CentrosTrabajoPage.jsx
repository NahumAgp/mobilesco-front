import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCentrosTrabajo } from "./useCentrosTrabajo";
import CentrosTrabajoTable from "./CentrosTrabajoTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function CentrosTrabajoPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    centrosTrabajo,
    loadingLista,
    error,
    eliminarCentroTrabajo
  } = useCentrosTrabajo();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (centro) => {
    navigate(`/centros-trabajo/${centro.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este centro de trabajo?");
    if (!confirmacion) return;

    try {

      await eliminarCentroTrabajo(id);

      setToastType("success");
      setToastMessage("Centro de trabajo eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar centro de trabajo");
    }
  };

 const centrosFiltrados = centrosTrabajo.filter((centro) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(' ');

    const infoCentro = [
      centro.codigo,
      centro.nombre,
      centro.descripcion,
      centro.unidadCapacidad
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => infoCentro.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && centro.activo) ||
    (filtroEstatus === "INACTIVO" && !centro.activo);

  const coincideSoloActivos = !soloActivos || centro.activo;

  return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
});
  
  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Centros de Trabajo"
        subtitle="Catálogo de máquinas y estaciones de trabajo"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/centros-trabajo/nuevo")}
          >
            Nuevo Centro
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando centros de trabajo...
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

            <div className="col-md-4">
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

      <CentrosTrabajoTable
        data={centrosFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}