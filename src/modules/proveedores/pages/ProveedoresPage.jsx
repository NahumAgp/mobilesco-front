import React, { useEffect, useMemo, useState } from "react";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import { useProveedores } from "../hooks/useProveedores";

import ProveedoresTable from "../components/ProveedoresTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import CatalogFilters from "../../../components/ui/CatalogFilters.jsx";
import ConfirmationDialog from "../../../components/ui/ConfirmationDialog.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { uniqueOptionsByLabel } from "../../../utils/uniqueOptions.js";
import {
  exportarProveedoresExcel
} from "../services/proveedores.js";
import { obtenerTiposInsumo } from "../../insumos/services/tiposInsumo.js";
import { getUser, hasPermission } from "../../auth/services/authService.js";

const FILTROS_DEFAULT = {
  busqueda: "",
  tipoInsumo: "",
  soloActivos: false
};

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const user = getUser();
  const puedeCrear = hasPermission(user, "ACTION_SUPPLIERS_CREATE");
  const puedeExportar = hasPermission(user, "ACTION_SUPPLIERS_EXPORT");
  const PAGE_SIZE = 10;

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [filtros, setFiltros] = usePersistedState("proveedores:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, tipoInsumo, soloActivos } = filtros;
  const [page, setPage] = useState(() => getInitialPaginationPage("proveedores"));
  usePersistedPagination("proveedores", page);
  const [tiposInsumo, setTiposInsumo] = useState([]);
  const [proveedorPorCambiar, setProveedorPorCambiar] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const activoFiltro = useMemo(() => (soloActivos ? true : undefined), [soloActivos]);
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const busquedaGeneral = busqueda.trim() || undefined;
  const tipoInsumoFiltro = tipoInsumo || undefined;

  const {
    proveedores,
    pageInfo,
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
    setProveedorPorCambiar(proveedor);
  };

  const confirmarCambioEstado = async () => {
    if (!proveedorPorCambiar) return;
    const nuevoEstado = !proveedorPorCambiar.activo;
    try {
      setCambiandoEstado(true);
      await cambiarEstadoProveedor(proveedorPorCambiar, nuevoEstado);
      setToastType("success");
      setToastMessage(nuevoEstado ? "Proveedor activado correctamente" : "Proveedor desactivado correctamente");
      setProveedorPorCambiar(null);
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del proveedor");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const cambiarBusqueda = (e) => {
    setFiltros((actuales) => ({ ...actuales, busqueda: e.target.value }));
    setPage(0);
  };

  const cambiarTipoInsumo = (e) => {
    setFiltros((actuales) => ({ ...actuales, tipoInsumo: e.target.value }));
    setPage(0);
  };

  const cambiarSoloActivos = (e) => {
    setFiltros((actuales) => ({ ...actuales, soloActivos: e.target.checked }));
    setPage(0);
  };

  const exportarExcel = async () => {
    try {
      const blob = await exportarProveedoresExcel({
        activo: activoFiltro,
        busqueda: busquedaInput.trim() || undefined,
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
      <ConfirmationDialog
        open={Boolean(proveedorPorCambiar)}
        title={proveedorPorCambiar?.activo ? "Desactivar proveedor" : "Activar proveedor"}
        message={`¿Deseas ${proveedorPorCambiar?.activo ? "desactivar" : "activar"} a “${proveedorPorCambiar?.razonSocial || proveedorPorCambiar?.nombre || ""}”?`}
        confirmLabel={proveedorPorCambiar?.activo ? "Desactivar proveedor" : "Activar proveedor"}
        variant={proveedorPorCambiar?.activo ? "danger" : "primary"}
        loading={cambiandoEstado}
        onCancel={() => setProveedorPorCambiar(null)}
        onConfirm={confirmarCambioEstado}
      />

      <PageHeader
        eyebrow="Abastecimiento"
        title="Directorio de proveedores"
        subtitle="Base de datos centralizada de proveedores"
        actions={
          <div className="d-flex gap-2">
            {puedeExportar && <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
            >
              Exportar a Excel
            </button>}
            {puedeCrear && <button
              className="btn btn-success"
              onClick={() => navigate("/proveedores/nuevo")}
            >
              Nuevo proveedor
            </button>}
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <CatalogFilters
        onClear={() => {
          setFiltros(FILTROS_DEFAULT);
          setPage(0);
        }}
        clearDisabled={!busquedaInput && !tipoInsumo && !soloActivos}
      >
            <div className="col-md-4">
              <label className="form-label" htmlFor="proveedores-busqueda">Búsqueda</label>
              <input
                id="proveedores-busqueda"
                type="text"
                className="form-control"
                placeholder="Razón social, contacto, RFC, correo o teléfono"
                value={busquedaInput}
                onChange={cambiarBusqueda}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" htmlFor="proveedores-tipo">Tipo de insumo</label>
              <select
                id="proveedores-tipo"
                className="form-select"
                value={tipoInsumo}
                onChange={cambiarTipoInsumo}
              >
                <option value="">Todos los tipos</option>
                {uniqueOptionsByLabel(tiposInsumo, (tipo) => tipo?.nombre || tipo?.codigo).map((tipo) => (
                  <option key={tipo.id || tipo.codigo} value={tipo.codigo}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 pb-2">
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
      </CatalogFilters>

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
        ariaLabel="Paginación de proveedores"
        onPageChange={setPage}
      />
    </>
  );
}



