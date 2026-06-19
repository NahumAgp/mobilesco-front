import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colorGateway } from "../services/colorGateway.js";
import Toast from "../../../components/ui/Toast.jsx";
import "./ColorPage.css";
import { useGeneratedCatalogCode } from "../../../hooks/useGeneratedCatalogCode.js";
import ColorPickerEditor from "../components/ColorPickerEditor.jsx";

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
    descripcion: "",
    hex: "#FF107A"
  });
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    formData.nombre,
    !esEdicion,
    colorGateway.obtenerCodigoSugerido
  );

  const mapColorToForm = (data = {}) => ({
    codigo: data.codigo || "",
    nombre: data.nombre || "",
    descripcion: data.descripcion || "",
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
          const data = await colorGateway.obtenerColorPorId(colorId);
          setFormData(mapColorToForm(data));
        } catch (error) {
          console.error("Error cargando:", error);
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
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        hex: formData.hex?.trim() || ""
      };
      if (esEdicion) {
        dataToSend.codigo = formData.codigo?.toString().trim() || "";
      }

      let respuesta;
      if (esEdicion) {
        const id = color?.id || colorId;
        respuesta = await colorGateway.actualizarColor(id, dataToSend);
      } else {
        respuesta = await colorGateway.crearColor(dataToSend);
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

  const handleEliminar = async () => {
    if (!esEdicion || esModal) return;

    const confirmado = window.confirm("¿Seguro que deseas eliminar este color?");
    if (!confirmado) return;

    const id = color?.id || colorId;
    if (!id) {
      setToastType("danger");
      setToastMessage("No se encontro el ID del color para eliminar.");
      return;
    }

    try {
      await colorGateway.eliminarColor(id);
      setToastType("success");
      setToastMessage("Color eliminado con exito");
      setTimeout(() => navigate("/colores"), 1200);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar el color");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4 colores-page-shell"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Color" : "Nuevo Color"}</h2>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4 colores-table-card">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-palette me-2"></i>Informacion del Color
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
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
                  Codigo generado <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  className={`${inputClass("codigo")} ${!esEdicion ? "bg-light text-secondary" : ""}`}
                  value={esEdicion ? formData.codigo : codigoGenerado}
                  onChange={handleChange}
                  readOnly={!esEdicion}
                  maxLength="10"
                  placeholder={generandoCodigo ? "Generando..." : "Automatico"}
                />
                <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripcion</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripcion opcional del color"
                  rows="3"
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                <div className="form-text text-muted">Maximo 255 caracteres</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">
                  Editar color <span className="text-danger">*</span>
                </label>
                <ColorPickerEditor
                  value={formData.hex}
                  onChange={(hex) => setFormData((prev) => ({ ...prev, hex }))}
                  error={erroresBackend.hex || erroresExternos.hex}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center bg-white p-3 rounded shadow-sm">
          <div className="gap-2 d-flex">
            {!esModal && esEdicion && (
              <button type="button" className="btn btn-outline-danger px-4" onClick={handleEliminar}>
                Eliminar
              </button>
            )}
            <button type="button" className="btn btn-light px-4" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn colores-brand-primary px-5 fw-bold">
              {esEdicion ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


