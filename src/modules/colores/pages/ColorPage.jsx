import React, { useEffect, useState } from "react";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import { useNavigate } from "react-router-dom";

import { useColor } from "../hooks/useColor.js";
import ColorTable from "./ColorTable.jsx";
import { colorGateway } from "../services/colorGateway.js";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import "./ColorPage.css";

const PAGE_SIZE = 10;

export default function ColorPage() {
  const navigate = useNavigate();
  const canCreate = hasPermission(getUser(), "ACTION_COLORS_CREATE");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("colores"));
  usePersistedPagination("colores", page);

  const [busqueda, setBusqueda] = useState("");
  const { colores, pageInfo, loadingLista, error, recargar } = useColor({
    page,
    size: PAGE_SIZE,
    busqueda
  });

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
      await recargar({ page });
    } catch {
      setToastType("danger");
      setToastMessage("Error al cambiar el estado del color");
    }
  };

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      const timer = window.setTimeout(() => setPage(totalPages - 1), 0);
      return () => window.clearTimeout(timer);
    }
  }, [page, totalPages]);

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPage(0);
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Colores"
        subtitle="Catalogo de colores"
        actions={
          canCreate && <button className="btn colores-brand-primary" onClick={() => navigate("/colores/nuevo")}>
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
                onChange={handleBusquedaChange}
              />
            </div>
          </div>
        </div>
      </div>

      <ColorTable
        data={colores}
        onEditar={abrirEditar}
        onCambiarEstado={manejarCambioEstado}
      />

      {totalElements > 0 && (
        <CatalogPagination
          currentPage={paginaActual}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          currentCount={colores.length}
          itemLabel="colores"
          ariaLabel="Paginacion de colores"
          onPageChange={setPage}
          className="colores-pagination-panel mt-3"
        />
      )}
    </>
  );
}

