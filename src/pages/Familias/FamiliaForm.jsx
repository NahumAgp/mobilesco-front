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

  const obtenerErrorCampo = (campo) =>
    erroresBackend[campo] ||
    erroresBackend[`${campo}Id`] ||
    erroresBackend[`${campo}_id`] ||
    "";

  const inputClass = (campo) =>
    `form-control ${obtenerErrorCampo(campo) ? "is-invalid" : ""}`;

  const selectClass = (campo) =>
    `form-select ${obtenerErrorCampo(campo) ? "is-invalid" : ""}`;

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

    setErroresBackend((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;

      const copia = { ...prev };

      if (name === "lineaId") {
        delete copia.lineaId;
        delete copia.linea_id;
      } else {
        delete copia[name];
        delete copia[`${name}Id`];
        delete copia[`${name}_id`];
      }

      delete copia.general;
      delete copia.message;

      return copia;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const erroresValidacion = {};
      const codigo = formData.codigo?.toString().trim() || "";
      const nombre = formData.nombre?.trim() || "";
      const descripcion = formData.descripcion?.trim() || "";
      const lineaIdNormalizado = formData.lineaId ? Number(formData.lineaId) : null;

      if (!codigo) {
        erroresValidacion.codigo = "El codigo es obligatorio";
      }

      if (!nombre) {
        erroresValidacion.nombre = "El nombre es obligatorio";
      }

      if (!lineaIdNormalizado) {
        erroresValidacion.lineaId = "La linea es obligatoria";
      }

      if (Object.keys(erroresValidacion).length > 0) {
        setErroresBackend(erroresValidacion);
        return;
      }

      const payload = {
        codigo,
        nombre,
        descripcion,
        lineaId: lineaIdNormalizado,
        linea_id: lineaIdNormalizado,
        activo: Boolean(formData.activo)
      };

      setErroresBackend({});

      if (esEdicion) {
        await actualizarFamilia(familiaId, payload);
      } else {
        await crearFamilia(payload);
      }

      navigate("/familias");
    } catch (error) {
      if (error?.errors) {
        setErroresBackend(error.errors);
      } else if (error?.message) {
        const mensaje = error.message;
        const erroresNormalizados = {};

        if (/c[oó]digo/i.test(mensaje)) {
          erroresNormalizados.codigo = mensaje;
        }

        if (/nombre/i.test(mensaje)) {
          erroresNormalizados.nombre = mensaje;
        }

        if (/descripci[oó]n/i.test(mensaje)) {
          erroresNormalizados.descripcion = mensaje;
        }

        if (/linea|l[ií]nea/i.test(mensaje)) {
          erroresNormalizados.lineaId = mensaje;
        }

        setErroresBackend(
          Object.keys(erroresNormalizados).length > 0
            ? erroresNormalizados
            : { general: mensaje }
        );
      } else {
        console.error(error);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {erroresBackend.general && (
        <div className="alert alert-danger">
          {erroresBackend.general}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Codigo</label>
          <input
            type="text"
            name="codigo"
            className={inputClass("codigo")}
            value={formData.codigo}
            onChange={handleChange}
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("codigo")}
          </div>
        </div>

        <div className="col-md-8">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            className={inputClass("nombre")}
            value={formData.nombre}
            onChange={handleChange}
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("nombre")}
          </div>
        </div>

        <div className="col-md-12">
          <label className="form-label">Descripcion</label>
          <textarea
            name="descripcion"
            className={inputClass("descripcion")}
            value={formData.descripcion}
            onChange={handleChange}
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("descripcion")}
          </div>
        </div>

        <div className="col-md-12">
          <label className="form-label">Linea</label>
          <select
            name="lineaId"
            className={selectClass("lineaId")}
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
          <div className="invalid-feedback">
            {obtenerErrorCampo("lineaId")}
          </div>
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
