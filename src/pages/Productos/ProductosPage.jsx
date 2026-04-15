import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProductos } from "./useProductos";
import ProductosTable from "./ProductosTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ProductosPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    productos,
    loadingLista,
    error,
    eliminarProducto
  } = useProductos();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const abrirEditar = (producto) => {
    navigate(`/productos/${producto.id}`);
  };

  const abrirVer = (producto) => {
    navigate(`/productos/${producto.id}/ver`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar este producto?");
    if (!confirmacion) return;

    try {
      await eliminarProducto(id);
      setToastType("success");
      setToastMessage("Producto eliminado correctamente");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al eliminar producto");
    }
  };

  // Obtener tipos únicos para el filtro
  const tiposUnicos = [...new Set(productos.map(p => p.tipoProductoNombre).filter(Boolean))];

  const productosFiltrados = productos.filter((producto) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    const pasaFiltroTexto = !terminoBusqueda || 
      producto.sku?.toLowerCase().includes(terminoBusqueda) ||
      producto.nombre?.toLowerCase().includes(terminoBusqueda) ||
      producto.descripcion?.toLowerCase().includes(terminoBusqueda) ||
      producto.tipoProductoNombre?.toLowerCase().includes(terminoBusqueda);

    const coincideEstatus =
      filtroEstatus === "TODOS" ||
      (filtroEstatus === "ACTIVO" && producto.activo) ||
      (filtroEstatus === "INACTIVO" && !producto.activo);

    const coincideSoloActivos = !soloActivos || producto.activo;
    
    const coincideTipo = !filtroTipo || producto.tipoProductoNombre === filtroTipo;

    return pasaFiltroTexto && coincideEstatus && coincideSoloActivos && coincideTipo;
  });

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Productos"
        subtitle="Catálogo de productos terminados"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/productos/nuevo")}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Producto
          </button>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando productos...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por SKU, nombre o descripción..."
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
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
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

      <ProductosTable
        data={productosFiltrados}
        onVer={abrirVer}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}