import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFamilias } from "./useFamilias";

import FamiliasTable from "./FamiliasTable";
import PageHeader from "../../components/Sistema/PageHeader";
import Toast from "../../components/ui/Toast";

export default function FamiliasPage() {

  const navigate = useNavigate();

  const {
    familias,
    loadingLista,
    error,
    eliminarFamilia
  } = useFamilias();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const abrirEditar = (familia) => {
    navigate(`/familias/${familia.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar esta familia?");
    if (!confirmacion) return;

    try {

      await eliminarFamilia(id);

      setToastType("success");
      setToastMessage("Familia eliminada correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar familia");

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
        title="Catálogo de Familias"
        subtitle="Administración de familias de productos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/familias/nuevo")}
          >
            Nueva Familia
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando familias...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <FamiliasTable
        data={familias}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}