import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCategorias } from "./useCategorias";
import { categoriaGateway } from "../../gateways/categoriaGateway.js";

import CategoriaTable from "./CategoriaTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./CategoriaPage.css";

export default function CategoriaPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const { categorias, loadingLista, error, recargar } = useCategorias();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

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
      await recargar();
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
        busqueda: busqueda || undefined
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

  const construirRangoPaginas = (totalPages, currentPage) => {
    if (!totalPages || totalPages <= 0) return [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const paginas = [0];
    const inicio = Math.max(1, currentPage - 1);
    const fin = Math.min(totalPages - 2, currentPage + 1);

    if (inicio > 1) paginas.push("...");
    for (let i = inicio; i <= fin; i += 1) paginas.push(i);
    if (fin < totalPages - 2) paginas.push("...");
    paginas.push(totalPages - 1);
    return paginas;
  };

  const categoriasFiltradas = categorias.filter((categoria) => {
    const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

    const pasaFiltroTexto = (() => {
      if (!terminoBusqueda) return true;

      const palabras = terminoBusqueda.split(" ");
      const infoCategoria = [categoria.codigo, categoria.nombre, categoria.descripcion]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return palabras.every((palabra) => infoCategoria.includes(palabra));
    })();

    const coincideEstatus =
      filtroEstatus === "TODOS" ||
      (filtroEstatus === "ACTIVO" && categoria.activo) ||
      (filtroEstatus === "INACTIVO" && !categoria.activo);

    const coincideSoloActivos = !soloActivos || categoria.activo;

    return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
  });

  const totalElements = categoriasFiltradas.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const categoriasPaginadas = useMemo(
    () => categoriasFiltradas.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [categoriasFiltradas, page]
  );
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + categoriasPaginadas.length : 0;

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
        title="Categorias"
        subtitle="Catalogo de categorias de productos"
        actions={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button className="btn categorias-brand-primary" onClick={() => navigate("/categorias/nuevo")}>
              Nueva Categoria
            </button>
          </div>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando categorias...</div>}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 categorias-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo, nombre o descripcion..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <select className="form-select" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
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
                  onChange={() => setSoloActivos(!soloActivos)}
                />
                <label className="form-check-label">Solo activos</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoriaTable
        data={categoriasPaginadas}
        onEditar={abrirEditar}
        onCambiarEstado={manejarCambioEstado}
      />

      {totalElements > 0 && (
        <div className="categorias-pagination-panel">
          <div className="categorias-pagination-summary">
            {`Mostrando ${desde} a ${hasta} de ${totalElements} categorias`}
          </div>

          <nav aria-label="Paginacion de categorias">
            <ul className="pagination mb-0 flex-wrap">
              <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(0)} disabled={page <= 0}>
                  Primera
                </button>
              </li>

              <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page - 1)} disabled={page <= 0}>
                  Anterior
                </button>
              </li>

              {paginasVisibles.map((pagina, index) =>
                pagina === "..." ? (
                  <li key={`categoria-dots-${index}`} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                ) : (
                  <li key={`categoria-page-${pagina}`} className={`page-item ${page === pagina ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(pagina)}>
                      {pagina + 1}
                    </button>
                  </li>
                )
              )}

              <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Siguiente
                </button>
              </li>

              <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  Ultima
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

