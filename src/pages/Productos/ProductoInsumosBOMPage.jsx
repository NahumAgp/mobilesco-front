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

export default function ProductoInsumosBOMPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState(null);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [insumosProducto, setInsumosProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const [nuevosInsumos, setNuevosInsumos] = useState([
    { insumoId: "", cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" }
  ]);

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
      setInsumosDisponibles(insumosData.content || insumosData || []);
      setInsumosProducto(insumosProductoData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setToastType("danger");
      setToastMessage("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoInsumoChange = (index, field, value) => {
    const updated = [...nuevosInsumos];
    updated[index][field] = field === "cantidad" || field === "desperdicioPorcentaje" 
      ? parseFloat(value) || 0 
      : value;
    setNuevosInsumos(updated);
  };

  const agregarFila = () => {
    setNuevosInsumos([
      ...nuevosInsumos,
      { insumoId: "", cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" }
    ]);
  };

  const quitarFila = (index) => {
    if (nuevosInsumos.length > 1) {
      setNuevosInsumos(nuevosInsumos.filter((_, i) => i !== index));
    }
  };

  const guardarNuevosInsumos = async () => {
    // Filtrar los que tienen insumo seleccionado
    const insumosValidos = nuevosInsumos.filter(i => i.insumoId);
    
    if (insumosValidos.length === 0) {
      alert("Selecciona al menos un insumo");
      return;
    }

    try {
      await agregarInsumosMasivo(id, insumosValidos);
      setToastType("success");
      setToastMessage("Insumos agregados correctamente");
      setNuevosInsumos([{ insumoId: "", cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" }]);
      cargarDatos(); // Recargar
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al agregar insumos");
    }
  };

  const handleEliminar = async (insumoId) => {
    if (!window.confirm("¿Eliminar este insumo de la lista?")) return;
    try {
      await eliminarInsumoDeProducto(id, insumoId);
      setToastType("success");
      setToastMessage("Insumo eliminado");
      cargarDatos();
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al eliminar");
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
          <i className="bi bi-box-seam me-2"></i>
          Materiales: {producto?.nombre}
        </h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/productos/${id}/ver`)}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver al producto
        </button>
      </div>

      {/* Lista actual de materiales */}
      <Card title="Materiales actuales" icon="bi-list-check" className="mb-4">
        {insumosProducto.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Insumo</th>
                  <th className="text-end">Cantidad</th>
                  <th>Unidad</th>
                  <th className="text-end">% Desp.</th>
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
                    <td><small className="text-muted">{item.observaciones || '-'}</small></td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminar(item.insumoId)}
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
          <p className="text-muted text-center py-3">No hay materiales registrados</p>
        )}
      </Card>

      {/* Agregar nuevos materiales */}
      <Card title="Agregar materiales" icon="bi-plus-circle">
        <div className="table-responsive">
          <table className="table">
            <thead className="table-light">
              <tr>
                <th>Insumo</th>
                <th className="text-end">Cantidad</th>
                <th className="text-end">% Desp.</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {nuevosInsumos.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.insumoId}
                      onChange={(e) => handleNuevoInsumoChange(index, "insumoId", e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {insumosDisponibles.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nombre} ({ins.unidadMedida?.simbolo})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{width: '120px'}}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control form-control-sm text-end"
                      value={item.cantidad}
                      onChange={(e) => handleNuevoInsumoChange(index, "cantidad", e.target.value)}
                    />
                  </td>
                  <td style={{width: '100px'}}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-control form-control-sm text-end"
                      value={item.desperdicioPorcentaje}
                      onChange={(e) => handleNuevoInsumoChange(index, "desperdicioPorcentaje", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Observaciones"
                      value={item.observaciones}
                      onChange={(e) => handleNuevoInsumoChange(index, "observaciones", e.target.value)}
                    />
                  </td>
                  <td style={{width: '50px'}}>
                    {nuevosInsumos.length > 1 && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => quitarFila(index)}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-secondary" onClick={agregarFila}>
            <i className="bi bi-plus-lg me-2"></i>
            Agregar otra fila
          </button>
          <button className="btn btn-primary" onClick={guardarNuevosInsumos}>
            <i className="bi bi-check-lg me-2"></i>
            Guardar materiales
          </button>
        </div>
      </Card>
    </div>
  );
}