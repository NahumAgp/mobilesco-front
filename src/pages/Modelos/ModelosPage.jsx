import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useModelos } from "./useModelos.js";
import ModelosTable from "./ModelosTable.jsx";

import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ModelosPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    modelos,
    loadingLista,
    error,
    eliminarModelo
  } = useModelos();

  const [busqueda, setBusqueda] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const familiasDisponibles = useMemo(() => {
    const familiasUnicas = new Set();

    modelos.forEach((modelo) => {
      const nombreFamilia = (modelo.familiaNombre || modelo.familia?.nombre || "").trim();
      if (nombreFamilia) {
        familiasUnicas.add(nombreFamilia);
      }
    });

    return Array.from(familiasUnicas).sort((a, b) => a.localeCompare(b, "es"));
  }, [modelos]);

  const abrirEditar = (modelo) => {
    navigate(`/modelos/${modelo.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("�Seguro que deseas eliminar este modelo?");
    if (!confirmacion) return;

    try {

      await eliminarModelo(id);

      setToastType("success");
      setToastMessage("Modelo eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar modelo");
    }
  };

 const modelosFiltrados = modelos.filter((modelo) => {
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, " ");

  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    const palabras = terminoBusqueda.split(" ");
    const familiaNombre = modelo.familiaNombre || modelo.familia?.nombre;

    const infoModelo = [
      modelo.nombre,
      modelo.descripcion,
      familiaNombre
    ].filter(Boolean).join(" ").toLowerCase();

    return palabras.every((palabra) => infoModelo.includes(palabra));
  })();

  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && modelo.activo) ||
    (filtroEstatus === "INACTIVO" && !modelo.activo);

  const coincideSoloActivos = !soloActivos || modelo.activo;
  const familiaModelo = (modelo.familiaNombre || modelo.familia?.nombre || "").trim();
  const coincideFamilia = !filtroFamilia || familiaModelo === filtroFamilia;

  return pasaFiltroTexto && coincideEstatus && coincideSoloActivos && coincideFamilia;
});

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Modelos"
        subtitle="Catálogo de modelos"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/modelos/nuevo")}
          >
            Nuevo Modelo
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando modelos...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">

            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, descripción o familia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroFamilia}
                onChange={(e) => setFiltroFamilia(e.target.value)}
              >
                <option value="">Todas las familias</option>
                {familiasDisponibles.map((familia) => (
                  <option key={familia} value={familia}>
                    {familia}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={soloActivos}
                  onChange={() => setSoloActivos(!soloActivos)}
                />
                <label className="form-check-label">
                  Solo activos
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <ModelosTable
        data={modelosFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}
