import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerInsumoPorId, crearInsumo, actualizarInsumo } from "../../services/insumos.js";
import { obtenerUnidadesMedida } from "../../services/unidadMedidas.js";
import Toast from "../../components/ui/Toast.jsx";

export default function InsumoForm({ 
  insumoId,     // para la página
  insumo,       // para el modal
  onSave,       // para el modal
  onCancel,     // para el modal
  errores: erroresExternos = {}  // para el modal
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(insumoId) || Boolean(insumo);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    ubicacion: "",
    fila: "",
    columna: "",
    unidadMedidaId: "",
    stockActual: 0,
    stockMinimo: 0,
    activo: true
  });

  // Cargar unidades de medida para el select
  useEffect(() => {
    const cargarUnidades = async () => {
      try {
        const data = await obtenerUnidadesMedida();
        if (data.content) {
          setUnidadesMedida(data.content);
        } else if (Array.isArray(data)) {
          setUnidadesMedida(data);
        }
      } catch (e) {
        console.error("Error cargando unidades de medida:", e);
      }
    };
    cargarUnidades();
  }, []);

  // Cargar datos del insumo si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && insumo) {
        setFormData({
          nombre: insumo.nombre || "",
          descripcion: insumo.descripcion || "",
          ubicacion: insumo.ubicacion || "",
          fila: insumo.fila || "",
          columna: insumo.columna || "",
          unidadMedidaId: insumo.unidadMedida?.id || "",
          stockActual: insumo.stockActual || 0,
          stockMinimo: insumo.stockMinimo || 0,
          activo: insumo.activo ?? true
        });
        return;
      }

      if (!esModal && insumoId) {
        try {
          const data = await obtenerInsumoPorId(insumoId);
          setFormData({
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            ubicacion: data.ubicacion || "",
            fila: data.fila || "",
            columna: data.columna || "",
            unidadMedidaId: data.unidadMedida?.id || "",
            stockActual: data.stockActual || 0,
            stockMinimo: data.stockMinimo || 0,
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };
    cargar();
  }, [insumoId, insumo, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              (type === "number" ? parseFloat(value) || 0 : value)
    }));

    if (erroresBackend[name]) {
      setErroresBackend(prev => {
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

      let respuesta;
      if (esEdicion) {
        const id = insumo?.id || insumoId;
        respuesta = await actualizarInsumo(id, formData);
      } else {
        respuesta = await crearInsumo(formData);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Insumo actualizado con éxito!" : "¡Insumo registrado con éxito!");
        setTimeout(() => navigate("/insumos"), 1500);
      }

    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        if (esModal) {
          console.error("Error en modal:", error);
        } else {
          setToastType("danger");
          setToastMessage(error.message || "Error al guardar los datos");
        }
      }
    }
  }

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/insumos");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-box-seam me-2"></i>Información del Insumo
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Nombre del Insumo <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  className={inputClass("nombre")} 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej:Tornillos, Tubo, Tela..."
                />
                <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Unidad de Medida <span className="text-danger">*</span>
                </label>
                <select
                  name="unidadMedidaId"
                  className={selectClass("unidadMedidaId")}
                  value={formData.unidadMedidaId}
                  onChange={handleChange}
                >
                  <option value="">Selecciona una unidad...</option>
                  {unidadesMedida.map(um => (
                    <option key={um.id} value={um.id}>
                      {um.nombre} ({um.simbolo})
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">{erroresBackend.unidadMedidaId || erroresExternos.unidadMedidaId}</div>
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold">Descripción</label>
                <textarea
                  name="descripcion"
                  className={inputClass("descripcion")}
                  value={formData.descripcion || ""}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Descripción detallada del insumo..."
                />
                <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Ubicación</label>
                <input 
                  type="text" 
                  name="ubicacion" 
                  className={inputClass("ubicacion")} 
                  value={formData.ubicacion} 
                  onChange={handleChange} 
                  placeholder="Ej: Almacén A, Estante 3..."
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Fila</label>
                <input 
                  type="text" 
                  name="fila" 
                  className={inputClass("fila")} 
                  value={formData.fila} 
                  onChange={handleChange} 
                  placeholder="A01"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Columna</label>
                <input 
                  type="text" 
                  name="columna" 
                  className={inputClass("columna")} 
                  value={formData.columna} 
                  onChange={handleChange} 
                  placeholder="B02"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Stock Actual</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="stockActual" 
                  className={inputClass("stockActual")} 
                  value={formData.stockActual} 
                  onChange={handleChange} 
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Stock Mínimo</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  name="stockMinimo" 
                  className={inputClass("stockMinimo")} 
                  value={formData.stockMinimo} 
                  onChange={handleChange} 
                />
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
                        Insumo {formData.activo ? 'Activo' : 'Inactivo'}
                      </label>
                      <small className="text-muted">
                        {formData.activo 
                          ? 'El insumo está habilitado para su uso' 
                          : 'El insumo está deshabilitado'}
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
                Insumo {formData.activo ? 'Activo' : 'Inactivo'}
              </label>
            </div>
          )}
          
          <div className={`gap-2 d-flex ${esModal ? 'ms-auto' : ''}`}>
            <button 
              type="button" 
              className="btn btn-light px-4" 
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary px-5 fw-bold"
            >
              {esEdicion ? 'Guardar Cambios' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}