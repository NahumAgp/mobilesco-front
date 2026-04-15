import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLineasProducto } from "./useLineasProducto";

import LineaProductoTable from "./LineaProductoTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function LineaProductoPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    lineasProducto,
    loadingLista,
    error,
    eliminarLineaProducto
  } = useLineasProducto();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (linea) => {
    navigate(`/lineas-producto/${linea.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta línea de producto?");
    if (!confirmacion) return;

    try {

      await eliminarLineaProducto(id);

      setToastType("success");
      setToastMessage("Línea de producto eliminada correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar línea de producto");
    }
  };

 const lineasFiltradas = lineasProducto.filter((linea) => {
  // 1. Normalizamos la búsqueda del usuario
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Si no hay nada escrito, mostramos todo
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    // 2. Separamos lo que escribió el usuario en palabras individuales
    const palabras = terminoBusqueda.split(' ');

    // 3. Construimos una sola cadena con toda la info de la línea
    const infoLinea = [
      linea.nombre,
      linea.descripcion
    ].filter(Boolean).join(' ').toLowerCase();

    // 4. Todas las palabras buscadas deben existir
    return palabras.every(palabra => infoLinea.includes(palabra));
  })();

  // 5. Filtros de Estatus (Select)
  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && linea.activo) ||
    (filtroEstatus === "INACTIVO" && !linea.activo);

  // 6. Filtro de Switch (Solo activos)
  const coincideSoloActivos = !soloActivos || linea.activo;

  // La línea debe cumplir las 3 condiciones
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
        title="Líneas de Producto"
        subtitle="Catálogo de líneas de producto"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/lineas-producto/nuevo")}
          >
            Nueva Línea de Producto
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando líneas de producto...
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
                placeholder="Buscar por nombre o descripción..."
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

      <LineaProductoTable
        data={lineasFiltradas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}