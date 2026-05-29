import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProveedores } from "../hooks/useProveedores";

import ProveedoresTable from "../components/ProveedoresTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import {
  obtenerTiposInsumo,
  exportarProveedoresExcel
} from "../services/proveedores.js";

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [tipoInsumo, setTipoInsumo] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);
  const [page, setPage] = useState(0);
  const [tiposInsumo, setTiposInsumo] = useState([]);

  const activoFiltro = useMemo(() => (soloActivos ? true : undefined), [soloActivos]);
  const busquedaGeneral = busqueda.trim() || undefined;
  const tipoInsumoFiltro = tipoInsumo || undefined;

  const {
    proveedores,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoProveedor
  } = useProveedores({
    activo: activoFiltro,
    busqueda: busquedaGeneral,
    tipoInsumo: tipoInsumoFiltro,
    page,
    size: PAGE_SIZE
  });

  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const data = await obtenerTiposInsumo();
        setTiposInsumo(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando tipos de insumo:", err);
      }
    };

    cargarTipos();
  }, []);

  const abrirEditar = (proveedor) => {
    navigate(`/proveedores/${proveedor.id}`);
  };

  const manejarCambioEstado = async (proveedor) => {
    const nuevoEstado = !proveedor.activo;
    const confirmacion = window.confirm(
      nuevoEstado ? "Activar este proveedor?" : "Desactivar este proveedor?"
    );
    if (!confirmacion) return;

    try {
      await cambiarEstadoProveedor(proveedor, nuevoEstado);
      setToastType("success");
      setToastMessage(nuevoEstado ? "Proveedor activado correctamente" : "Proveedor desactivado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del proveedor");
    }
  };

  const cambiarBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPage(0);
  };

  const cambiarTipoInsumo = (e) => {
    setTipoInsumo(e.target.value);
    setPage(0);
  };

  const cambiarSoloActivos = (e) => {
    setSoloActivos(e.target.checked);
    setPage(0);
  };

  const exportarExcel = async () => {
    try {
      const blob = await exportarProveedoresExcel({
        activo: activoFiltro,
        busqueda: busquedaGeneral,
        tipoInsumo: tipoInsumoFiltro
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "proveedores.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastType("success");
      setToastMessage("Reporte de Excel generado correctamente");
    } catch (err) {
      console.error("Error exportando proveedores:", err);
      setToastType("danger");
      setToastMessage("No se pudo generar el reporte de Excel");
    }
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Directorio de Proveedores"
        subtitle="Base de datos centralizada de proveedores"
        actions={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
            >
              Exportar Excel
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate("/proveedores/nuevo")}
            >
              Nuevo Proveedor
            </button>
          </div>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando proveedores...
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
                placeholder="Buscar por razón social, contacto, RFC, correo o teléfono..."
                value={busqueda}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={tipoInsumo}
                onChange={cambiarTipoInsumo}
              >
                <option value="">Todos los tipos</option>
                {tiposInsumo.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <div className="form-check form-switch d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivosSwitch"
                  checked={soloActivos}
                  onChange={cambiarSoloActivos}
                />
                <label className="form-check-label" htmlFor="soloActivosSwitch">
                  Solo activos
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProveedoresTable
        data={proveedores}
        onEditar={abrirEditar}
        onCambiarEstado={manejarCambioEstado}
      />

      <CatalogPagination
        currentPage={page}
        totalPages={pageInfo.totalPages || 0}
        totalElements={pageInfo.totalElements || 0}
        pageSize={PAGE_SIZE}
        currentCount={proveedores.length}
        itemLabel="proveedores"
        ariaLabel="Paginacion de proveedores"
        onPageChange={setPage}
      />
    </>
  );
}



