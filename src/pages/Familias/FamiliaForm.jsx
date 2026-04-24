import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { obtenerFamiliaPorId, crearFamilia, actualizarFamilia } from "../../services/familias";
import { obtenerLineasProducto } from "../../services/lineaProducto";

export default function FamiliaForm({ familiaId }) {
  const navigate = useNavigate();
  const esEdicion = Boolean(familiaId);
  const [erroresBackend, setErroresBackend] = useState({});

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    lineaId: "",
    activo: true
  });
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    const cargarLineas = async () => {
      try {
        const data = await obtenerLineasProducto();

        if (data?.content) {
          setLineas(data.content);
        } else if (Array.isArray(data)) {
          setLineas(data);
        } else {
          setLineas([]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    cargarLineas();
  }, []);

  useEffect(() => {
    const cargar = async () => {
      if (!familiaId) return;

      try {
        const data = await obtenerFamiliaPorId(familiaId);
        setFormData({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          lineaId: data.lineaId || data.linea?.id || "",
          activo: data.activo ?? true
        });
      } catch (error) {
        console.error(error);
      }
    };

    cargar();
  }, [familiaId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setErroresBackend({});
      const lineaIdNormalizado = formData.lineaId ? Number(formData.lineaId) : null;

      if (!lineaIdNormalizado) {
        setErroresBackend((prev) => ({
          ...prev,
          lineaId: "La linea es obligatoria"
        }));
        return;
      }

      const payload = {
        codigo: formData.codigo?.toString().trim() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        lineaId: lineaIdNormalizado,
        linea_id: lineaIdNormalizado,
        activo: Boolean(formData.activo)
      };

      if (esEdicion) {
        await actualizarFamilia(familiaId, payload);
      } else {
        await crearFamilia(payload);
      }

      navigate("/familias");
    } catch (error) {
      if (error?.errors) {
        setErroresBackend(error.errors);
      } else {
        console.error(error);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Codigo</label>
          <input type="text" name="codigo" className="form-control" value={formData.codigo} onChange={handleChange} />
        </div>

        <div className="col-md-8">
          <label className="form-label">Nombre</label>
          <input type="text" name="nombre" className="form-control" value={formData.nombre} onChange={handleChange} />
        </div>

        <div className="col-md-12">
          <label className="form-label">Descripcion</label>
          <textarea name="descripcion" className="form-control" value={formData.descripcion} onChange={handleChange} />
        </div>

        <div className="col-md-12">
          <label className="form-label">Linea</label>
          <select
            name="lineaId"
            className={`form-select ${erroresBackend.lineaId || erroresBackend.linea_id ? "is-invalid" : ""}`}
            value={formData.lineaId}
            onChange={handleChange}
          >
            <option value="">Selecciona una linea...</option>
            {lineas.map((linea) => (
              <option key={linea.id ?? linea.lineaId} value={linea.id ?? linea.lineaId}>
                {linea.nombre}
              </option>
            ))}
          </select>
          <div className="invalid-feedback">{erroresBackend.lineaId || erroresBackend.linea_id}</div>
        </div>

        <div className="col-md-12">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
            />
            <label className="form-check-label">Activo</label>
          </div>
        </div>

        <div className="col-md-12">
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </div>
    </form>
  );
}
