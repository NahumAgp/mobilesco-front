import { useEffect, useMemo, useState } from "react";

import { obtenerFamiliasActivas } from "../../../../services/familias.js";
import { obtenerModelosActivos } from "../../../../services/modelos.js";
import SearchableSelect from "../../../../components/ui/SearchableSelect.jsx";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

export default function ModeloStep({ data, onUpdate }) {
  const [familias, setFamilias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const modelo = data?.modelo || {};
  const modo = modelo.modo || "existente";

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [familiasResp, modelosResp] = await Promise.all([
          obtenerFamiliasActivas(),
          obtenerModelosActivos()
        ]);

        setFamilias(getLista(familiasResp));
        setModelos(getLista(modelosResp));
      } catch (error) {
        console.error("Error cargando datos basicos del producto:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogos();
  }, []);

  const modeloSeleccionado = useMemo(
    () => modelos.find((item) => String(item.id) === String(modelo.id || "")) || null,
    [modelos, modelo.id]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    onUpdate("modelo", {
      [name]: type === "checkbox" ? checked : value
    });
  };

  const cambiarModo = (nuevoModo) => {
    onUpdate("modelo", {
      modo: nuevoModo,
      id: nuevoModo === "nuevo" ? null : modelo.id || null
    });
  };

  const seleccionarModelo = (modeloId, opcion) => {
    onUpdate("modelo", {
      id: modeloId || null,
      codigo: opcion?.codigo || "",
      nombre: opcion?.nombre || "",
      descripcion: opcion?.descripcion || "",
      familiaId: opcion?.familiaId || opcion?.familia?.id || ""
    });
  };

  if (cargando) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mb-0 mt-2">Cargando informacion basica...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-info-circle me-2 text-primary"></i>
        Informacion basica
      </h4>

      <div className="btn-group mb-4" role="group" aria-label="Modo de producto">
        <button
          type="button"
          className={`btn ${modo === "existente" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => cambiarModo("existente")}
        >
          Modelo existente
        </button>
        <button
          type="button"
          className={`btn ${modo === "nuevo" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => cambiarModo("nuevo")}
        >
          Nuevo modelo
        </button>
      </div>

      {modo === "existente" && (
        <div className="mb-4">
          <SearchableSelect
            label="Modelo"
            value={modelo.id || ""}
            options={modelos}
            onChange={seleccionarModelo}
            placeholder="Seleccionar modelo..."
            searchPlaceholder="Busca por codigo, nombre o descripcion..."
            getOptionValue={(item) => item.id}
            getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre}`}
            getOptionSearchText={(item) =>
              [item.codigo, item.nombre, item.descripcion].filter(Boolean).join(" ").toLowerCase()
            }
          />
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Codigo *</label>
          <input
            type="text"
            name="codigo"
            className="form-control"
            value={modelo.codigo || ""}
            onChange={handleChange}
            disabled={modo === "existente"}
            placeholder="Ej. MOD001"
          />
        </div>

        <div className="col-md-8">
          <label className="form-label fw-semibold">Nombre *</label>
          <input
            type="text"
            name="nombre"
            className="form-control"
            value={modelo.nombre || ""}
            onChange={handleChange}
            disabled={modo === "existente"}
            placeholder="Nombre del producto"
          />
        </div>

        <div className="col-md-5">
          <label className="form-label fw-semibold">Familia *</label>
          <select
            name="familiaId"
            className="form-select"
            value={modelo.familiaId || ""}
            onChange={handleChange}
            disabled={modo === "existente"}
          >
            <option value="">Seleccionar familia...</option>
            {familias.map((familia) => (
              <option key={familia.id} value={familia.id}>
                {familia.codigo ? `[${familia.codigo}] ` : ""}
                {familia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-7 d-flex align-items-end">
          {modeloSeleccionado && (
            <div className="text-muted small pb-2">
              Se usara este modelo como base para crear las combinaciones de material, categoria y color.
            </div>
          )}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Descripcion</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows="3"
            value={modelo.descripcion || ""}
            onChange={handleChange}
            disabled={modo === "existente"}
            placeholder="Descripcion corta del producto"
          />
        </div>

        {modo === "nuevo" && (
          <div className="col-12">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                name="activo"
                checked={modelo.activo !== false}
                onChange={handleChange}
                id="modelo-activo"
              />
              <label className="form-check-label" htmlFor="modelo-activo">
                Producto activo
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
