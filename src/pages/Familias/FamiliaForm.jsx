import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  obtenerFamiliaPorId,
  crearFamilia,
  actualizarFamilia
} from "../../services/familias";

export default function FamiliaForm({ familiaId }) {

  const navigate = useNavigate();
  const esEdicion = Boolean(familiaId);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true
  });

  useEffect(() => {

    const cargar = async () => {

      if (!familiaId) return;

      try {

        const data = await obtenerFamiliaPorId(familiaId);
        setFormData(data);

      } catch (error) {

        console.error(error);

      }
    };

    cargar();

  }, [familiaId]);

  function handleChange(e) {

    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

  }

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      if (esEdicion) {
        await actualizarFamilia(familiaId, formData);
      } else {
        await crearFamilia(formData);
      }

      navigate("/familias");

    } catch (error) {

      console.error(error);

    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <div className="mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          name="nombre"
          className="form-control"
          value={formData.nombre}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Descripción</label>
        <textarea
          name="descripcion"
          className="form-control"
          value={formData.descripcion}
          onChange={handleChange}
        />
      </div>

      <div className="form-check form-switch mb-3">

        <input
          className="form-check-input"
          type="checkbox"
          name="activo"
          checked={formData.activo}
          onChange={handleChange}
        />

        <label className="form-check-label">
          Activo
        </label>

      </div>

      <button type="submit" className="btn btn-primary">
        Guardar
      </button>

    </form>
  );
}