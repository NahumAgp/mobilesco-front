import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { 
  obtenerProductoPorId,
  obtenerInsumosDeProducto,
  agregarInsumosMasivo,
  eliminarInsumoDeProducto
} from "../../services/productos.js";
import { obtenerInsumos, crearInsumo } from "../../services/insumos.js";
import { obtenerUnidadesMedida, crearUnidadMedida } from "../../services/unidadMedidas.js";
import Card from "../../components/ui/Card.jsx";
import Toast from "../../components/ui/Toast.jsx";
import "./ProductoBOM.css";

export default function ProductoInsumosBOMPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState(null);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [insumosProducto, setInsumosProducto] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creandoInsumo, setCreandoInsumo] = useState(false);
  const [mostrarCrearInsumo, setMostrarCrearInsumo] = useState(false);
  const [erroresBom, setErroresBom] = useState({});
  const [erroresCrearInsumo, setErroresCrearInsumo] = useState({});
  const [erroresCrearUnidad, setErroresCrearUnidad] = useState({});
  const [creandoUnidad, setCreandoUnidad] = useState(false);
  const [mostrarCrearUnidad, setMostrarCrearUnidad] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  
  const [nuevosInsumos, setNuevosInsumos] = useState([
    { insumoId: "", cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" }
  ]);
  const [nuevoInsumoRapido, setNuevoInsumoRapido] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    unidadMedidaId: "",
    stockActual: 0,
    stockMinimo: 0,
    ubicacion: "",
    fila: "",
    columna: "",
    activo: true
  });
  const [nuevaUnidadRapida, setNuevaUnidadRapida] = useState({
    nombre: "",
    simbolo: "",
    tipo: ""
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const insumosFiltrados = useMemo(() => {
    const termino = busquedaInsumo.trim().toLowerCase();
    if (!termino) return insumosDisponibles;

    return insumosDisponibles.filter((insumo) => {
      const nombre = String(insumo.nombre || "").toLowerCase();
      const codigoBarras = String(insumo.codigoBarras || "").toLowerCase();
      const codigo = String(insumo.codigo || "").toLowerCase();
      return (
        nombre.includes(termino) ||
        codigoBarras.includes(termino) ||
        codigo.includes(termino)
      );
    });
  }, [busquedaInsumo, insumosDisponibles]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productoData, insumosData, insumosProductoData, unidadesData] = await Promise.all([
        obtenerProductoPorId(id),
        obtenerInsumos(),
        obtenerInsumosDeProducto(id),
        obtenerUnidadesMedida()
      ]);
      
      setProducto(productoData);
      setInsumosDisponibles(insumosData.content || insumosData || []);
      setInsumosProducto(insumosProductoData || []);
      setUnidadesMedida(unidadesData.content || unidadesData || []);
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
    setErroresBom((prev) => {
      const copia = { ...prev };
      delete copia[`${index}.${field}`];
      return copia;
    });
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
    
    const errores = {};
    nuevosInsumos.forEach((item, index) => {
      const filaTieneDatos = item.insumoId || item.cantidad || item.desperdicioPorcentaje || item.observaciones;
      if (!filaTieneDatos) return;
      if (!item.insumoId) errores[`${index}.insumoId`] = "Selecciona un insumo";
      if (!item.cantidad || Number(item.cantidad) <= 0) errores[`${index}.cantidad`] = "La cantidad debe ser mayor a 0";
      if (item.desperdicioPorcentaje === "" || Number(item.desperdicioPorcentaje) < 0) {
        errores[`${index}.desperdicioPorcentaje`] = "El desperdicio no puede ser negativo";
      }
      const yaAsignado = insumosProducto.some((actual) => String(actual.insumoId) === String(item.insumoId));
      if (item.insumoId && yaAsignado) errores[`${index}.insumoId`] = "Este insumo ya esta en el producto";
    });

    if (insumosValidos.length === 0) {
      errores["0.insumoId"] = "Selecciona al menos un insumo";
    }

    if (Object.keys(errores).length > 0) {
      setErroresBom(errores);
      setToastType("danger");
      setToastMessage("Revisa los campos marcados antes de guardar");
      return;
    }

    try {
      await agregarInsumosMasivo(id, insumosValidos);
      setToastType("success");
      setToastMessage("Insumos agregados correctamente");
      setNuevosInsumos([{ insumoId: "", cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" }]);
      cargarDatos(); // Recargar
    } catch (error) {
      const erroresApi = normalizarErroresBom(error);
      if (Object.keys(erroresApi).length > 0) {
        setErroresBom(erroresApi);
      }
      setToastType("danger");
      setToastMessage(error.message || "Error al agregar insumos");
    }
  };

  const normalizarErroresBom = (error) => {
    const errores = {};
    const apiErrors = error?.errors || error?.data?.errors || {};
    Object.entries(apiErrors).forEach(([key, value]) => {
      const indice = key.match(/\[(\d+)\]/)?.[1] || key.match(/^(\d+)\./)?.[1] || "0";
      const campo =
        key.includes("insumoId") ? "insumoId" :
        key.includes("cantidad") ? "cantidad" :
        key.includes("desperdicioPorcentaje") ? "desperdicioPorcentaje" :
        key.includes("observaciones") ? "observaciones" :
        "insumoId";
      errores[`${indice}.${campo}`] = value;
    });
    return errores;
  };

  const handleCrearInsumoChange = (field, value) => {
    setNuevoInsumoRapido((prev) => ({
      ...prev,
      [field]: ["stockActual", "stockMinimo"].includes(field) ? parseFloat(value) || 0 : value
    }));
    setErroresCrearInsumo((prev) => {
      const copia = { ...prev };
      delete copia[field];
      return copia;
    });
  };

  const limpiarCrearInsumo = () => {
    setNuevoInsumoRapido({
      codigo: "",
      nombre: "",
      descripcion: "",
      unidadMedidaId: "",
      stockActual: 0,
      stockMinimo: 0,
      ubicacion: "",
      fila: "",
      columna: "",
      activo: true
    });
    setErroresCrearInsumo({});
  };

  const limpiarCrearUnidad = () => {
    setNuevaUnidadRapida({ nombre: "", simbolo: "", tipo: "" });
    setErroresCrearUnidad({});
  };

  const handleCrearUnidadChange = (field, value) => {
    setNuevaUnidadRapida((prev) => ({ ...prev, [field]: value }));
    setErroresCrearUnidad((prev) => {
      const copia = { ...prev };
      delete copia[field];
      return copia;
    });
  };

  const guardarUnidadRapida = async () => {
    const errores = {};
    if (!nuevaUnidadRapida.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!nuevaUnidadRapida.simbolo.trim()) errores.simbolo = "El simbolo es obligatorio";
    if (Object.keys(errores).length) {
      setErroresCrearUnidad(errores);
      return;
    }

    try {
      setCreandoUnidad(true);
      const creada = await crearUnidadMedida({
        nombre: nuevaUnidadRapida.nombre.trim(),
        simbolo: nuevaUnidadRapida.simbolo.trim(),
        tipo: nuevaUnidadRapida.tipo?.trim() || null
      });
      setUnidadesMedida((prev) => [creada, ...prev]);
      setNuevoInsumoRapido((prev) => ({ ...prev, unidadMedidaId: String(creada.id) }));
      limpiarCrearUnidad();
      setMostrarCrearUnidad(false);
      setToastType("success");
      setToastMessage("Unidad de medida creada y seleccionada");
    } catch (error) {
      setErroresCrearUnidad(error.errors || {});
      setToastType("danger");
      setToastMessage(error.message || "Error al crear la unidad de medida");
    } finally {
      setCreandoUnidad(false);
    }
  };

  const guardarInsumoRapido = async () => {
    if (!nuevoInsumoRapido.codigo.trim() || !nuevoInsumoRapido.nombre.trim() || !nuevoInsumoRapido.unidadMedidaId) {
      setErroresCrearInsumo({
        codigo: !nuevoInsumoRapido.codigo.trim() ? "El codigo es obligatorio" : "",
        nombre: !nuevoInsumoRapido.nombre.trim() ? "El nombre es obligatorio" : "",
        unidadMedidaId: !nuevoInsumoRapido.unidadMedidaId ? "Selecciona una unidad" : ""
      });
      setToastType("danger");
      setToastMessage("Completa codigo, nombre y unidad de medida para crear el insumo");
      return;
    }

    try {
      setCreandoInsumo(true);
      const creado = await crearInsumo({
        ...nuevoInsumoRapido,
        codigo: nuevoInsumoRapido.codigo.trim(),
        nombre: nuevoInsumoRapido.nombre.trim(),
        descripcion: nuevoInsumoRapido.descripcion?.trim() || null,
        ubicacion: nuevoInsumoRapido.ubicacion?.trim() || null,
        fila: nuevoInsumoRapido.fila?.trim() || null,
        columna: nuevoInsumoRapido.columna?.trim() || null,
        unidadMedidaId: Number(nuevoInsumoRapido.unidadMedidaId)
      });
      const unidad = unidadesMedida.find((um) => String(um.id) === String(nuevoInsumoRapido.unidadMedidaId));
      const insumoNormalizado = {
        ...creado,
        unidadMedida: creado.unidadMedida || unidad || null
      };
      setInsumosDisponibles((prev) => [insumoNormalizado, ...prev]);
      setNuevosInsumos((prev) => {
        const copia = [...prev];
        const primerVacio = copia.findIndex((item) => !item.insumoId);
        const nuevoItem = { insumoId: String(creado.id), cantidad: 1, desperdicioPorcentaje: 0, observaciones: "" };
        if (primerVacio >= 0) {
          copia[primerVacio] = nuevoItem;
          return copia;
        }
        return [...copia, nuevoItem];
      });
      limpiarCrearInsumo();
      setMostrarCrearInsumo(false);
      setToastType("success");
      setToastMessage("Insumo creado y listo para agregarse al producto");
    } catch (error) {
      if (error.errors) {
        setErroresCrearInsumo(error.errors);
      }
      setToastType("danger");
      setToastMessage(error.message || "Error al crear el insumo");
    } finally {
      setCreandoInsumo(false);
    }
  };

  const handleEliminar = async (insumoId) => {
    if (!window.confirm("¿Eliminar este insumo de la lista?")) return;
    try {
      await eliminarInsumoDeProducto(id, insumoId);
      setToastType("success");
      setToastMessage("Insumo eliminado");
      cargarDatos();
    } catch {
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
    <div className="container-fluid mt-4 producto-bom-page">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      
      <div className="producto-bom-header">
        <div>
          <div className="producto-bom-eyebrow">Lista de materiales</div>
          <h3>
            <i className="bi bi-box-seam me-2"></i>
            {producto?.nombre}
          </h3>
          <p>Selecciona insumos existentes o crea uno nuevo sin salir de esta pantalla.</p>
        </div>
        <button className="btn producto-bom-outline" onClick={() => navigate(`/productos/${id}`)}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver al producto
        </button>
      </div>

      {/* Lista actual de materiales */}
      <Card title={`Materiales asignados (${insumosProducto.length})`} icon="bi-list-check" className="mb-4 producto-bom-card">
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
      <Card title="Agregar materiales" icon="bi-plus-circle" className="producto-bom-card">
        <div className="producto-bom-helper">
          <i className="bi bi-lightbulb"></i>
          <span>Agrega insumos sin perder avances. Si no existe, crealo aqui mismo y quedara seleccionado en una fila.</span>
          <button type="button" className="btn producto-bom-primary btn-sm ms-auto" onClick={() => setMostrarCrearInsumo(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Crear insumo
          </button>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Buscar insumo</label>
            <input
              type="search"
              className="form-control"
              value={busquedaInsumo}
              onChange={(e) => setBusquedaInsumo(e.target.value)}
              placeholder="Buscar por nombre o código de barras"
            />
          </div>
        </div>
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
                    <div className="input-group input-group-sm">
                      <select
                        className={`form-select form-select-sm ${erroresBom[`${index}.insumoId`] ? "is-invalid" : ""}`}
                        value={item.insumoId}
                        onChange={(e) => handleNuevoInsumoChange(index, "insumoId", e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        {insumosFiltrados.map(ins => (
                          <option key={ins.id} value={ins.id}>
                            {ins.nombre} {ins.codigoBarras ? `- ${ins.codigoBarras}` : ""} ({ins.unidadMedida?.simbolo})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        title="Busca por nombre o código"
                        onClick={() => {
                          document.querySelector('input[placeholder="Buscar por nombre o código de barras"]')?.focus();
                        }}
                      >
                        <i className="bi bi-search"></i>
                      </button>
                    </div>
                    <div className="invalid-feedback">{erroresBom[`${index}.insumoId`]}</div>
                  </td>
                  <td style={{width: '120px'}}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`form-control form-control-sm text-end ${erroresBom[`${index}.cantidad`] ? "is-invalid" : ""}`}
                      value={item.cantidad}
                      onChange={(e) => handleNuevoInsumoChange(index, "cantidad", e.target.value)}
                    />
                    <div className="invalid-feedback">{erroresBom[`${index}.cantidad`]}</div>
                  </td>
                  <td style={{width: '100px'}}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className={`form-control form-control-sm text-end ${erroresBom[`${index}.desperdicioPorcentaje`] ? "is-invalid" : ""}`}
                      value={item.desperdicioPorcentaje}
                      onChange={(e) => handleNuevoInsumoChange(index, "desperdicioPorcentaje", e.target.value)}
                    />
                    <div className="invalid-feedback">{erroresBom[`${index}.desperdicioPorcentaje`]}</div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${erroresBom[`${index}.observaciones`] ? "is-invalid" : ""}`}
                      placeholder="Observaciones"
                      value={item.observaciones}
                      onChange={(e) => handleNuevoInsumoChange(index, "observaciones", e.target.value)}
                    />
                    <div className="invalid-feedback">{erroresBom[`${index}.observaciones`]}</div>
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
          <button className="btn producto-bom-outline" onClick={agregarFila}>
            <i className="bi bi-plus-lg me-2"></i>
            Agregar otra fila
          </button>
          <button className="btn producto-bom-primary" onClick={guardarNuevosInsumos}>
            <i className="bi bi-check-lg me-2"></i>
            Guardar materiales
          </button>
        </div>
      </Card>

      {mostrarCrearInsumo ? (
          <div className="producto-bom-modal-backdrop">
            <div className="producto-bom-modal">
              <div className="producto-bom-modal-header">
                <div>
                  <span>Alta sin salir del BOM</span>
                  <h5>Crear insumo</h5>
                </div>
                <button type="button" className="btn producto-bom-outline btn-sm" onClick={() => setMostrarCrearInsumo(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-semibold">Codigo *</label>
              <input className={`form-control ${erroresCrearInsumo.codigo ? "is-invalid" : ""}`} value={nuevoInsumoRapido.codigo} onChange={(e) => handleCrearInsumoChange("codigo", e.target.value)} placeholder="INS-001" />
              <div className="invalid-feedback">{erroresCrearInsumo.codigo}</div>
            </div>
            <div className="col-md-7">
              <label className="form-label fw-semibold">Nombre *</label>
              <input className={`form-control ${erroresCrearInsumo.nombre ? "is-invalid" : ""}`} value={nuevoInsumoRapido.nombre} onChange={(e) => handleCrearInsumoChange("nombre", e.target.value)} placeholder="Tornillo, tubo, tela..." />
              <div className="invalid-feedback">{erroresCrearInsumo.nombre}</div>
            </div>
            <div className="col-12">
              <div className="d-flex align-items-end gap-2">
                <div className="flex-grow-1">
                  <label className="form-label fw-semibold">Unidad de medida *</label>
                  <select className={`form-select ${erroresCrearInsumo.unidadMedidaId ? "is-invalid" : ""}`} value={nuevoInsumoRapido.unidadMedidaId} onChange={(e) => handleCrearInsumoChange("unidadMedidaId", e.target.value)}>
                    <option value="">Selecciona unidad...</option>
                    {unidadesMedida.map((um) => (
                      <option key={um.id} value={um.id}>{um.nombre} ({um.simbolo})</option>
                    ))}
                  </select>
                  <div className="invalid-feedback">{erroresCrearInsumo.unidadMedidaId}</div>
                </div>
                <button type="button" className="btn producto-bom-outline" onClick={() => setMostrarCrearUnidad((prev) => !prev)}>
                  <i className="bi bi-rulers me-2"></i>
                  Nueva unidad
                </button>
              </div>
            </div>
            {mostrarCrearUnidad && (
              <div className="col-12">
                <div className="producto-bom-nested-create">
                  <div className="producto-bom-nested-title">
                    <i className="bi bi-rulers"></i>
                    Crear unidad de medida
                  </div>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Nombre *</label>
                      <input className={`form-control ${erroresCrearUnidad.nombre ? "is-invalid" : ""}`} value={nuevaUnidadRapida.nombre} onChange={(e) => handleCrearUnidadChange("nombre", e.target.value)} placeholder="Kilogramo" />
                      <div className="invalid-feedback">{erroresCrearUnidad.nombre}</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Simbolo *</label>
                      <input className={`form-control ${erroresCrearUnidad.simbolo ? "is-invalid" : ""}`} value={nuevaUnidadRapida.simbolo} onChange={(e) => handleCrearUnidadChange("simbolo", e.target.value)} placeholder="kg" />
                      <div className="invalid-feedback">{erroresCrearUnidad.simbolo}</div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Tipo</label>
                      <input className="form-control" value={nuevaUnidadRapida.tipo} onChange={(e) => handleCrearUnidadChange("tipo", e.target.value)} placeholder="Peso, pieza..." />
                    </div>
                    <div className="col-12 d-flex justify-content-end gap-2">
                      <button type="button" className="btn producto-bom-outline btn-sm" onClick={limpiarCrearUnidad}>Limpiar unidad</button>
                      <button type="button" className="btn producto-bom-primary btn-sm" onClick={guardarUnidadRapida} disabled={creandoUnidad}>
                        {creandoUnidad ? "Creando..." : "Crear unidad"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="col-12">
              <label className="form-label fw-semibold">Descripcion</label>
              <textarea className="form-control" rows="2" value={nuevoInsumoRapido.descripcion} onChange={(e) => handleCrearInsumoChange("descripcion", e.target.value)} placeholder="Detalle breve del insumo" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Stock actual</label>
              <input type="number" step="0.01" min="0" className="form-control" value={nuevoInsumoRapido.stockActual} onChange={(e) => handleCrearInsumoChange("stockActual", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Stock minimo</label>
              <input type="number" step="0.01" min="0" className="form-control" value={nuevoInsumoRapido.stockMinimo} onChange={(e) => handleCrearInsumoChange("stockMinimo", e.target.value)} />
            </div>
            <div className="col-md-8">
              <label className="form-label fw-semibold">Ubicacion</label>
              <input className="form-control" value={nuevoInsumoRapido.ubicacion} onChange={(e) => handleCrearInsumoChange("ubicacion", e.target.value)} placeholder="Almacen A" />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Fila</label>
              <input className="form-control" value={nuevoInsumoRapido.fila} onChange={(e) => handleCrearInsumoChange("fila", e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Col.</label>
              <input className="form-control" value={nuevoInsumoRapido.columna} onChange={(e) => handleCrearInsumoChange("columna", e.target.value)} />
            </div>
            <div className="col-12">
              <div className="producto-bom-switch">
                <input type="checkbox" checked={nuevoInsumoRapido.activo} onChange={(e) => handleCrearInsumoChange("activo", e.target.checked)} id="nuevoInsumoActivo" />
                <label htmlFor="nuevoInsumoActivo">Insumo activo para uso inmediato</label>
              </div>
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button type="button" className="btn producto-bom-outline" onClick={() => setMostrarCrearInsumo(false)}>Cancelar</button>
              <button type="button" className="btn producto-bom-outline" onClick={limpiarCrearInsumo}>Limpiar</button>
              <button type="button" className="btn producto-bom-primary" onClick={guardarInsumoRapido} disabled={creandoInsumo}>
                <i className="bi bi-check-lg me-2"></i>
                {creandoInsumo ? "Creando..." : "Crear y seleccionar"}
              </button>
            </div>
          </div>
            </div>
          </div>
        ) : null}

    </div>
  );
}
