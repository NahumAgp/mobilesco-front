import React, { useEffect, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import { useCategorias } from "../hooks/useCategorias";
import { categoriaGateway } from "../services/categoriaGateway.js";

import CategoriaTable from "./CategoriaTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import CatalogFilters from "../../../components/ui/CatalogFilters.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./CategoriaPage.css";

const FILTROS_DEFAULT = {
  busqueda: "",
  filtroEstatus: "TODOS",
  soloActivos: false
};

export default function CategoriaPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("categorias"));
  usePersistedPagination("categorias", page);
  const PAGE_SIZE = 10;
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const [filtros, setFiltros] = usePersistedState("categorias:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, filtroEstatus, soloActivos } = filtros;
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const activo = filtroEstatus === "TODOS" && !soloActivos
    ? undefined
    : filtroEstatus === "INACTIVO"
      ? false
      : true;

  const { categorias, pageInfo, error, recargar } = useCategorias({
    page,
    size: PAGE_SIZE,
    busqueda,
    activo
  });

  const abrirEditar = (categoria) => {
    navigate(`/categorias/${categoria.id}`);
  };

  const manejarCambioEstado = async (categoria) => {
    try {
      const nuevoEstado = !categoria.activo;
      if (nuevoEstado) {
        await categoriaGateway.activarCategoria(categoria.id);
      } else {
        await categoriaGateway.desactivarCategoria(categoria.id);
      }

      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Categoria activada con exito" : "Categoria desactivada con exito"
      );
      await recargar({ page });
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado de la categoria");
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await categoriaGateway.exportarCategoriasExcel({
        activo: filtroEstatus === "TODOS" ? undefined : filtroEstatus === "ACTIVO",
        busqueda: busquedaInput.trim() || undefined
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "categorias.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastType("success");
      setToastMessage("Reporte de Excel generado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("No se pudo generar el reporte de Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [busqueda, filtroEstatus, soloActivos]);

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        eyebrow="Catálogos"
        title="Categorías"
        subtitle="Catálogo de categorías de productos"
        actions={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando…" : "Exportar a Excel"}
            </button>
            <button className="btn categorias-brand-primary" onClick={() => navigate("/categorias/nuevo")}>
              Nueva categoría
            </button>
          </div>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <CatalogFilters
        className="categorias-filters-card"
        onClear={() => {
          setFiltros(FILTROS_DEFAULT);
          setPage(0);
        }}
        clearDisabled={!busquedaInput && filtroEstatus === "TODOS" && !soloActivos}
      >
            <div className="col-md-6">
              <label className="form-label" htmlFor="categorias-busqueda">Búsqueda</label>
              <input
                id="categorias-busqueda"
                type="text"
                className="form-control"
                placeholder="Código, nombre o descripción"
                value={busquedaInput}
                onChange={(e) => {
                  setFiltros((actuales) => ({ ...actuales, busqueda: e.target.value }));
                  setPage(0);
                }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" htmlFor="categorias-estado">Estado</label>
              <select
                id="categorias-estado"
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => {
                  setFiltros((actuales) => ({ ...actuales, filtroEstatus: e.target.value }));
                  setPage(0);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center pb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={soloActivos}
                  onChange={() => {
                    setFiltros((actuales) => ({ ...actuales, soloActivos: !soloActivos }));
                    setPage(0);
                  }}
                />
                <label className="form-check-label">Solo activos</label>
              </div>
            </div>
      </CatalogFilters>

      <CategoriaTable
        data={categorias}
        onEditar={abrirEditar}
        onCambiarEstado={manejarCambioEstado}
      />

      {totalElements > 0 && (
        <CatalogPagination
          currentPage={paginaActual}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          currentCount={categorias.length}
          itemLabel="categorías"
          ariaLabel="Paginación de categorías"
          onPageChange={setPage}
          className="categorias-pagination-panel"
        />
      )}
    </>
  );
}

