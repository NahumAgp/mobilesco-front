import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCompras } from "./useCompras";
import ComprasTable from "./ComprasTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ComprasPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    compras,
    loadingLista,
    error,
    eliminarCompra,
    recibirCompra,
    cancelarCompra
  } = useCompras();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const abrirEditar = (compra) => {
    navigate(`/compras/${compra.id}`);
  };

  const abrirVer = (compra) => {
    navigate(`/compras/${compra.id}/ver`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta compra?");
    if (!confirmacion) return;

    try {
      await eliminarCompra(id);
      setToastType("success");
      setToastMessage("Compra eliminada correctamente");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al eliminar compra");
    }
  };

  const manejarRecibir = async (id) => {
    const confirmacion = window.confirm("¿Confirmas que quieres marcar esta compra como RECIBIDA? Esto actualizará el stock de los insumos.");
    if (!confirmacion) return;

    try {
      await recibirCompra(id);
      setToastType("success");
      setToastMessage("Compra recibida y stock actualizado");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al recibir compra: " + (e.message || "Error desconocido"));
    }
  };

  const manejarCancelar = async (id) => {
    const motivo = window.prompt("Motivo de la cancelación:");
    if (!motivo) return;

    try {
      await cancelarCompra(id, motivo);
      setToastType("success");
      setToastMessage("Compra cancelada");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al cancelar compra");
    }
  };

  // Obtener proveedores únicos para el filtro
  const proveedoresUnicos = [...new Set(compras.map(c => c.proveedorRazonSocial).filter(Boolean))];

  const comprasFiltradas = compras.filter((compra) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    const pasaFiltroTexto = !terminoBusqueda || 
      compra.folio?.toLowerCase().includes(terminoBusqueda) ||
      compra.numeroDocumento?.toLowerCase().includes(terminoBusqueda) ||
      compra.proveedorRazonSocial?.toLowerCase().includes(terminoBusqueda) ||
      compra.proveedorRfc?.toLowerCase().includes(terminoBusqueda);

    const pasaFiltroEstado = filtroEstado === "TODOS" || compra.estado === filtroEstado;
    
    const pasaFiltroProveedor = !filtroProveedor || compra.proveedorRazonSocial === filtroProveedor;

    const pasaFiltroFechas = (() => {
      if (!fechaInicio && !fechaFin) return true;
      const fechaCompra = new Date(compra.fechaCompra);
      if (fechaInicio && fechaCompra < new Date(fechaInicio)) return false;
      if (fechaFin && fechaCompra > new Date(fechaFin)) return false;
      return true;
    })();

    return pasaFiltroTexto && pasaFiltroEstado && pasaFiltroProveedor && pasaFiltroFechas;
  });

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Compras"
        subtitle="Gestión de compras de insumos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/compras/nueva")}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Compra
          </button>
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
                placeholder="Buscar por folio, documento o proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RECIBIDA">Recibidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
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
                onChange={(e) => setFechaInicio(e.target.value)}
                placeholder="Fecha inicio"
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
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
                }}
              >
                <i className="bi bi-eraser"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ComprasTable
        data={comprasFiltradas}
        onVer={abrirVer}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
        onRecibir={manejarRecibir}
        onCancelar={manejarCancelar}
      />
    </>
  );
}