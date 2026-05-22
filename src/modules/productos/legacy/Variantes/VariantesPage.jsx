// ============================================
// RUTA: src/pages/Variantes/VariantesPage.jsx
// ============================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useVariantes } from "./useVariantes";
import VariantesTable from "./VariantesTable";
import PageHeader from "../../../../components/Sistema/PageHeader";
import Toast from "../../../../components/ui/Toast";

export default function VariantesPage() {
  const navigate = useNavigate();

  const {
    productos,
    loadingLista,
    error,
    eliminarProducto
  } = useVariantes();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const abrirEditar = (producto) => {
    navigate(`/productos/${producto.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar este producto?");
    if (!confirmacion) return;

    try {
      await eliminarProducto(id);
      setToastType("success");
      setToastMessage("Producto eliminado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar producto");
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
        title="Catálogo de Productos"
        subtitle="Administración de SKUs y productos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/productos/nuevo")}
          >
            Nuevo Producto
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">Cargando productos...</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <VariantesTable
        data={productos}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}

