import { useEffect, useState } from "react";
import { obtenerFamilias } from "../../../../services/familias.js";

export default function ModeloStep({ data, onUpdate }) {
  const [errores, setErrores] = useState({});
  const [touched, setTouched] = useState({});
  const [familias, setFamilias] = useState([]);
  const [cargandoFamilias, setCargandoFamilias] = useState(true);
  const [errorFamilias, setErrorFamilias] = useState("");

  useEffect(() => {
    const cargarFamilias = async () => {
      try {
        setCargandoFamilias(true);
        setErrorFamilias("");

        const respuesta = await obtenerFamilias();
        if (Array.isArray(respuesta?.content)) {
          setFamilias(respuesta.content);
        } else if (Array.isArray(respuesta)) {
          setFamilias(respuesta);
        } else {
          setFamilias([]);
        }
      } catch (error) {
        setFamilias([]);
        setErrorFamilias(error?.message || "No se pudieron cargar las familias.");
      } finally {
        setCargandoFamilias(false);
      }
    };

    cargarFamilias();
  }, []);

  const validarCampo = (name, rawValue) => {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (name === "codigo" && !value) return "El codigo es requerido";
    if (name === "nombre" && !value) return "El nombre es requerido";
    if (name === "familiaId" && !value) return "La familia es requerida";

    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    onUpdate("modelo", {
      [name]: nextValue
    });

    if (touched[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: validarCampo(name, nextValue)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrores((prev) => ({
      ...prev,
      [name]: validarCampo(name, fieldValue)
    }));
  };

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-box me-2 text-primary"></i>
        Datos del Modelo
      </h4>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold">
            Codigo <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="codigo"
            className={`form-control ${errores.codigo ? "is-invalid" : ""}`}
            value={data.modelo.codigo}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: PROD-001"
          />
          {errores.codigo && <div className="invalid-feedback">{errores.codigo}</div>}
        </div>

        <div className="col-md-8">
          <label className="form-label fw-semibold">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
            value={data.modelo.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: Silla Ejecutiva"
          />
          {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">
            Familia <span className="text-danger">*</span>
          </label>
          <select
            name="familiaId"
            className={`form-select ${errores.familiaId ? "is-invalid" : ""}`}
            value={data.modelo.familiaId}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={cargandoFamilias}
          >
            <option value="">
              {cargandoFamilias ? "Cargando familias..." : "Seleccionar familia..."}
            </option>
            {familias.map((familia) => (
              <option key={familia.id} value={familia.id}>
                {familia.nombre}
              </option>
            ))}
          </select>
          {errores.familiaId && <div className="invalid-feedback">{errores.familiaId}</div>}
          {errorFamilias && <div className="form-text text-danger">{errorFamilias}</div>}
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Descripcion</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows="3"
            value={data.modelo.descripcion || ""}
            onChange={handleChange}
            placeholder="Descripcion detallada del producto..."
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
              id="activoSwitch"
            />
            <label className="form-check-label fw-semibold" htmlFor="activoSwitch">
              Producto Activo
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
