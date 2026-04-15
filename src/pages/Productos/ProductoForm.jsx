import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  obtenerProductoPorId, 
  crearProducto, 
  actualizarProducto 
} from "../../services/productos.js";
import { obtenerTiposProducto } from "../../services/tiposProducto.js";
import { obtenerLineasProducto } from "../../services/lineaProducto.js";
import { obtenerCategorias } from "../../services/categorias.js";
import { obtenerMateriales } from "../../services/materiales.js";
import Toast from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";

export default function ProductoForm({ 
  productoId,   // para la página
  producto,     // para el modal
  onSave,       // para el modal
  onCancel,     // para el modal
  errores: erroresExternos = {} 
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Catálogos
  const [tiposProducto, setTiposProducto] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [materiales, setMateriales] = useState([]);
  
  const navigate = useNavigate();
  
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(productoId) || Boolean(producto);

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    tipoProductoId: "",
    lineaId: "",
    categoriaId: "",
    materialId: "",
    caracteristicas: "",
    dimensiones: "",
    pesoKg: "",
    activo: true
  });

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tipos, lineasData, categoriasData, materialesData] = await Promise.all([
          obtenerTiposProducto(),
          obtenerLineasProducto(),
          obtenerCategorias(),
          obtenerMateriales()
        ]);

        setTiposProducto(tipos.content || tipos || []);
        setLineas(lineasData.content || lineasData || []);
        setCategorias(categoriasData.content || categoriasData || []);
        setMateriales(materialesData.content || materialesData || []);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    const cargar = async () => {
      if (esModal && producto) {
        setFormData({
          sku: producto.sku || "",
          nombre: producto.nombre || "",
          descripcion: producto.descripcion || "",
          tipoProductoId: producto.tipoProductoId || "",
          lineaId: producto.lineaId || "",
          categoriaId: producto.categoriaId || "",
          materialId: producto.materialId || "",
          caracteristicas: producto.caracteristicas || "",
          dimensiones: producto.dimensiones || "",
          pesoKg: producto.pesoKg || "",
          activo: producto.activo ?? true
        });
        return;
      }

      if (!esModal && productoId) {
        try {
          setLoading(true);
          const data = await obtenerProductoPorId(productoId);
          setFormData({
            sku: data.sku || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            tipoProductoId: data.tipoProductoId || "",
            lineaId: data.lineaId || "",
            categoriaId: data.categoriaId || "",
            materialId: data.materialId || "",
            caracteristicas: data.caracteristicas || "",
            dimensiones: data.dimensiones || "",
            pesoKg: data.pesoKg || "",
            activo: data.activo ?? true
          });
        } catch (e) {
          console.error("Error cargando producto:", e);
        } finally {
          setLoading(false);
        }
      }
    };
    cargar();
  }, [productoId, producto, esModal]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              (type === "number" ? (value === "" ? "" : parseFloat(value)) : value)
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

    // Validar campos requeridos
    if (!formData.sku || !formData.nombre || !formData.tipoProductoId) {
      alert("Completa los campos obligatorios: SKU, Nombre y Tipo de Producto");
      return;
    }

    // Convertir valores vacíos a null
    const dataToSend = {
      ...formData,
      lineaId: formData.lineaId || null,
      categoriaId: formData.categoriaId || null,
      materialId: formData.materialId || null,
      pesoKg: formData.pesoKg === "" ? null : formData.pesoKg
    };

    try {
      setErroresBackend({});

      let respuesta;
      if (esEdicion) {
        const id = producto?.id || productoId;
        respuesta = await actualizarProducto(id, dataToSend);
      } else {
        respuesta = await crearProducto(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Producto actualizado con éxito!" : "¡Producto registrado con éxito!");
        setTimeout(() => navigate("/productos"), 1500);
      }

    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  }

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/productos");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      )}
      
      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <span className={`badge ${formData.activo ? 'bg-success' : 'bg-secondary'}`}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-md-8">
            {/* Información básica */}
            <Card title="Información Básica" icon="bi-info-circle" className="mb-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    SKU <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="sku" 
                    className={inputClass("sku")} 
                    value={formData.sku} 
                    onChange={handleChange} 
                    placeholder="Ej: PROD-001"
                  />
                  <div className="invalid-feedback">{erroresBackend.sku}</div>
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nombre" 
                    className={inputClass("nombre")} 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    placeholder="Nombre del producto"
                  />
                  <div className="invalid-feedback">{erroresBackend.nombre}</div>
                </div>

                <div className="col-md-12">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    name="descripcion"
                    className={inputClass("descripcion")}
                    value={formData.descripcion || ""}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Descripción del producto..."
                  />
                  <div className="invalid-feedback">{erroresBackend.descripcion}</div>
                </div>
              </div>
            </Card>

            {/* Clasificación */}
            <Card title="Clasificación" icon="bi-tags" className="mb-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Tipo de Producto <span className="text-danger">*</span>
                  </label>
                  <select
                    name="tipoProductoId"
                    className={selectClass("tipoProductoId")}
                    value={formData.tipoProductoId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tiposProducto.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                  <div className="invalid-feedback">{erroresBackend.tipoProductoId}</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Línea</label>
                  <select
                    name="lineaId"
                    className={selectClass("lineaId")}
                    value={formData.lineaId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar línea...</option>
                    {lineas.map(linea => (
                      <option key={linea.id} value={linea.id}>{linea.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Categoría</label>
                  <select
                    name="categoriaId"
                    className={selectClass("categoriaId")}
                    value={formData.categoriaId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Material</label>
                  <select
                    name="materialId"
                    className={selectClass("materialId")}
                    value={formData.materialId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar material...</option>
                    {materiales.map(mat => (
                      <option key={mat.id} value={mat.id}>{mat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Especificaciones técnicas */}
            <Card title="Especificaciones Técnicas" icon="bi-rulers" className="mb-4">
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-semibold">Características</label>
                  <textarea
                    name="caracteristicas"
                    className={inputClass("caracteristicas")}
                    value={formData.caracteristicas || ""}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Características principales..."
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Dimensiones</label>
                  <input
                    type="text"
                    name="dimensiones"
                    className={inputClass("dimensiones")}
                    value={formData.dimensiones || ""}
                    onChange={handleChange}
                    placeholder="Ej: 30x20x15 cm"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="pesoKg"
                    className={inputClass("pesoKg")}
                    value={formData.pesoKg}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="col-md-4">
            {/* Estado */}
            <Card title="Estado" icon="bi-toggle-on" className="mb-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  id="activoSwitch"
                  style={{ width: "40px", height: "20px", cursor: "pointer" }}
                />
                <label className="form-check-label fw-semibold ms-2" htmlFor="activoSwitch">
                  Producto {formData.activo ? 'Activo' : 'Inactivo'}
                </label>
              </div>
              <small className="text-muted d-block mt-2">
                {formData.activo 
                  ? 'El producto está disponible para venta y producción' 
                  : 'El producto no estará disponible'}
              </small>
            </Card>

            {/* Resumen */}
            {esEdicion && (
              <Card title="Acciones" icon="bi-gear">
                <button
                  type="button"
                  className="btn btn-outline-info w-100 mb-2"
                  onClick={() => navigate(`/productos/${productoId}/ver`)}
                >
                  <i className="bi bi-eye me-2"></i>
                  Ver detalle
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success w-100"
                  onClick={() => navigate(`/productos/${productoId}/bom`)}
                >
                  <i className="bi bi-list-check me-2"></i>
                  Editar BOM
                </button>
              </Card>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="d-flex justify-content-end gap-2 bg-white p-3 rounded shadow-sm mt-4">
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
            {esEdicion ? 'Guardar Cambios' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}