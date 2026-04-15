import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProveedores } from "./useProveedores";

import ProveedoresTable from "../../components/Proveedores/ProveedoresTable.jsx";
import PageHeader from "../../components/Sistema/PageHeader.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ProveedoresPage() {

  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const {
    proveedores,
    loadingLista,
    error,
    eliminarProveedor
  } = useProveedores();

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [soloActivos, setSoloActivos] = useState(false);

  const abrirEditar = (proveedor) => {
    navigate(`/proveedores/${proveedor.id}`);
  };

  const manejarEliminar = async (id) => {

    const confirmacion = window.confirm("¿Seguro que deseas eliminar este proveedor?");
    if (!confirmacion) return;

    try {

      await eliminarProveedor(id);

      setToastType("success");
      setToastMessage("Proveedor eliminado correctamente");

    } catch (e) {

      setToastType("danger");
      setToastMessage("Error al eliminar proveedor");
    }
  };

 const proveedoresFiltrados = proveedores.filter((p) => {
  // 1. Normalizamos la búsqueda del usuario (quitamos espacios extras y pasamos a minúsculas)
  const terminoBusqueda = busqueda.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Si no hay nada escrito, mostramos todo, pero respetando los otros filtros (Estatus/Solo Activos)
  const pasaFiltroTexto = (() => {
    if (!terminoBusqueda) return true;

    // 2. Separamos lo que escribió el usuario en palabras individuales
    // Ejemplo: "Jose Alcala" -> ["jose", "alcala"]
    const palabras = terminoBusqueda.split(' ');

    // 3. Construimos una sola cadena con toda la info del proveedor para comparar
    const infoProveedor = [
      p.razonSocial,
      p.rfc,
      p.nombre,
      p.apellidoPaterno,
      p.apellidoMaterno,
      p.correo,
      p.telefono,
      p.tipoInsumo
    ].filter(Boolean).join(' ').toLowerCase();

    // 4. REGLA: Todas las palabras buscadas deben existir dentro de la info del proveedor
    // No importa el orden, ni si hay palabras entre medio (como el segundo nombre)
    return palabras.every(palabra => infoProveedor.includes(palabra));
  })();

  // 5. Filtros de Estatus (Select)
  const coincideEstatus =
    filtroEstatus === "TODOS" ||
    (filtroEstatus === "ACTIVO" && p.activo) ||
    (filtroEstatus === "INACTIVO" && !p.activo);

  // 6. Filtro de Switch (Solo activos)
  const coincideSoloActivos = !soloActivos || p.activo;

  // El proveedor debe cumplir las 3 condiciones
  return pasaFiltroTexto && coincideEstatus && coincideSoloActivos;
});
  
  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Directorio de Proveedores"
        subtitle="Base de datos centralizada de proveedores"
        actions={
          <button
            className="btn btn-success"
            onClick={() => navigate("/proveedores/nuevo")}
          >
            Nuevo Proveedor
          </button>
        }
      />

      {loadingLista && (
        <div className="alert alert-info">
          Cargando proveedores...
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

            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por razón social, contacto, correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
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

            <div className="col-md-2 d-flex align-items-center">
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

      <ProveedoresTable
        data={proveedoresFiltrados}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
      />
    </>
  );
}
