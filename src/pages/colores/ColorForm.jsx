import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerColorPorId, crearColor, actualizarColor } from "../../services/color.js";
import Toast from "../../components/ui/Toast.jsx";

export default function ColorForm({ colorId, color, onSave, onCancel, errores: erroresExternos = {} }) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});

  const navigate = useNavigate();

  const esModal = Boolean(onSave);
  const esEdicion = Boolean(colorId) || Boolean(color);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    hex: "#FF107A"
  });

  const mapColorToForm = (data = {}) => ({
    codigo: data.codigo || "",
    nombre: data.nombre || "",
    hex: data.hex || "#FF107A"
  });

  useEffect(() => {
    const cargar = async () => {
      if (esModal && color) {
        setFormData(mapColorToForm(color));
        return;
      }

      if (!esModal && colorId) {
        try {
          const data = await obtenerColorPorId(colorId);
          setFormData(mapColorToForm(data));
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };

    cargar();
  }, [colorId, color, esModal]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
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

      const dataToSend = {
        codigo: formData.codigo?.toString().trim() || "",
        nombre: formData.nombre?.trim() || "",
        hex: formData.hex?.trim() || ""
      };

      let respuesta;
      if (esEdicion) {
        const id = color?.id || colorId;
        respuesta = await actualizarColor(id, dataToSend);
      } else {
        respuesta = await crearColor(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "Color actualizado con exito" : "Color registrado con exito");
        setTimeout(() => navigate("/colores"), 1500);
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

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/colores");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Color" : "Nuevo Color"}</h2>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-palette me-2"></i>Informacion del Color
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
                  placeholder="Ej: ISV3ZXTEOR"
                />
                <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Nombre <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  className={inputClass("nombre")}
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Rosa Intenso"
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  HEX <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    name="hex"
                    className={inputClass("hex")}
                    value={formData.hex}
                    onChange={handleChange}
                    placeholder="#FF107A"
                  />
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(formData.hex) ? formData.hex : "#FF107A"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hex: e.target.value.toUpperCase() }))}
                    style={{ width: 52, border: "1px solid #ced4da", borderRadius: "0 .375rem .375rem 0" }}
                  />
                </div>
                <div className="invalid-feedback d-block">{erroresBackend.hex || erroresExternos.hex}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center bg-white p-3 rounded shadow-sm">
          <div className="gap-2 d-flex">
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
