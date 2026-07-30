import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCompras } from "../hooks/useCompras";
import ComprasTable from "./ComprasTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogFilters from "../../../components/ui/CatalogFilters.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import ConfirmationDialog from "../../../components/ui/ConfirmationDialog.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser } from "../../auth/services/authService.js";

const ROLES_GESTION_COMPRAS = [
  "ADMIN",
  "SUPER_ADMIN",
  "DIRECTOR_GENERAL",
  "SUBDIRECCION_ADMINISTRATIVA",
  "JEFE_ALMACEN"
];
const PAGE_SIZE = 10;

export default function ComprasPage() {
  const navigate = useNavigate();
  const user = getUser();
  const puedeGestionarCompra = user?.roles?.some((rol) => ROLES_GESTION_COMPRAS.includes(rol));
  const puedeEliminarCompra = user?.roles?.some((rol) =>
    ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL"].includes(rol)
  );

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(0);
  const [compraPorEliminar, setCompraPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const { compras, pageInfo, loadingLista, error, eliminarCompra } = useCompras({
    page,
    size: PAGE_SIZE,
    busqueda,
    estado: filtroEstado,
    proveedor: filtroProveedor,
    fechaInicio,
    fechaFin
  });

  const abrirVer = (compra) => {
    if (!compra?.id) return;
    const link = document.createElement("a");
    link.href = `/compras/${compra.id}/ver`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const confirmarEliminacion = async () => {
    if (!compraPorEliminar) return;
    try {
      setEliminando(true);
      await eliminarCompra(compraPorEliminar.id);
      setToastType("success");
      setToastMessage("Compra eliminada correctamente");
      setCompraPorEliminar(null);
    } catch (caughtError) {
      setToastType("danger");
      setToastMessage(caughtError.message || "Error al eliminar la compra");
    } finally {
      setEliminando(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("TODOS");
    setFiltroProveedor("");
    setFechaInicio("");
    setFechaFin("");
  };

  const proveedoresUnicos = [...new Set(compras.map((compra) => compra.proveedorRazonSocial).filter(Boolean))];

  useEffect(() => {
    setPage(0);
  }, [busqueda, filtroEstado, filtroProveedor, fechaInicio, fechaFin]);

  const totalPages = Math.max(pageInfo.totalPages || 0, 1);
  const safePage = Math.min(page, totalPages - 1);
  const filtrosVacios =
    !busqueda && filtroEstado === "TODOS" && !filtroProveedor && !fechaInicio && !fechaFin;

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <ConfirmationDialog
        open={Boolean(compraPorEliminar)}
        title="Eliminar compra"
        message={`¿Deseas eliminar la compra “${compraPorEliminar?.folio || ""}”? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar compra"
        loading={eliminando}
        onCancel={() => setCompraPorEliminar(null)}
        onConfirm={confirmarEliminacion}
      />

      <PageHeader
        eyebrow="Abastecimiento"
        title="Compras"
        subtitle="Gestión de compras de insumos"
        actions={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/compras/cuentas-por-pagar")}
            >
              <i className="bi bi-cash-stack me-2" aria-hidden="true"></i>
              Cuentas por pagar
            </button>
            {puedeGestionarCompra && (
              <button className="btn btn-success" onClick={() => navigate("/compras/nueva")}>
                <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
                Nueva compra
              </button>
            )}
          </div>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando compras…</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <CatalogFilters onClear={limpiarFiltros} clearDisabled={filtrosVacios}>
        <div className="col-md-3">
          <label className="form-label" htmlFor="compras-busqueda">Búsqueda</label>
          <input
            id="compras-busqueda"
            type="text"
            className="form-control"
            placeholder="Folio, método de pago o proveedor"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="compras-estado">Estado</label>
          <select
            id="compras-estado"
            className="form-select"
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="RECIBIDA_PARCIAL">Parciales</option>
            <option value="RECIBIDA">Recibidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="compras-proveedor">Proveedor</label>
          <select
            id="compras-proveedor"
            className="form-select"
            value={filtroProveedor}
            onChange={(event) => setFiltroProveedor(event.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {proveedoresUnicos.map((proveedor) => (
              <option key={proveedor} value={proveedor}>{proveedor}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="compras-desde">Desde</label>
          <input
            id="compras-desde"
            type="date"
            className="form-control"
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="compras-hasta">Hasta</label>
          <input
            id="compras-hasta"
            type="date"
            className="form-control"
            value={fechaFin}
            onChange={(event) => setFechaFin(event.target.value)}
          />
        </div>
      </CatalogFilters>

      <ComprasTable
        data={compras}
        onVer={abrirVer}
        onEliminar={setCompraPorEliminar}
        puedeEliminar={puedeEliminarCompra}
      />

      <CatalogPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalElements={pageInfo.totalElements || 0}
        pageSize={PAGE_SIZE}
        currentCount={compras.length}
        itemLabel="compras"
        ariaLabel="Paginación de compras"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
