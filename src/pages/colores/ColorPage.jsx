import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useColor } from "./useColor.js";
import ColorTable from "./ColorTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ColorPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const { colores, loadingLista, error, eliminarColor } = useColor();

  const [busqueda, setBusqueda] = useState("");

  const abrirEditar = (color) => {
    navigate(`/colores/${color.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("Seguro que deseas eliminar este color?");
    if (!confirmacion) return;

    try {
      await eliminarColor(id);
      setToastType("success");
      setToastMessage("Color eliminado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar color");
    }
  };

  const coloresFiltrados = colores.filter((color) => {
    const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(" ");
    const infoColor = [color.codigo, color.nombre, color.hex].filter(Boolean).join(" ").toLowerCase();

    return palabras.every((palabra) => infoColor.includes(palabra));
  });

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Colores"
        subtitle="Catalogo de colores"
        actions={
          <button className="btn btn-success" onClick={() => navigate("/colores/nuevo")}>
            Nuevo Color
          </button>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando colores...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
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

      <ColorTable data={coloresFiltrados} onEditar={abrirEditar} onEliminar={manejarEliminar} />
    </>
  );
}

