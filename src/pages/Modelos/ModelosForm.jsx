import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerModeloPorId, crearModelo, actualizarModelo } from "../../services/modelos.js";
import { obtenerFamilias } from "../../services/familias.js";
import Toast from "../../components/ui/Toast.jsx";

export default function ModeloForm({
  modeloId,
  modelo,
  onSave,
  onCancel,
  errores: erroresExternos = {}
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [familias, setFamilias] = useState([]);

  const navigate = useNavigate();

  const esModal = Boolean(onSave);
  const esEdicion = Boolean(modeloId) || Boolean(modelo);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    familiaId: "",
    activo: true
  });

  useEffect(() => {
    const cargarFamilias = async () => {
      try {
        const data = await obtenerFamilias();
        if (data.content) {
          setFamilias(data.content);
        } else if (Array.isArray(data)) {
          setFamilias(data);
        }
      } catch (e) {
        console.error("Error cargando familias:", e);
      }
    };

    cargarFamilias();
  }, []);

  useEffect(() => {
    const cargar = async () => {
      if (esModal && modelo) {
        setFormData({
          codigo: modelo.codigo || modelo.sku || "",
          nombre: modelo.nombre || "",
          descripcion: modelo.descripcion || "",
          familiaId: modelo.familiaId || modelo.familia_id || modelo.familia?.id || "",
          activo: modelo.activo ?? true
        });
        return;
      }

      if (!esModal && modeloId) {
        try {
          const data = await obtenerModeloPorId(modeloId);
          setFormData({
            codigo: data.codigo || data.sku || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            familiaId: data.familiaId || data.familia_id || data.familia?.id || "",
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };

    cargar();
  }, [modeloId, modelo, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (erroresBackend[name]) {
      setErroresBackend((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setErroresBackend({});
      const rawFamiliaId = formData.familiaId?.toString().trim();
      const familiaIdNormalizado = rawFamiliaId && /^\d+$/.test(rawFamiliaId) ? Number(rawFamiliaId) : null;

      if (!familiaIdNormalizado) {
        setErroresBackend((prev) => ({
          ...prev,
          familiaId: "La familia es obligatoria"
        }));
        return;
      }

      const dataToSend = {
        codigo: formData.codigo?.toString().trim() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        familia_id: familiaIdNormalizado,
        activo: Boolean(formData.activo)
      };

      let respuesta;
      if (esEdicion) {
        const id = modelo?.id || modeloId;
        respuesta = await actualizarModelo(id, dataToSend);
      } else {
        respuesta = await crearModelo(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "Modelo actualizado con exito" : "Modelo registrado con exito");
        setTimeout(() => navigate("/modelos"), 1500);
      }
    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else if (esModal) {
        console.error("Error en modal:", error);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  }

  const inputClass = (field) =>
    `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) =>
    `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/modelos");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Modelo" : "Nuevo Modelo"}</h2>
          <span className={`badge ${formData.activo ? "bg-success" : "bg-secondary"}`}>
            {formData.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-tag me-2"></i>Informacion del Modelo
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Codigo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  className={inputClass("codigo")}
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="Ej: MOD-001"
                />
                <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Nombre del Modelo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  className={inputClass("nombre")}
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Silla, Con Paleta, Plegable"
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Familia <span className="text-danger">*</span>
                </label>
                <select
                  name="familiaId"
                  className={selectClass("familiaId")}
                  value={formData.familiaId}
                  onChange={handleChange}
                >
                  <option value="">Selecciona una familia...</option>
                  {familias.map((familia) => {
                    const familiaOptionId = familia.id ?? familia.familiaId;
                    return (
                      <option key={familiaOptionId} value={familiaOptionId}>
                        {familia.nombre}
                      </option>
                    );
                  })}
                </select>
                <div className="invalid-feedback">{erroresBackend.familiaId || erroresExternos.familiaId}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripcion</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Descripcion detallada del modelo"
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                <div className="form-text text-muted">Maximo 500 caracteres</div>
              </div>

              <div className="col-md-12">
                <div className="border-top pt-3 mt-2">
                  <div className="d-flex align-items-center">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        id="activoSwitch"
                        style={{ width: "40px", height: "20px", cursor: "pointer" }}
                      />
                    </div>
                    <div className="ms-3">
                      <label className="form-check-label fw-semibold d-block" htmlFor="activoSwitch" style={{ cursor: "pointer" }}>
                        Modelo {formData.activo ? "Activo" : "Inactivo"}
                      </label>
                      <small className="text-muted">
                        {formData.activo
                          ? "El modelo de producto esta habilitado y disponible"
                          : "El modelo de producto esta deshabilitado"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
          {esModal && (
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                id="switchActivoModal"
              />
              <label className="form-check-label fw-semibold" htmlFor="switchActivoModal">
                Modelo {formData.activo ? "Activo" : "Inactivo"}
              </label>
            </div>
          )}

          <div className={`gap-2 d-flex ${esModal ? "ms-auto" : ""}`}>
            <button type="button" className="btn btn-light px-4" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary px-5 fw-bold">
              {esEdicion ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
