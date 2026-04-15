import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useInsumos } from "./useInsumos";
import InsumosTable from "./InsumosTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function InsumosPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    insumos,
    loadingLista,
    error,
    eliminarInsumo,
    ajustarStock
  } = useInsumos();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);

  const abrirEditar = (insumo) => {
    navigate(`/insumos/${insumo.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este insumo?");
    if (!confirmacion) return;

    try {

      await eliminarInsumo(id);

      setToastType("success");
      setToastMessage("Insumo eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar insumo");
    }
  };

  const manejarAjusteStock = async (id, cantidad, tipo, motivo) => {
    try {
      await ajustarStock(id, cantidad, tipo, motivo);
      setToastType("success");
      setToastMessage(`Stock ${tipo === "ENTRADA" ? "incrementado" : "reducido"} correctamente`);
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al ajustar stock");
    }
  };

 const insumosFiltrados = insumos.filter((insumo) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(' ');

    const infoInsumo = [
      insumo.nombre,
      insumo.descripcion,
      insumo.ubicacion,
      insumo.unidadMedida?.nombre
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => infoInsumo.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && insumo.activo) ||
    (filtroEstatus === "INACTIVO" && !insumo.activo);

  const coincideSoloActivos = !soloActivos || insumo.activo;
  
  const coincideStockBajo = !filtroStockBajo || 
    (insumo.stockActual <= insumo.stockMinimo);

  return pasaFiltroTexto && coincideEstatus && coincideSoloActivos && coincideStockBajo;
});
  
  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Insumos"
        subtitle="Catálogo de insumos y materia prima"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/insumos/nuevo")}
          >
            Nuevo Insumo
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando insumos...
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
                placeholder="Buscar por nombre, ubicación..."
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

            <div className="col-md-2 d-flex align-items-center">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={filtroStockBajo}
                  onChange={() => setFiltroStockBajo(!filtroStockBajo)}
                />
                <label className="form-check-label text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Stock bajo
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <InsumosTable
        data={insumosFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
        onAjustarStock={manejarAjusteStock}
      />
    </>
  );
}