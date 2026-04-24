// ============================================
// RUTA: src/pages/Variantes/VariantesPage.jsx
// ============================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useVariantes } from "./useVariantes";
import VariantesTable from "./VariantesTable";
import PageHeader from "../../components/Sistema/PageHeader";
import Toast from "../../components/ui/Toast";

export default function VariantesPage() {

  const navigate = useNavigate();

  const {
    variantes,
    loadingLista,
    error,
    eliminarVariante
  } = useVariantes();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const abrirEditar = (variante) => {
    navigate(`/variantes/${variante.id}`);
  };

  const manejarEliminar = async (id) => {
    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta variante?");
    if (!confirmacion) return;

    try {
      await eliminarVariante(id);
      setToastType("success");
      setToastMessage("Variante eliminada correctamente");
    } catch (e) {
      setToastType("danger");
      setToastMessage("Error al eliminar variante");
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
        title="Catálogo de Variantes"
        subtitle="Administración de SKUs y variantes de productos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/variantes/nuevo")}
          >
            Nueva Variante
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">Cargando variantes...</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <VariantesTable
        data={variantes}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}