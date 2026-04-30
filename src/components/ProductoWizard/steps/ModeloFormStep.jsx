// components/ProductoWizard/steps/ModeloFormStep.jsx
import { useEffect, useState } from "react";
import { obtenerFamilias } from "../../../services/familias";

export default function ModeloFormStep({ data, onUpdate }) {
  const [familias, setFamilias] = useState([]);

  const cargarFamilias = async () => {
    const response = await obtenerFamilias();
    setFamilias(response.content || response);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      cargarFamilias();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onUpdate("modelo", {
      [name]: type === "checkbox" ? checked : value
    });
  };

  return (
    <div>
      <h4 className="mb-4">Datos Básicos del Producto</h4>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Código *</label>
          <input
            type="text"
            name="codigo"
            className="form-control"
            value={data.modelo.codigo}
            onChange={handleChange}
          />
        </div>
        
        <div className="col-md-8">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            name="nombre"
            className="form-control"
            value={data.modelo.nombre}
            onChange={handleChange}
          />
        </div>
        
        <div className="col-md-4">
          <label className="form-label">Familia *</label>
          <select
            name="familiaId"
            className="form-select"
            value={data.modelo.familiaId}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            {familias.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className="col-12">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows="3"
            value={data.modelo.descripcion}
            onChange={handleChange}
          />
        </div>
        
        <div className="col-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              checked={data.modelo.activo}
              onChange={handleChange}
            />
            <label className="form-check-label">Producto Activo</label>
          </div>
        </div>
      </div>
    </div>
  );
}
