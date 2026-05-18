import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lineaProductoGateway } from "../../gateways/lineaProductoGateway.js";
import Toast from "../../components/ui/Toast.jsx";

export default function LineaProductoForm({
  lineaProductoId,
  lineaProducto,
  onSave,
  onCancel,
  errores: erroresExternos = {}
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});

  const navigate = useNavigate();

  const esModal = Boolean(onSave);
  const esEdicion = Boolean(lineaProductoId) || Boolean(lineaProducto);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    activo: true
  });

  const mapLineaToForm = (data = {}) => ({
    codigo: data.codigo || "",
    nombre: data.nombre || "",
    descripcion: data.descripcion || "",
    activo: data.activo ?? true
  });

  useEffect(() => {
    const cargar = async () => {
      if (esModal && lineaProducto) {
        setFormData(mapLineaToForm(lineaProducto));
        return;
      }

      if (!esModal && lineaProductoId) {
        try {
          const data = await lineaProductoGateway.obtenerLineaProductoPorId(lineaProductoId);
          setFormData(mapLineaToForm(data));
        } catch (error) {
          console.error("Error cargando:", error);
        }
      }
    };

    cargar();
  }, [lineaProductoId, lineaProducto, esModal]);

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

      const dataToSend = {
        codigo: formData.codigo?.toString().trim() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        activo: Boolean(formData.activo)
      };

      let respuesta;
      if (esEdicion) {
        const id = lineaProducto?.id || lineaProductoId;
        respuesta = await lineaProductoGateway.actualizarLineaProducto(id, dataToSend);
      } else {
        respuesta = await lineaProductoGateway.crearLineaProducto(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "Linea de producto actualizada con exito" : "Linea de producto registrada con exito");
        setTimeout(() => navigate("/lineas-producto"), 1500);
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

  async function handleEliminar() {
    const confirmacion = window.confirm("Seguro que deseas eliminar esta linea de producto?");
    if (!confirmacion) return;

    try {
      const id = lineaProducto?.id || lineaProductoId;
      await lineaProductoGateway.eliminarLineaProducto(id);
      setToastType("success");
      setToastMessage("Linea de producto eliminada correctamente");
      setTimeout(() => navigate("/lineas-producto"), 1500);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "Error al eliminar la linea de producto");
    }
  }

  const inputClass = (field) =>
    `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/lineas-producto");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Linea de Producto" : "Nueva Linea de Producto"}</h2>
          <span className={`badge ${formData.activo ? "bg-success" : "bg-secondary"}`}>
            {formData.activo ? "Activa" : "Inactiva"}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-tag me-2"></i>Informacion de la Linea
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
                  placeholder="Ej: E, H, O, ..."
                />
                <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
              </div>

              <div className="col-md-8">
                <label className="form-label fw-semibold">
                  Nombre de la Linea <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  className={inputClass("nombre")}
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Escolar, Hogar, Oficina, ..."
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripcion</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Descripcion detallada de la linea de producto"
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                <div className="form-text text-muted">Maximo 500 caracteres</div>
              </div>
            </div>
          </div>
        </div>

        {!esModal && (
          <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                id="switchActivo"
              />
              <label className="form-check-label fw-semibold" htmlFor="switchActivo">
                Linea de producto habilitada
              </label>
            </div>
          </div>
        )}

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
                Linea habilitada
              </label>
            </div>
          )}

          {!esModal && esEdicion ? (
            <button
              type="button"
              className="btn btn-outline-danger px-4"
              onClick={handleEliminar}
            >
              Eliminar
            </button>
          ) : (
            <span />
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
