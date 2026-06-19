import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import Select from 'react-select';
import { 
  obtenerProductoPorId,
  obtenerProductos,
  obtenerOperacionesDeProducto,
  agregarOperacionesMasivo,
  eliminarOperacionDeProducto
} from "../../services/productos.js";
import { obtenerOperaciones } from "../../../operaciones/services/operaciones.js";
import Card from "../../../../components/ui/Card.jsx";
import Toast from "../../../../components/ui/Toast.jsx";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getModeloId = (item) =>
  item?.modeloId ||
  item?.id_modelo ||
  item?.modelo_id ||
  item?.productoBaseId ||
  item?.modelo?.id ||
  item?.productoBase?.id ||
  "";

const getProductoLabel = (item) => {
  const partes = [
    item?.sku,
    item?.nombre,
    item?.nivelNombre || item?.categoriaNombre || item?.nombre_nivel,
    item?.materialNombre || item?.nombre_material,
    item?.colorNombre || item?.nombre_color
  ].filter(Boolean);
  return partes.join(" - ");
};

export default function ProductoOperacionesBOMPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState(null);
  const [operacionesDisponibles, setOperacionesDisponibles] = useState([]);
  const [operacionesProducto, setOperacionesProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [productosModelo, setProductosModelo] = useState([]);
  const [productoOrigenId, setProductoOrigenId] = useState("");
  const [copiandoBom, setCopiandoBom] = useState(false);
  
  const [nuevasOperaciones, setNuevasOperaciones] = useState([
    { operacionId: "", cantidad: 1, observaciones: "" }
  ]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [productoData, productosData, operacionesData, operacionesProductoData] = await Promise.all([
        obtenerProductoPorId(id),
        obtenerProductos(),
        obtenerOperaciones(),
        obtenerOperacionesDeProducto(id)
      ]);
      
      setProducto(productoData);
      setOperacionesDisponibles(operacionesData.content || operacionesData || []);
      
      const operacionesOrdenadas = (operacionesProductoData || [])
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      setOperacionesProducto(operacionesOrdenadas);

      const modeloActualId = String(getModeloId(productoData));
      const productosDelModelo = getLista(productosData)
        .filter((item) => String(item?.id) !== String(id))
        .filter((item) => !modeloActualId || String(getModeloId(item)) === modeloActualId)
        .sort((a, b) => getProductoLabel(a).localeCompare(getProductoLabel(b), "es"));
      setProductosModelo(productosDelModelo);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setToastType("danger");
      setToastMessage("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const copiarOperacionesDesdeProducto = async () => {
    if (!productoOrigenId) {
      setToastType("danger");
      setToastMessage("Selecciona un producto origen para copiar operaciones");
      return;
    }

    try {
      setCopiandoBom(true);
      const operacionesOrigen = await obtenerOperacionesDeProducto(productoOrigenId);
      const existentes = new Set(operacionesProducto.map((item) => String(item.operacionId)));
      const inicioOrden = operacionesProducto.length + 1;
      const operacionesCopiables = (operacionesOrigen || [])
        .filter((item) => item?.operacionId && !existentes.has(String(item.operacionId)))
        .map((item, index) => ({
          operacionId: Number(item.operacionId),
          cantidad: Number(item.cantidad || 1),
          observaciones: item.observaciones || "",
          orden: inicioOrden + index
        }));

      if (operacionesCopiables.length === 0) {
        setToastType("danger");
        setToastMessage("No hay operaciones nuevas para copiar desde ese producto");
        return;
      }

      await agregarOperacionesMasivo(id, operacionesCopiables);
      setToastType("success");
      setToastMessage(`${operacionesCopiables.length} operaciones copiadas. Ajusta cantidades si cambia el proceso.`);
      setProductoOrigenId("");
      await cargarDatos();
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudieron copiar las operaciones");
    } finally {
      setCopiandoBom(false);
    }
  };

  const handleNuevaOperacionChange = (index, field, value) => {
    const updated = [...nuevasOperaciones];
    updated[index][field] = field === "cantidad" ? parseInt(value) || 1 : value;
    setNuevasOperaciones(updated);
  };

  const agregarFila = () => {
    setNuevasOperaciones([
      ...nuevasOperaciones,
      { operacionId: "", cantidad: 1, observaciones: "" }
    ]);
  };

  const quitarFila = (index) => {
    if (nuevasOperaciones.length > 1) {
      setNuevasOperaciones(nuevasOperaciones.filter((_, i) => i !== index));
    }
  };

  const guardarNuevasOperaciones = async () => {
    const operacionesValidas = nuevasOperaciones.filter(i => i.operacionId);
    
    if (operacionesValidas.length === 0) {
      alert("Selecciona al menos una operación");
      return;
    }

    const operacionesConOrden = operacionesValidas.map((op, idx) => ({
      operacionId: parseInt(op.operacionId),
      cantidad: op.cantidad || 1,
      observaciones: op.observaciones || "",
      orden: operacionesProducto.length + idx
    }));

    try {
      await agregarOperacionesMasivo(id, operacionesConOrden);
      setToastType("success");
      setToastMessage("Operaciones agregadas correctamente");
      setNuevasOperaciones([{ operacionId: "", cantidad: 1, observaciones: "" }]);
      cargarDatos();
    } catch {
      setToastType("danger");
      setToastMessage("Error al agregar operaciones");
    }
  };

  const handleEliminar = async (operacionId) => {
    if (!window.confirm("¿Eliminar esta operación del proceso?")) return;
    try {
      await eliminarOperacionDeProducto(id, operacionId);
      setToastType("success");
      setToastMessage("Operación eliminada");
      cargarDatos();
    } catch {
      setToastType("danger");
      setToastMessage("Error al eliminar");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value || 0);
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
          <i className="bi bi-gear me-2"></i>
          Operaciones: {producto?.nombre}
        </h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/productos/${id}`)}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>

      {/* Lista actual */}
      <Card title="Operaciones actuales" icon="bi-list-check" className="mb-4">
        {operacionesProducto.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Operación</th>
                  <th>Centro</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Tiempo/Op</th>
                  <th className="text-end">Tiempo Total</th>
                  <th className="text-end">Costo/Minuto</th>
                  <th className="text-end">Costo/Actividad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {operacionesProducto.map((op, index) => (
                  <tr key={op.id}>
                    <td>{index + 1}</td>
                    <td>
                      {op.operacionNombre}
                      <br />
                      <small>{op.operacionCodigo}</small>
                    </td>
                    <td>{op.centroTrabajoNombre || '-'}</td>
                    <td className="text-end">{op.cantidad}x</td>
                    <td className="text-end">{op.tiempoOperacion} min</td>
                    <td className="text-end fw-bold">{op.tiempoTotal} min</td> 
                    <td className="text-end fw-bold">{op.costoMinutoOperacion} min</td>
                    <td className="text-end text-success">{formatCurrency(op.importeActividad)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminar(op.operacionId)}
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
          <p className="text-muted text-center py-3">No hay operaciones registradas</p>
        )}
      </Card>


<Card title="Copiar operaciones desde otro producto" icon="bi-copy" className="mb-4">
  <div className="alert alert-info py-2">
    Copia el proceso de otro producto del mismo modelo y despues ajusta cantidades o tiempos desde el catalogo de operaciones si hace falta.
  </div>
  <div className="row g-2 align-items-end">
    <div className="col-lg-8">
      <label className="form-label fw-semibold small">Producto origen</label>
      <select
        className="form-select"
        value={productoOrigenId}
        onChange={(event) => setProductoOrigenId(event.target.value)}
        disabled={copiandoBom || productosModelo.length === 0}
      >
        <option value="">
          {productosModelo.length === 0 ? "No hay otros productos del mismo modelo" : "Seleccionar producto..."}
        </option>
        {productosModelo.map((item) => (
          <option key={item.id} value={item.id}>
            {getProductoLabel(item)}
          </option>
        ))}
      </select>
    </div>
    <div className="col-lg-4">
      <button
        type="button"
        className="btn btn-primary w-100"
        onClick={copiarOperacionesDesdeProducto}
        disabled={copiandoBom || !productoOrigenId}
      >
        <i className="bi bi-copy me-2"></i>
        {copiandoBom ? "Copiando..." : "Copiar operaciones"}
      </button>
    </div>
  </div>
</Card>

{/* Agregar nuevas */}
<Card title="Agregar operaciones" icon="bi-plus-circle">
  <div className="table-responsive" style={{ minHeight: '300px' }}>
    <table className="table">
      <thead className="table-light">
        <tr>
          <th style={{ width: '400px' }}>Operación</th>
          <th className="text-end" style={{ width: '120px' }}>Cantidad</th>
          <th>Observaciones</th>
          <th style={{ width: '60px' }}></th>
        </tr>
      </thead>
      <tbody>
        {nuevasOperaciones.map((item, index) => {
          // Crear opciones para react-select (SIN tiempo)
          const opcionesOperaciones = operacionesDisponibles.map(op => ({
            value: op.id,
            label: `${op.codigo} - ${op.nombre}`,
            centroTrabajo: op.centroTrabajoNombre,
            tiempoOperacion: op.tiempoOperacion,
            costoMinuto: op.costoMinuto
          }));

          // Encontrar la operación seleccionada actual
          const operacionSeleccionada = opcionesOperaciones.find(
            op => op.value === item.operacionId
          );

          return (
            <tr key={index}>
              <td style={{ padding: '12px 8px' }}>
                <Select
                  options={opcionesOperaciones}
                  value={operacionSeleccionada}
                  onChange={(selectedOption) => {
                    handleNuevaOperacionChange(
                      index, 
                      "operacionId", 
                      selectedOption ? selectedOption.value : null
                    );
                  }}
                  placeholder="Buscar operación por código o nombre..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => "No se encontraron operaciones"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderRadius: '6px',
                      borderColor: '#dee2e6'
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                      maxHeight: '300px',
                      overflow: 'hidden'
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? '#e9ecef' : 'white',
                      color: 'black',
                      cursor: 'pointer',
                      padding: '10px 12px'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#6c757d'
                    })
                  }}
                  formatOptionLabel={({ label, data }) => (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '2px 0'
                    }}>
                      <span style={{ fontWeight: 500 }}>{label}</span>
                      {data?.centroTrabajo && (
                        <small style={{ 
                          color: '#6c757d',
                          backgroundColor: '#f8f9fa',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.85rem'
                        }}>
                          <i className="bi bi-gear me-1" style={{ fontSize: '0.8rem' }}></i>
                          {data.centroTrabajo}
                        </small>
                      )}
                    </div>
                  )}
                />
              </td>
              <td style={{ padding: '12px 8px' }}>
                <input
                  type="number"
                  min="1"
                  className="form-control text-end"
                  style={{ height: '42px' }}
                  value={item.cantidad}
                  onChange={(e) => handleNuevaOperacionChange(index, "cantidad", e.target.value)}
                />
              </td>
              <td style={{ padding: '12px 8px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '42px' }}
                  placeholder="Observaciones"
                  value={item.observaciones}
                  onChange={(e) => handleNuevaOperacionChange(index, "observaciones", e.target.value)}
                />
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                {nuevasOperaciones.length > 1 && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    style={{ width: '38px', height: '38px' }}
                    onClick={() => quitarFila(index)}
                  >
                    <i className="bi bi-dash" style={{ fontSize: '1.2rem' }}></i>
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  <div className="d-flex gap-2 mt-4 pt-2">
    <button className="btn btn-outline-secondary px-4" onClick={agregarFila}>
      <i className="bi bi-plus-lg me-2"></i>
      Agregar otra operación
    </button>
    <button className="btn btn-primary px-5" onClick={guardarNuevasOperaciones}>
      <i className="bi bi-check-lg me-2"></i>
      Guardar operaciones
    </button>
  </div>
</Card>
    </div>
  );
}
