import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  obtenerProductoPorId, 
  obtenerEstructuraCostos,
  eliminarInsumoDeProducto,
  eliminarOperacionDeProducto
} from "../../services/productos.js";
import Card from "../../components/ui/Card.jsx";
import Toast from "../../components/ui/Toast.jsx";

export default function ProductoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [estructuraCostos, setEstructuraCostos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    cargarTodo();
  }, [id]);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [productoData, costosData] = await Promise.all([
        obtenerProductoPorId(id),
        obtenerEstructuraCostos(id)
      ]);
      setProducto(productoData);
      setEstructuraCostos(costosData);
    } catch (e) {
      setError("Error cargando el producto");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarInsumo = async (insumoId) => {
    if (!window.confirm("¿Eliminar este insumo de la lista de materiales?")) return;
    
    try {
      await eliminarInsumoDeProducto(id, insumoId);
      setToastType("success");
      setToastMessage("Insumo eliminado correctamente");
      cargarTodo(); // Recargar
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al eliminar insumo");
    }
  };

  const handleEliminarOperacion = async (operacionId) => {
    if (!window.confirm("¿Eliminar esta operación del proceso?")) return;
    
    try {
      await eliminarOperacionDeProducto(id, operacionId);
      setToastType("success");
      setToastMessage("Operación eliminada correctamente");
      cargarTodo(); // Recargar
    } catch (error) {
      setToastType("danger");
      setToastMessage("Error al eliminar operación");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatTime = (minutos) => {
    if (!minutos) return '-';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
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

  if (error || !producto) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error || "Producto no encontrado"}</div>
        <button className="btn btn-primary" onClick={() => navigate("/productos")}>
          Volver a Productos
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3>
          <i className="bi bi-box me-2"></i>
          {producto.nombre}
          <small className="text-muted ms-2">SKU: {producto.sku}</small>
        </h3>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={() => navigate(`/productos/${id}`)}
          >
            <i className="bi bi-pencil me-2"></i>
            Editar
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/productos")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Costo Materiales</h6>
              <h3 className="text-primary">{formatCurrency(estructuraCostos?.costoInsumos || 0)}</h3>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Costo Operaciones</h6>
              <h3 className="text-success">{formatCurrency(estructuraCostos?.costoOperaciones || 0)}</h3>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Costo Total</h6>
              <h3 className="fw-bold text-dark">{formatCurrency(estructuraCostos?.costoTotal || 0)}</h3>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="text-center">
              <h6 className="text-muted mb-2">Estado</h6>
              <h5>
                <span className={`badge bg-${producto.activo ? 'success' : 'secondary'}`}>
                  {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </h5>
            </div>
          </Card>
        </div>
      </div>

      {/* Dos columnas: Información General y Clasificación */}
      <div className="row mb-4">
        <div className="col-md-6">
          <Card title="Información General" icon="bi-info-circle">
            <table className="table table-sm">
              <tbody>
                <tr><th style={{width: '30%'}}>SKU:</th><td><span className="badge bg-secondary">{producto.sku}</span></td></tr>
                <tr><th>Nombre:</th><td>{producto.nombre}</td></tr>
                <tr><th>Descripción:</th><td>{producto.descripcion || '-'}</td></tr>
                <tr><th>Características:</th><td>{producto.caracteristicas || '-'}</td></tr>
                <tr><th>Dimensiones:</th><td>{producto.dimensiones || '-'}</td></tr>
                <tr><th>Peso:</th><td>{producto.pesoKg ? `${producto.pesoKg} kg` : '-'}</td></tr>
              </tbody>
            </table>
          </Card>
        </div>
        <div className="col-md-6">
          <Card title="Clasificación" icon="bi-tags">
            <table className="table table-sm">
              <tbody>
                <tr><th style={{width: '30%'}}>Tipo:</th><td><span className="badge bg-info">{producto.tipoProductoNombre}</span></td></tr>
                <tr><th>Línea:</th><td>{producto.lineaNombre || '-'}</td></tr>
                <tr><th>Categoría:</th><td>{producto.categoriaNombre || '-'}</td></tr>
                <tr><th>Material:</th><td>{producto.materialNombre || '-'}</td></tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* LISTA DE MATERIALES (INSUMOS) */}
      <Card 
        title="Lista de Materiales (BOM)" 
        icon="bi-box-seam"
        headerClassName="bg-light"
        footer={
          <div className="text-end">
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/productos/${id}/bom/insumos`)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Agregar / Editar Materiales
            </button>
          </div>
        }
      >
        {estructuraCostos?.insumos && estructuraCostos.insumos.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Insumo</th>
                  <th className="text-end">Cantidad</th>
                  <th>Unidad</th>
                  <th className="text-end">% Desp.</th>
                  <th className="text-end">Costo Unit.</th>
                  <th className="text-end">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {estructuraCostos.insumos.map((item) => {
                  const cantidadConDesperdicio = item.cantidad * (1 + (item.desperdicioPorcentaje || 0) / 100);
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="fw-semibold">{item.insumoNombre}</span>
                      </td>
                      <td className="text-end">{item.cantidad.toFixed(2)}</td>
                      <td>{item.insumoUnidad}</td>
                      <td className="text-end">{item.desperdicioPorcentaje?.toFixed(2) || '0.00'}%</td>
                      <td className="text-end ">{formatCurrency(item.costoUnitario)}</td>
                      <td className="text-end text-success">{formatCurrency(item.subtotal)}</td>
                     
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleEliminarInsumo(item.insumoId)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="5" className="text-end fw-bold">TOTAL MATERIALES:</td>
                  <td className="text-end fw-bold  text-success fs-5">
                    {formatCurrency(estructuraCostos?.costoInsumos || 0)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <p className="text-muted">Este producto no tiene materiales registrados</p>
          </div>
        )}
      </Card>

      {/* LISTA DE OPERACIONES */}
<Card 
  title="Proceso de Fabricación (Operaciones)" 
  icon="bi-gear"
  headerClassName="bg-light mt-4"
  footer={
    <div className="text-end">
      <button 
        className="btn btn-primary"
        onClick={() => navigate(`/productos/${id}/bom/operaciones`)}
      >
        <i className="bi bi-pencil-square me-2"></i>
        Editar Operaciones
      </button>
    </div>
  }
>
  {producto?.operaciones && producto.operaciones.length > 0 ? (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Operación</th>
            <th>Centro de Trabajo</th>
            <th className="text-end">Cantidad</th>
            <th className="text-end">Tiempo/Op</th>
            <th className="text-end">Tiempo Total</th>
            <th className="text-end">Costo</th>
          </tr>
        </thead>
        <tbody>
          {producto.operaciones
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((op, index) => (
              <tr key={op.id}>
                <td><span className="badge bg-secondary">{index + 1}</span></td>
                <td>
                  <span className="fw-semibold">{op.operacionNombre}</span>
                  <br />
                  <small className="text-muted">{op.operacionCodigo}</small>
                </td>
                <td>{op.centroTrabajoNombre || 'No asignado'}</td>
                <td className="text-end">{op.cantidad}x</td>
                <td className="text-end">{op.tiempoOperacion} min</td>
                <td className="text-end fw-bold">{op.tiempoTotal} min</td>
                <td className="text-end text-success">{formatCurrency(op.importeActividad)}</td>
              </tr>
            ))}
        </tbody>
        <tfoot className="table-light">
          <tr>
            <td colSpan="6" className="text-end fw-bold">TOTAL OPERACIONES:</td>
            <td className="text-end fw-bold text-success fs-5">
              {formatCurrency(producto.operaciones.reduce((sum, op) => sum + (op.importeActividad || 0), 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  ) : (
    <div className="text-center py-4">
      <i className="bi bi-gear fs-1 d-block mb-3 text-secondary"></i>
      <p className="text-muted">Este producto no tiene operaciones registradas</p>
    </div>
  )}
</Card>
    </div>
  );
}