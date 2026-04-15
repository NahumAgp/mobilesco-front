import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEmpleado } from "./useEmpleado";
import EmpleadosTable from "./EmpleadosTable";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function EmpleadoPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const { empleados, loadingLista, error, eliminarEmpleado } = useEmpleado();

  const [busqueda, setBusqueda] = useState("");

  const abrirEditar = (empleado) => {
    navigate(`/empleados/${empleado.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este empleado?");
    if (!confirmacion) return;

    try {

      await eliminarEmpleado(id);

      setToastType("success");
      setToastMessage("Empleado eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar empleado");

    }

  };

  const empleadosFiltrados = empleados.filter((e) => {

    const termino = busqueda.toLowerCase();

    return (
      e.nombre?.toLowerCase().includes(termino) ||
      e.apellidoPaterno?.toLowerCase().includes(termino) ||
      e.apellidoMaterno?.toLowerCase().includes(termino) ||
      e.telefono?.includes(termino)
    );

  });

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Catálogo de Empleados"
        subtitle="Administración de empleados"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/empleados/nuevo")}
          >
            Nuevo Empleado
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando empleados...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">

          <input
            type="text"
            className="form-control"
            placeholder="Buscar empleado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

        </div>
      </div>

      <EmpleadosTable
        data={empleadosFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );

}