import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  obtenerProductoPorId, 
  obtenerInsumosDeProducto,
  agregarInsumosMasivo,
  eliminarInsumoDeProducto
} from "../../services/productos.js";
import { obtenerInsumos } from "../../services/insumos.js";
import Card from "../../components/ui/Card.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ProductoBOMPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState(null);
  const [insumos, setInsumos] = useState([]);
  const [insumosProducto, setInsumosProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const [nuevoInsumo, setNuevoInsumo] = useState({
    insumoId: "",
    cantidad: 1,
    desperdicioPorcentaje: 0,
    observaciones: ""
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productoData, insumosData, insumosProductoData] = await Promise.all([
        obtenerProductoPorId(id),
        obtenerInsumos(),
        obtenerInsumosDeProducto(id)
      ]);
      
      setProducto(productoData);
      setInsumos(insumosData.content || insumosData || []);
      setInsumosProducto(insumosProductoData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setToastType("danger");
      setToastMessage("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoInsumo(prev => ({
      ...prev,
      [name]: name === "cantidad" || name === "desperdicioPorcentaje" ? parseFloat(value) || 0 : value
    }));
  };

  const agregarInsumo = async () => {
    if (!nuevoInsumo.insumoId || nuevoInsumo.cantidad <= 0) {
      alert("Selecciona un insumo y cantidad válida");
      return;
    }

    try {
      await agregarInsumosMasivo(id, [{
        insumoId: parseInt(nuevoInsumo.insumoId),
        cantidad: nuevoInsumo.cantidad,
        desperdicioPorcentaje: nuevoInsumo.desperdicioPorcentaje,
        observaciones: nuevoInsumo.observaciones
      }]);
      
      setToastType("success");
      setToastMessage("Insumo agregado correctamente");
      cargarDatos(); // Recargar
      
      // Limpiar formulario
      setNuevoInsumo({
        insumoId: "",
        cantidad: 1,
        desperdicioPorcentaje: 0,
        observaciones: ""
      });
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al agregar insumo");
    }
  };

  const eliminarInsumo = async (insumoId) => {
    if (!window.confirm("¿Eliminar este insumo de la lista de materiales?")) return;

    try {
      await eliminarInsumoDeProducto(id, insumoId);
      setToastType("success");
      setToastMessage("Insumo eliminado");
      cargarDatos();
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al eliminar insumo");
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3>
          <i className="bi bi-list-check me-2"></i>
          Lista de Materiales: {producto?.nombre}
        </h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/productos/${id}/ver`)}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver al producto
        </button>
      </div>

      <div className="row">
        <div className="col-md-8">
          <Card title="Materiales actuales" icon="bi-clipboard-check">
            {insumosProducto.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead className="table-light">
                    <tr>
                      <th>Insumo</th>
                      <th className="text-end">Cantidad</th>
                      <th>Unidad</th>
                      <th className="text-end">Desperdicio %</th>
                      <th className="text-end">Cantidad total</th>
                      <th>Observaciones</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosProducto.map((item) => (
                      <tr key={item.id}>
                        <td>{item.insumoNombre}</td>
                        <td className="text-end">{item.cantidad.toFixed(2)}</td>
                        <td>{item.insumoUnidad}</td>
                        <td className="text-end">{item.desperdicioPorcentaje?.toFixed(2) || '0.00'}%</td>
                        <td className="text-end fw-bold">
                          {(item.cantidad * (1 + (item.desperdicioPorcentaje || 0)/100)).toFixed(2)}
                        </td>
                        <td><small className="text-muted">{item.observaciones || '-'}</small></td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarInsumo(item.insumoId)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-clipboard-x fs-1 d-block mb-3 text-secondary"></i>
                <p className="text-muted">No hay materiales registrados</p>
              </div>
            )}
          </Card>
        </div>

        <div className="col-md-4">
          <Card title="Agregar material" icon="bi-plus-circle">
            <div className="mb-3">
              <label className="form-label fw-semibold">Insumo</label>
              <select
                className="form-select"
                name="insumoId"
                value={nuevoInsumo.insumoId}
                onChange={handleChange}
              >
                <option value="">Seleccionar...</option>
                {insumos.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nombre} ({ins.unidadMedida?.simbolo})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Cantidad</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                name="cantidad"
                value={nuevoInsumo.cantidad}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">% Desperdicio</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-control"
                name="desperdicioPorcentaje"
                value={nuevoInsumo.desperdicioPorcentaje}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Observaciones</label>
              <textarea
                className="form-control"
                name="observaciones"
                rows="2"
                value={nuevoInsumo.observaciones}
                onChange={handleChange}
              />
            </div>

            <button
              className="btn btn-primary w-100"
              onClick={agregarInsumo}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Agregar a BOM
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}