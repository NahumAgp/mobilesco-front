import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../../components/ui/Toast.jsx";
import { getUser } from "../../../auth/services/authService.js";
import ProductosTable from "./ProductosTable.jsx";
import { useProductos } from "./useProductos";

const PAGE_SIZE = 10;

export default function ProductosPage() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);

  const {
    productos,
    pageInfo,
    loadingLista,
    error,
    desactivarProducto
  } = useProductos({
    page,
    size: PAGE_SIZE,
    busqueda,
    activo: filtroEstatus === "TODOS" ? (soloActivos ? true : undefined) : filtroEstatus === "ACTIVO",
    sortBy: "sku",
    direction: "asc"
  });

  const user = getUser();
  const puedeEliminarDefinitivo = user?.roles?.some((rol) =>
    ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL"].includes(rol)
  );

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;

  const resetPage = (updater) => {
    setPage(0);
    updater();
  };

  const abrirEditar = (producto) => {
    navigate(`/productos/${producto.id}`);
  };

  const abrirVer = (producto) => {
    navigate(`/productos/${producto.id}`);
  };

  const manejarDesactivar = async (id) => {
    const confirmacion = window.confirm("Eliminar este producto del catalogo? Seguira existiendo, pero quedara inactivo.");
    if (!confirmacion) return;

    try {
      await desactivarProducto(id);
      setToastType("success");
      setToastMessage("Producto eliminado del catalogo");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar producto");
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Productos"
        subtitle="Catalogo de productos terminados"
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
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por SKU, nombre o descripcion..."
                value={busqueda}
                onChange={(e) => resetPage(() => setBusqueda(e.target.value))}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => resetPage(() => setFiltroEstatus(e.target.value))}
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
                  onChange={() => resetPage(() => setSoloActivos((actual) => !actual))}
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
        data={productos}
        onVer={abrirVer}
        onEditar={abrirEditar}
        onDesactivar={manejarDesactivar}
        canEliminarDefinitivo={puedeEliminarDefinitivo}
      />

      <CatalogPagination
        currentPage={paginaActual}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={PAGE_SIZE}
        currentCount={productos.length}
        itemLabel="productos"
        ariaLabel="Paginacion de productos"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
