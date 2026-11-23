import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, RefreshCw, TriangleAlert } from "lucide-react";
import { listarTrabajoMiArea, registrarAvanceMiArea } from "../services/ordenesProduccion";
import "./trabajoArea.css";

const numero = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(Number(valor || 0));

export default function TrabajoAreaPage() {
  const [tareas, setTareas] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [filtro, setFiltro] = useState("pendientes");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const solicitudes = useRef({});
  const cargar = useCallback(async () => {
    try {
      const data = await listarTrabajoMiArea();
      setTareas(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) { setError(err.message || "No se pudo cargar el trabajo del área"); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, 30000);
    return () => clearInterval(timer);
  }, [cargar]);
  const registrar = async (tarea) => {
    const cantidad = Number(cantidades[tarea.operacionId]);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > Number(tarea.cantidadDisponible)) {
      setError(`Captura de 0.001 a ${numero(tarea.cantidadDisponible)} piezas disponibles.`);
      return;
    }
    const solicitudId = solicitudes.current[tarea.operacionId] ||= crypto.randomUUID();
    try {
      setGuardando(tarea.operacionId);
      await registrarAvanceMiArea(tarea.ordenId, tarea.operacionId, {
        solicitudId, cantidad, observaciones: observaciones[tarea.operacionId] || ""
      });
      delete solicitudes.current[tarea.operacionId];
      setCantidades((actual) => ({ ...actual, [tarea.operacionId]: "" }));
      setObservaciones((actual) => ({ ...actual, [tarea.operacionId]: "" }));
      await cargar();
    } catch (err) { setError(err.message || "No se pudo registrar el avance"); }
    finally { setGuardando(null); }
  };
  const pendientes = tareas.filter((t) => t.estado !== "TERMINADA");
  const visibles = filtro === "todas" ? tareas : filtro === "terminadas"
    ? tareas.filter((t) => t.estado === "TERMINADA") : pendientes;
  return <div className="trabajo-area">
    <header className="trabajo-area-header">
      <div><span className="trabajo-area-eyebrow">PRODUCCIÓN · MI ÁREA</span>
        <h1><ClipboardList size={30} /> Trabajo pendiente</h1>
        <p>Órdenes liberadas, instrucciones y avances de tu área.</p></div>
      <button className="btn btn-outline-primary" onClick={cargar}><RefreshCw size={16} /> Actualizar</button>
    </header>
    <div className="trabajo-area-resumen">
      <div><strong>{pendientes.length}</strong><span>Tareas pendientes</span></div>
      <div><strong>{pendientes.filter((t) => Number(t.cantidadDisponible) > 0).length}</strong><span>Listas para trabajar</span></div>
      <div><strong>{pendientes.filter((t) => Number(t.cantidadDisponible) <= 0).length}</strong><span>Esperando paso anterior</span></div>
    </div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <div className="trabajo-area-filtros" role="group" aria-label="Filtrar tareas">
      {[["pendientes","Pendientes"],["terminadas","Terminadas"],["todas","Todas"]].map(([valor,etiqueta]) =>
        <button key={valor} className={filtro === valor ? "activo" : ""} onClick={() => setFiltro(valor)}>{etiqueta}</button>)}
    </div>
    {cargando ? <p>Cargando trabajo…</p> : visibles.length === 0 ? <div className="trabajo-area-vacio">No hay tareas en esta vista.</div> :
      <div className="trabajo-area-lista">{visibles.map((tarea) => <article className="trabajo-area-tarea" key={tarea.operacionId}>
        <div className="trabajo-area-tarea-cabecera">
          <div><span className="trabajo-area-folio">{tarea.ordenFolio}{tarea.pedidoFolio ? ` · Pedido ${tarea.pedidoFolio}` : ""}</span>
            <h2>{tarea.sku} · {tarea.producto}</h2>
            <p>{tarea.operacion} · {tarea.centroTrabajo} · Paso {tarea.secuencia}</p></div>
          <span className={`trabajo-area-estado ${tarea.estado.toLowerCase()}`}>{tarea.estado === "TERMINADA" ? "Terminada" : tarea.estado === "EN_PROCESO" ? "En proceso" : "Pendiente"}</span>
        </div>
        <div className="trabajo-area-metricas">
          <div><span>Planeadas</span><strong>{numero(tarea.cantidadPlaneada)}</strong></div>
          <div><span>Hechas aquí</span><strong>{numero(tarea.cantidadCompletada)}</strong></div>
          <div><span>Disponibles ahora</span><strong>{numero(tarea.cantidadDisponible)}</strong></div>
          <div><span>Compromiso</span><strong>{tarea.fechaCompromiso || "Sin fecha"}</strong></div>
        </div>
        <div className="trabajo-area-progreso"><div style={{ width: `${Math.min(100, 100 * Number(tarea.cantidadCompletada) / Math.max(1, Number(tarea.cantidadPlaneada)))}%` }} /></div>
        <details className="trabajo-area-receta">
          <summary>Ver receta e insumos</summary>
          <h3>Cómo realizar esta operación</h3>
          {tarea.instruccionesTecnicas ? <p className="trabajo-area-instrucciones">{tarea.instruccionesTecnicas}</p>
            : tarea.indicacionesCorte || tarea.indicacionesDoblez || tarea.criteriosCalidad ? null
            : <p className="trabajo-area-sin-receta"><TriangleAlert size={17} /> Instrucciones técnicas pendientes de documentar con el encargado.</p>}
          {tarea.indicacionesCorte && <><h3>Cortes y medidas</h3><p className="trabajo-area-instrucciones">{tarea.indicacionesCorte}</p></>}
          {tarea.indicacionesDoblez && <><h3>Dobleces y medidas</h3><p className="trabajo-area-instrucciones">{tarea.indicacionesDoblez}</p></>}
          {tarea.criteriosCalidad && <><h3>Revisión de calidad</h3><p className="trabajo-area-instrucciones">{tarea.criteriosCalidad}</p></>}
          <h3>Insumos del producto para esta orden</h3>
          <p className="text-muted small">Requerimiento total del producto. Almacén controla el surtido de la orden.</p>
          <ul>{(tarea.materiales || []).map((m) => <li key={m.codigo}>{m.nombre} ({m.codigo}): <strong>{numero(m.cantidadRequerida)} {m.unidad}</strong></li>)}</ul>
        </details>
        {tarea.estado !== "TERMINADA" && <div className="trabajo-area-accion">
          <label>Registrar piezas terminadas
            <input type="number" min="0.001" max={tarea.cantidadDisponible} step="0.001"
              disabled={Number(tarea.cantidadDisponible) <= 0 || guardando === tarea.operacionId}
              value={cantidades[tarea.operacionId] || ""}
              onChange={(e) => { delete solicitudes.current[tarea.operacionId]; setCantidades((actual) => ({ ...actual, [tarea.operacionId]: e.target.value })); }} />
          </label>
          <label>Observaciones
            <input type="text" maxLength={500} placeholder="Opcional" value={observaciones[tarea.operacionId] || ""}
              onChange={(e) => { delete solicitudes.current[tarea.operacionId]; setObservaciones((actual) => ({ ...actual, [tarea.operacionId]: e.target.value })); }} />
          </label>
          <button className="btn btn-primary" disabled={Number(tarea.cantidadDisponible) <= 0 || guardando === tarea.operacionId}
            onClick={() => registrar(tarea)}>{guardando === tarea.operacionId ? "Guardando…" : "Registrar avance"}</button>
        </div>}
      </article>)}</div>}
  </div>;
}
