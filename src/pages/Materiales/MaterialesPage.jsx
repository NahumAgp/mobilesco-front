// pages/Materiales/MaterialesPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMateriales } from "./useMateriales";
import MaterialesTable from "./MaterialesTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function MaterialesPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    materiales,
    loadingLista,
    error,
    eliminarMaterial
  } = useMateriales();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (material) => {
    navigate(`/materiales/${material.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este material?");
    if (!confirmacion) return;

    try {

      await eliminarMaterial(id);

      setToastType("success");
      setToastMessage("Material eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar material");
    }
  };

 const materialesFiltrados = materiales.filter((material) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(' ');

    const infoMaterial = [
      material.nombre,
      material.descripcion,
      material.unidadMedida
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => infoMaterial.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && material.activo) ||
    (filtroEstatus === "INACTIVO" && !material.activo);

  const coincideSoloActivos = !soloActivos || material.activo;

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
        title="Materiales"
        subtitle="Catálogo de materiales e insumos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/materiales/nuevo")}
          >
            Nuevo Material
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando materiales...
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
                placeholder="Buscar por nombre, descripción o unidad..."
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

      <MaterialesTable
        data={materialesFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}