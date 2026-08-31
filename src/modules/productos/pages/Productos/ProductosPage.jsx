import { useState } from "react";
import useDebouncedValue from "../../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader.jsx";
import CatalogFilters from "../../../../components/ui/CatalogFilters.jsx";
import CatalogPagination from "../../../../components/ui/CatalogPagination.jsx";
import ConfirmationDialog from "../../../../components/ui/ConfirmationDialog.jsx";
import Toast from "../../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../../auth/services/authService.js";
import ProductosTable from "./ProductosTable.jsx";
import { useProductos } from "./useProductos";

const PAGE_SIZE = 10;
const FILTROS_DEFAULT = {
  busqueda: "",
  filtroEstatus: "TODOS",
  soloActivos: false
};

export default function ProductosPage() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [filtros, setFiltros] = usePersistedState("productos:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, filtroEstatus, soloActivos } = filtros;
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const [page, setPage] = useState(() => getInitialPaginationPage("productos"));
  usePersistedPagination("productos", page);
  const [productoPorDesactivar, setProductoPorDesactivar] = useState(null);
  const [desactivando, setDesactivando] = useState(false);

  const { productos, pageInfo, error, desactivarProducto } = useProductos({
    page,
    size: PAGE_SIZE,
    busqueda,
    activo: filtroEstatus === "TODOS"
      ? (soloActivos ? true : undefined)
      : filtroEstatus === "ACTIVO",
    sortBy: "sku",
    direction: "asc"
  });

  const user = getUser();
  const puedeCrearProducto = hasPermission(user, "ACTION_PRODUCTS_CREATE");
  const puedeEliminarDefinitivo = hasPermission(user, "ACTION_PRODUCTS_DELETE");
  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;

  const actualizarFiltros = (cambios) => {
    setFiltros((actuales) => ({ ...actuales, ...cambios }));
    setPage(0);
  };

  const confirmarDesactivacion = async () => {
    if (!productoPorDesactivar) return;
    try {
      setDesactivando(true);
      await desactivarProducto(productoPorDesactivar.id);
      setToastType("success");
      setToastMessage("Producto desactivado correctamente");
      setProductoPorDesactivar(null);
    } catch {
      setToastType("danger");
      setToastMessage("Error al desactivar el producto");
    } finally {
      setDesactivando(false);
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <ConfirmationDialog
        open={Boolean(productoPorDesactivar)}
        title="Desactivar producto"
        message={`¿Deseas desactivar “${productoPorDesactivar?.nombre || ""}”? El producto seguirá registrado, pero dejará de estar disponible en el catálogo.`}
        confirmLabel="Desactivar producto"
        loading={desactivando}
        onCancel={() => setProductoPorDesactivar(null)}
        onConfirm={confirmarDesactivacion}
      />

      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        subtitle="Catálogo de productos terminados"
        actions={
          puedeCrearProducto && <button className="btn btn-success" onClick={() => navigate("/productos/nuevo")}>
            <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Nuevo producto
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <CatalogFilters
        onClear={() => {
          actualizarFiltros(FILTROS_DEFAULT);
        }}
        clearDisabled={!busquedaInput && filtroEstatus === "TODOS" && !soloActivos}
      >
        <div className="col-md-5">
          <label className="form-label" htmlFor="productos-busqueda">Búsqueda</label>
          <input
            id="productos-busqueda"
            type="text"
            className="form-control"
            placeholder="SKU, nombre o descripción"
            value={busquedaInput}
            onChange={(event) => actualizarFiltros({ busqueda: event.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="productos-estado">Estado</label>
          <select
            id="productos-estado"
            className="form-select"
            value={filtroEstatus}
            onChange={(event) => actualizarFiltros({ filtroEstatus: event.target.value })}
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-center pb-2">
          <div className="form-check form-switch">
            <input
              id="productos-solo-activos"
              className="form-check-input"
              type="checkbox"
              checked={soloActivos}
              onChange={() => actualizarFiltros({ soloActivos: !soloActivos })}
            />
            <label className="form-check-label" htmlFor="productos-solo-activos">
              Solo activos
            </label>
          </div>
        </div>
      </CatalogFilters>

      <ProductosTable
        data={productos}
        onVer={(producto) => navigate(`/productos/${producto.id}`)}
        onEditar={(producto) => navigate(`/productos/${producto.id}`)}
        onDesactivar={setProductoPorDesactivar}
        canEliminarDefinitivo={puedeEliminarDefinitivo}
      />

      <CatalogPagination
        currentPage={paginaActual}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={PAGE_SIZE}
        currentCount={productos.length}
        itemLabel="productos"
        ariaLabel="Paginación de productos"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
