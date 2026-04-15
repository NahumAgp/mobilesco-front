import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCategorias } from "./useCategorias";

import CategoriaTable from "./CategoriaTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function CategoriaPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    categorias,
    loadingLista,
    error,
    eliminarCategoria
  } = useCategorias();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (categoria) => {
    navigate(`/categorias/${categoria.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta categoría?");
    if (!confirmacion) return;

    try {

      await eliminarCategoria(id);

      setToastType("success");
      setToastMessage("Categoría eliminada correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar categoría");
    }
  };

 const categoriasFiltradas = categorias.filter((categoria) => {
  // 1. Normalizamos la búsqueda del usuario
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Si no hay nada escrito, mostramos todo
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    // 2. Separamos lo que escribió el usuario en palabras individuales
    const palabras = terminoBusqueda.split(' ');

    // 3. Construimos una sola cadena con toda la info de la categoría
    const infoCategoria = [
      categoria.nombre,
      categoria.descripcion
    ].filter(Boolean).join(' ').toLowerCase();

    // 4. Todas las palabras buscadas deben existir
    return palabras.every(palabra => infoCategoria.includes(palabra));
  })();

  // 5. Filtros de Estatus (Select)
  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && categoria.activo) ||
    (filtroEstatus === "INACTIVO" && !categoria.activo);

  // 6. Filtro de Switch (Solo activos)
  const coincideSoloActivos = !soloActivos || categoria.activo;

  // La categoría debe cumplir las 3 condiciones
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
        title="Categorías"
        subtitle="Catálogo de categorías de productos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/categorias/nuevo")}
          >
            Nueva Categoría
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando categorías...
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

      <CategoriaTable
        data={categoriasFiltradas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}