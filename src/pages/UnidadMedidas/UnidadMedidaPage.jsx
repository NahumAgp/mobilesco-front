import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUnidadesMedida } from "./useUnidadesMedida";
import UnidadesMedidaTable from "../../components/UnidadMedidas/UnidadesMedidaTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function UnidadesMedidaPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    unidadesMedida,
    loadingLista,
    error,
    eliminarUnidadMedida
  } = useUnidadesMedida();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (unidad) => {
    navigate(`/unidades-medida/${unidad.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta unidad de medida?");
    if (!confirmacion) return;

    try {

      await eliminarUnidadMedida(id);

      setToastType("success");
      setToastMessage("Unidad de medida eliminada correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar unidad de medida");
    }
  };

  const unidadesFiltradas = unidadesMedida.filter((u) => {
    // 1. Normalizamos la búsqueda del usuario
    const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Filtro por texto
    const pasaFiltroTexto = (() => {
      if (!terminoBusqueda) return true;

      const palabras = terminoBusqueda.split(' ');

      const infoUnidad = [
        u.nombre,
        u.simbolo,
        u.tipo
      ].filter(Boolean).join(' ').toLowerCase();

      return palabras.every(palabra => infoUnidad.includes(palabra));
    })();

    // 2. Filtros de Estatus (Select)
    const coincideEstatus =
      filtroEstatus === "TODOS" ||
      (filtroEstatus === "ACTIVO" && u.activo) ||
      (filtroEstatus === "INACTIVO" && !u.activo);

    // 3. Filtro de Switch (Solo activos)
    const coincideSoloActivos = !soloActivos || u.activo;

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
        title="Catálogo de Unidades de Medida"
        subtitle="Administración de unidades para productos e insumos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/unidades-medida/nuevo")}
          >
            Nueva Unidad
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando unidades de medida...
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
                placeholder="Buscar por nombre, abreviatura o descripción..."
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
                  onChange={() => setSoloActivos(!soloActivos)}
                />
                <label className="form-check-label" htmlFor="soloActivos">
                  Solo activos
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <UnidadesMedidaTable
        data={unidadesFiltradas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}