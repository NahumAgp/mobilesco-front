import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProveedores } from "./useProveedores";

import ProveedoresTable from "../../components/Proveedores/ProveedoresTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import {
  obtenerTiposInsumo,
  exportarProveedoresExcel
} from "../../services/proveedores.js";

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
    eliminarProveedor
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

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar este proveedor?");
    if (!confirmacion) return;

    try {
      await eliminarProveedor(id);
      setToastType("success");
      setToastMessage("Proveedor eliminado correctamente");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al eliminar proveedor");
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

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 0) return;
    if (pageInfo.totalPages > 0 && nuevaPagina >= pageInfo.totalPages) return;
    setPage(nuevaPagina);
  };

  const mostrarResumen = pageInfo.totalElements > 0;
  const desde = page * PAGE_SIZE + 1;
  const hasta = page * PAGE_SIZE + proveedores.length;

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
        onEliminar={manejarEliminar}
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
        <div className="text-muted">
          {mostrarResumen
            ? `Mostrando ${desde} a ${hasta} de ${pageInfo.totalElements} proveedores`
            : "No hay proveedores para mostrar"}
        </div>

        <nav aria-label="Paginación de proveedores">
          <ul className="pagination mb-0">
            <li className={`page-item ${pageInfo.first ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => irAPagina(page - 1)}
                disabled={pageInfo.first}
              >
                Anterior
              </button>
            </li>

            {Array.from({ length: pageInfo.totalPages || 0 }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <li
                  key={pageNumber}
                  className={`page-item ${page === index ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => irAPagina(index)}
                  >
                    {pageNumber}
                  </button>
                </li>
              );
            })}

            <li className={`page-item ${pageInfo.last ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => irAPagina(page + 1)}
                disabled={pageInfo.last}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
