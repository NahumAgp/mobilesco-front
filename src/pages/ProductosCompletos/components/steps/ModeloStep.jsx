import { useEffect, useState } from "react";
import { obtenerFamilias } from "../../../../services/familias.js";
import { obtenerModelos } from "../../../../services/modelos.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getModeloId = (modelo) =>
  modelo?.id || modelo?.modeloId || modelo?.id_producto_base || modelo?.productoBaseId || "";

const getFamiliaId = (modelo) =>
  modelo?.familiaId || modelo?.familia_id || modelo?.familia?.id || "";

export default function ModeloStep({ data, onUpdate }) {
  const [errores, setErrores] = useState({});
  const [touched, setTouched] = useState({});
  const [familias, setFamilias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [cargandoFamilias, setCargandoFamilias] = useState(true);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorFamilias, setErrorFamilias] = useState("");
  const [errorModelos, setErrorModelos] = useState("");

  const modo = data.modelo.modo || "existente";

  useEffect(() => {
    const cargarFamilias = async () => {
      try {
        setCargandoFamilias(true);
        setErrorFamilias("");
        setFamilias(getLista(await obtenerFamilias()));
      } catch (error) {
        setFamilias([]);
        setErrorFamilias(error?.message || "No se pudieron cargar las familias.");
      } finally {
        setCargandoFamilias(false);
      }
    };

    cargarFamilias();
  }, []);

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        setCargandoModelos(true);
        setErrorModelos("");
        setModelos(getLista(await obtenerModelos()));
      } catch (error) {
        setModelos([]);
        setErrorModelos(error?.message || "No se pudieron cargar los modelos.");
      } finally {
        setCargandoModelos(false);
      }
    };

    cargarModelos();
  }, []);

  const validarCampo = (name, rawValue) => {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (name === "id" && modo === "existente" && !value) return "Selecciona un modelo";
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

  const handleModoChange = (nuevoModo) => {
    onUpdate("modelo", {
      modo: nuevoModo,
      id: null,
      codigo: "",
      nombre: "",
      descripcion: "",
      familiaId: "",
      activo: true
    });
    setErrores({});
    setTouched({});
  };

  const handleModeloExistenteChange = (e) => {
    const modeloId = e.target.value;
    const modelo = modelos.find((item) => String(getModeloId(item)) === String(modeloId));

    onUpdate("modelo", {
      modo: "existente",
      id: modeloId || null,
      codigo: modelo?.codigo || "",
      nombre: modelo?.nombre || "",
      descripcion: modelo?.descripcion || "",
      familiaId: getFamiliaId(modelo),
      activo: modelo?.activo ?? true
    });

    if (touched.id) {
      setErrores((prev) => ({
        ...prev,
        id: validarCampo("id", modeloId)
      }));
    }
  };

  const familiaSeleccionada =
    familias.find((familia) => String(familia.id) === String(data.modelo.familiaId)) || null;

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-box me-2 text-primary"></i>
        Modelo del Producto
      </h4>

      <div className="btn-group mb-4" role="group" aria-label="Modo de modelo">
        <input
          type="radio"
          className="btn-check"
          name="modoModelo"
          id="modoModeloExistente"
          checked={modo === "existente"}
          onChange={() => handleModoChange("existente")}
        />
        <label className="btn btn-outline-primary" htmlFor="modoModeloExistente">
          Usar modelo existente
        </label>

        <input
          type="radio"
          className="btn-check"
          name="modoModelo"
          id="modoModeloNuevo"
          checked={modo === "nuevo"}
          onChange={() => handleModoChange("nuevo")}
        />
        <label className="btn btn-outline-primary" htmlFor="modoModeloNuevo">
          Crear modelo nuevo
        </label>
      </div>

      {modo === "existente" && (
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label fw-semibold">
              Modelo <span className="text-danger">*</span>
            </label>
            <select
              name="id"
              className={`form-select ${errores.id ? "is-invalid" : ""}`}
              value={data.modelo.id || ""}
              onChange={handleModeloExistenteChange}
              onBlur={handleBlur}
              disabled={cargandoModelos}
            >
              <option value="">
                {cargandoModelos ? "Cargando modelos..." : "Seleccionar modelo..."}
              </option>
              {modelos.map((modelo) => (
                <option key={getModeloId(modelo)} value={getModeloId(modelo)}>
                  {modelo.codigo ? `[${modelo.codigo}] ` : ""}
                  {modelo.nombre}
                </option>
              ))}
            </select>
            {errores.id && <div className="invalid-feedback">{errores.id}</div>}
            {errorModelos && <div className="form-text text-danger">{errorModelos}</div>}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Familia</label>
            <input
              type="text"
              className="form-control"
              value={familiaSeleccionada?.nombre || data.modelo.familiaId || "-"}
              readOnly
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Descripcion</label>
            <textarea className="form-control" rows="2" value={data.modelo.descripcion || ""} readOnly />
          </div>
        </div>
      )}

      {modo === "nuevo" && (
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
                Modelo activo
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
