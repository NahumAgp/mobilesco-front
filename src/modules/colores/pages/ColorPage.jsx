import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useColor } from "../hooks/useColor.js";
import ColorTable from "./ColorTable.jsx";
import { colorGateway } from "../services/colorGateway.js";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./ColorPage.css";

const PAGE_SIZE = 10;

export default function ColorPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(0);

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
  const coloresPaginados = useMemo(
    () => coloresFiltrados.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE),
    [coloresFiltrados, paginaActual]
  );
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
                onChange={handleBusquedaChange}
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
        <CatalogPagination
          currentPage={paginaActual}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          currentCount={coloresPaginados.length}
          itemLabel="colores"
          ariaLabel="Paginacion de colores"
          onPageChange={setPage}
          className="colores-pagination-panel mt-3"
        />
      )}
    </>
  );
}

