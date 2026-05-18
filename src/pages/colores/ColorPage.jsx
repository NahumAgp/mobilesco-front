import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useColor } from "./useColor.js";
import ColorTable from "./ColorTable.jsx";
import { colorGateway } from "../../gateways/colorGateway.js";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./ColorPage.css";

const PAGE_SIZE = 10;

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) paginas.push("...");
  for (let page = inicio; page <= fin; page += 1) paginas.push(page);
  if (fin < totalPages - 2) paginas.push("...");
  paginas.push(totalPages - 1);
  return paginas;
}

export default function ColorPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const { colores, loadingLista, error, recargar } = useColor();

  const [busqueda, setBusqueda] = useState("");

  const abrirEditar = (color) => {
    navigate(`/colores/${color.id}`);
  };

  const manejarCambioEstado = async (color) => {
    try {
      const nuevoEstado = !color.activo;
      if (nuevoEstado) {
        await colorGateway.activarColor(color.id);
      } else {
        await colorGateway.desactivarColor(color.id);
      }

      setToastType("success");
      setToastMessage(
        nuevoEstado ? "Color activado correctamente" : "Color desactivado correctamente"
      );
      await recargar();
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del color");
    }
  };

  const coloresFiltrados = colores.filter((color) => {
    const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(" ");
    const infoColor = [color.codigo, color.nombre, color.descripcion, color.hex].filter(Boolean).join(" ").toLowerCase();

    return palabras.every((palabra) => infoColor.includes(palabra));
  });

  const totalElements = coloresFiltrados.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const coloresPaginados = useMemo(
    () => coloresFiltrados.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [coloresFiltrados, page]
  );
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + coloresPaginados.length : 0;

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [busqueda]);

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Colores"
        subtitle="Catalogo de colores"
        actions={
          <button className="btn colores-brand-primary" onClick={() => navigate("/colores/nuevo")}>
            Nuevo Color
          </button>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando colores...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 colores-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por codigo, nombre o hex..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <ColorTable
        data={coloresPaginados}
        onEditar={abrirEditar}
        onCambiarEstado={manejarCambioEstado}
      />

      {totalElements > 0 && (
        <div className="colores-pagination-panel mt-3">
          <div className="colores-pagination-summary">
            {`Mostrando ${desde} a ${hasta} de ${totalElements} colores`}
          </div>

          <nav aria-label="Paginacion de colores">
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
                  <li key={`dots-${index}`} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                ) : (
                  <li
                    key={`page-${pagina}`}
                    className={`page-item ${page === pagina ? "active" : ""}`}
                  >
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

