import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTiposProducto } from "./useTiposProducto";
import TiposProductoTable from "./TiposProductoTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function TiposProductoPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    tiposProducto,
    loadingLista,
    error,
    eliminarTipoProducto
  } = useTiposProducto();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (tipo) => {
    navigate(`/tipos-producto/${tipo.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este tipo de producto?");
    if (!confirmacion) return;

    try {

      await eliminarTipoProducto(id);

      setToastType("success");
      setToastMessage("Tipo de producto eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar tipo de producto");
    }
  };

 const tiposFiltrados = tiposProducto.filter((tipo) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(' ');

    const infoTipo = [
      tipo.nombre,
      tipo.descripcion,
      tipo.familia?.nombre
    ].filter(Boolean).join(' ').toLowerCase();

    return palabras.every(palabra => infoTipo.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && tipo.activo) ||
    (filtroEstatus === "INACTIVO" && !tipo.activo);

  const coincideSoloActivos = !soloActivos || tipo.activo;

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
        title="Tipos de Producto"
        subtitle="Catálogo de tipos de producto"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/tipos-producto/nuevo")}
          >
            Nuevo Tipo
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando tipos de producto...
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
                placeholder="Buscar por nombre, descripción o familia..."
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

      <TiposProductoTable
        data={tiposFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}