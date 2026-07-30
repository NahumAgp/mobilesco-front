import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCompras } from "../hooks/useCompras";
import ComprasTable from "./ComprasTable.jsx";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser } from "../../auth/services/authService.js";

const ROLES_GESTION_COMPRAS = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN"];
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

  const {
    compras,
    pageInfo,
    loadingLista,
    error,
    eliminarCompra
  } = useCompras({
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

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta compra?");
    if (!confirmacion) return;

    try {
      await eliminarCompra(id);
      setToastType("success");
      setToastMessage("Compra eliminada correctamente");
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "Error al eliminar compra");
    }
  };

  // Obtener proveedores únicos para el filtro
  const proveedoresUnicos = [...new Set(compras.map(c => c.proveedorRazonSocial).filter(Boolean))];

  const totalPages = Math.max(pageInfo.totalPages || 0, 1);
  const safePage = Math.min(page, totalPages - 1);

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Compras"
        subtitle="Gestión de compras de insumos"
        actions={
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/compras/cuentas-por-pagar")}
            >
              <i className="bi bi-cash-stack me-2"></i>
              Cuentas por pagar
            </button>
            {puedeGestionarCompra && (
              <button
                className="btn btn-success"
                onClick={() => navigate("/compras/nueva")}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Compra
              </button>
            )}
          </div>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando compras...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por folio, metodo de pago o proveedor..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPage(0);
                }}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RECIBIDA_PARCIAL">Parciales</option>
                <option value="RECIBIDA">Recibidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroProveedor}
                onChange={(e) => {
                  setFiltroProveedor(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos los proveedores</option>
                {proveedoresUnicos.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPage(0);
                }}
                placeholder="Fecha inicio"
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPage(0);
                }}
                placeholder="Fecha fin"
              />
            </div>

            <div className="col-md-1">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("TODOS");
                  setFiltroProveedor("");
                  setFechaInicio("");
                  setFechaFin("");
                  setPage(0);
                }}
              >
                <i className="bi bi-eraser"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ComprasTable
        data={compras}
        onVer={abrirVer}
        onEliminar={manejarEliminar}
        puedeEliminar={puedeEliminarCompra}
      />

      <CatalogPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalElements={pageInfo.totalElements || 0}
        pageSize={PAGE_SIZE}
        currentCount={compras.length}
        itemLabel="compras"
        ariaLabel="Paginacion de compras"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
