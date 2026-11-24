import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ClipboardList, Download, Eye, MessageCircle, Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { asociarClienteParaPedido, cambiarEstadoCotizacion, eliminarCotizacion, exportarExcelCotizaciones, listarCotizaciones, obtenerCotizacion } from "../services/cotizaciones";
import { descargarPdfCotizacion, enviarCotizacionWhatsApp } from "../utils/cotizacionPdf";
import { descargarExcelCotizaciones, descargarReporteCotizaciones } from "../utils/reporteCotizaciones";
import "./cotizaciones.css";
import "./cotizaciones-status.css";
import { getUser, hasPermission } from "../../auth/services/authService";
import { crearPedidoDesdeCotizacion } from "../../pedidos-venta/services/pedidosVenta";

const estados = {
  BORRADOR: "Borrador", PENDIENTE: "Pendiente", ENVIADA: "Enviada", ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada", VENCIDA: "Vencida", COMPLETADA: "Completada", CANCELADA: "Cancelada",
};
const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);
const DIAS_ALERTA_VIGENCIA = 3;
const FILTROS_DEFAULT = {
  busqueda: "",
  estado: "",
  vigencia: "",
  desde: "",
  hasta: "",
};
const fechaLocal = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const sumarDias = (date, dias) => { const result = new Date(date); result.setDate(result.getDate() + dias); return fechaLocal(result); };
const opcionesEstado = (actual) => Object.entries(estados).filter(([value]) =>
  value === actual || (value !== "COMPLETADA" && (value !== "BORRADOR" || actual === "BORRADOR")));
const avisoVigencia = (item) => {
  if (["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(item.estado)) return null;
  if (item.estado === "VENCIDA") return "Vencida";
  const hoy = fechaLocal();
  if (item.fechaVencimiento < hoy) return "Vencida";
  if (item.fechaVencimiento <= sumarDias(new Date(), DIAS_ALERTA_VIGENCIA)) return "Por vencer";
  return null;
};

export default function Cotizaciones() {
  const navigate = useNavigate();
  const puedeCrear = hasPermission(getUser(), "ACTION_QUOTES_CREATE");
  const puedeEditar = hasPermission(getUser(), "ACTION_QUOTES_EDIT");
  const puedeCrearPedido = hasPermission(getUser(), "VIEW_SALES_ORDERS") && hasPermission(getUser(), "ACTION_SALES_ORDERS_CREATE");
  const puedeCrearCliente = hasPermission(getUser(), "VIEW_CUSTOMERS") && hasPermission(getUser(), "ACTION_CUSTOMERS_CREATE");
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [versionListado, setVersionListado] = useState(0);
  const [filtros, setFiltros] = usePersistedState("cotizaciones:filtros", FILTROS_DEFAULT);
  const actualizarFiltro = (campo, valor) => { setPagina(0); setFiltros((actual) => ({ ...actual, [campo]: valor })); };
  const busquedaDebounced = useDebouncedValue(filtros.busqueda, 350);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [estadoEditando, setEstadoEditando] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [creandoPedido, setCreandoPedido] = useState(false);
  const creandoPedidoRef = useRef(false);
  const cotizacionInicial = searchParams.get("cotizacion");
  const clienteCreado = searchParams.get("clienteCreado");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const hoy = fechaLocal();
        const vigencia = filtros.vigencia;
        const data = await listarCotizaciones({ busqueda: busquedaDebounced, estado: filtros.estado,
          desde: filtros.desde, hasta: filtros.hasta,
          venceDesde: vigencia === "proxima" ? hoy : undefined,
          venceHasta: vigencia === "proxima" ? sumarDias(new Date(), DIAS_ALERTA_VIGENCIA) : vigencia === "vencida" ? sumarDias(new Date(), -1) : undefined,
          page: pagina, size: 100 });
        setItems(data.content || []);
        setTotalPaginas(data.totalPages || 1);
        setError("");
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaDebounced, filtros.estado, filtros.vigencia, filtros.desde, filtros.hasta, pagina, versionListado]);

  useEffect(() => {
    if (!cotizacionInicial || clienteCreado) return;
    obtenerCotizacion(cotizacionInicial)
      .then((data) => { setDetalle(data); setEstadoEditando(data.estado); })
      .catch((e) => setError(e.message));
  }, [cotizacionInicial, clienteCreado]);

  useEffect(() => {
    if (!cotizacionInicial || !clienteCreado || creandoPedidoRef.current) return;
    creandoPedidoRef.current = true;
    setCreandoPedido(true);
    asociarClienteParaPedido(cotizacionInicial, clienteCreado)
      .then((actualizada) => { setDetalle(actualizada); return crearPedidoDesdeCotizacion(cotizacionInicial, {}); })
      .then((pedido) => navigate(`/pedidos-venta?pedido=${pedido.id}`, { replace: true }))
      .catch((e) => { setError(e.message || "El cliente se registró, pero no se pudo crear el pedido."); navigate(`/cotizaciones?cotizacion=${cotizacionInicial}`, { replace: true }); })
      .finally(() => { creandoPedidoRef.current = false; setCreandoPedido(false); });
  }, [cotizacionInicial, clienteCreado, navigate]);

  const cargarDetalle = async (id) => {
    const data = await obtenerCotizacion(id);
    setDetalle(data);
    setEstadoEditando(data.estado);
  };
  const conCotizacion = async (id, accion) => accion(await obtenerCotizacion(id));
  const enviarWhatsApp = async (cotizacion) => {
    try {
      setEnviandoWhatsApp(true); setError(""); setMensaje("");
      await enviarCotizacionWhatsApp(cotizacion);
      setMensaje(`Cotización ${cotizacion.folio} enviada a ${cotizacion.clienteWhatsapp}.`);
    } catch (e) { setError(e.message || "No fue posible enviar la cotización por WhatsApp."); }
    finally { setEnviandoWhatsApp(false); }
  };
  const eliminar = async (item) => {
    if (item.estado !== "BORRADOR") return;
    if (!window.confirm(`¿Eliminar el borrador ${item.folio}? Esta acción no se puede deshacer.`)) return;
    if (!window.confirm(`Segunda confirmación: ¿eliminar definitivamente ${item.folio}?`)) return;
    try {
      setError("");
      await eliminarCotizacion(item.id);
      setItems((actual) => actual.filter((row) => row.id !== item.id));
      setVersionListado((actual) => actual + 1);
      if (detalle?.id === item.id) setDetalle(null);
      if (cotizacionInicial === String(item.id)) navigate("/cotizaciones", { replace: true });
    } catch (e) { setError(e.message || "No fue posible eliminar la cotización"); }
  };
  const cambiarEstadoFila = async (item, estado) => {
    if (estado === item.estado) return;
    if (estado === "CANCELADA" && !window.confirm(`¿Cancelar ${item.folio}?`)) return;
    if (estado === "ACEPTADA" && !window.confirm(`¿Marcar ${item.folio} como aceptada?`)) return;
    try {
      setGuardandoEstado(true); setError("");
      const actualizada = await cambiarEstadoCotizacion(item.id, estado);
      setItems((actual) => actual.map((row) => row.id === item.id ? { ...row, ...actualizada } : row));
      setVersionListado((actual) => actual + 1);
      if (detalle?.id === item.id) { setDetalle(actualizada); setEstadoEditando(actualizada.estado); }
    } catch (e) { setError(e.message || "No fue posible cambiar el estado"); }
    finally { setGuardandoEstado(false); }
  };
  const exportar = async (formato) => {
    try {
      setExportando(true); setError("");
      const hoy = fechaLocal();
      const params = { busqueda: filtros.busqueda, estado: filtros.estado, desde: filtros.desde, hasta: filtros.hasta,
        venceDesde: filtros.vigencia === "proxima" ? hoy : undefined,
        venceHasta: filtros.vigencia === "proxima" ? sumarDias(new Date(), DIAS_ALERTA_VIGENCIA) : filtros.vigencia === "vencida" ? sumarDias(new Date(), -1) : undefined };
      if (formato === "excel") {
        descargarExcelCotizaciones(await exportarExcelCotizaciones(params));
        return;
      }
      params.size = 100;
      const first = await listarCotizaciones({ ...params, page: 0 });
      const rows = [...(first.content || [])];
      for (let page = 1; page < (first.totalPages || 1); page += 1) {
        const next = await listarCotizaciones({ ...params, page });
        rows.push(...(next.content || []));
      }
      await descargarReporteCotizaciones(rows);
    } catch (e) { setError(e.message || "No fue posible exportar el reporte"); }
    finally { setExportando(false); }
  };
  const crearPedido = async (cotizacionId) => {
    if (creandoPedidoRef.current) return;
    if (!window.confirm("Se creará un pedido de venta en borrador y la cotización pasará a completada. ¿Continuar?")) return;
    creandoPedidoRef.current = true;
    setCreandoPedido(true);
    try {
      setError("");
      const cotizacion = await obtenerCotizacion(cotizacionId);
      if (!cotizacion.clienteId) {
        if (!puedeCrearCliente) {
          setError("La cotización no tiene cliente. Solicita permiso para registrar clientes antes de crear el pedido.");
          return;
        }
        navigate(`/clientes/nuevo?cotizacionPedidoId=${cotizacionId}`, { state: { cotizacionPedidoId: cotizacionId, cotizacionFolio: cotizacion.folio } });
        return;
      }
      await crearPedidoDesdeCotizacion(cotizacionId, {});
      navigate("/pedidos-venta");
    } catch (e) { setError(e.message || "No fue posible crear el pedido de venta"); }
    finally { creandoPedidoRef.current = false; setCreandoPedido(false); }
  };
  const guardarEstado = async () => {
    if (!detalle || !estadoEditando || estadoEditando === detalle.estado) return;
    if (estadoEditando === "CANCELADA" && !window.confirm("La cotización quedará cancelada y conservará su historial. ¿Continuar?")) return;
    if (estadoEditando === "ACEPTADA" && !window.confirm("La cotización se marcará como aceptada. Después podrás convertirla en pedido de venta. ¿Continuar?")) return;
    try {
      setGuardandoEstado(true); setError("");
      const actualizada = await cambiarEstadoCotizacion(detalle.id, estadoEditando);
      setDetalle(actualizada);
      setItems((actual) => actual.map((item) => item.id === actualizada.id ? { ...item, estado: actualizada.estado, total: actualizada.total } : item));
      setVersionListado((actual) => actual + 1);
    } catch (e) { setError(e.message || "No fue posible cambiar el estatus"); }
    finally { setGuardandoEstado(false); }
  };

  return (
    <div className="cot-page">
      <header className="cot-header">
        <div><h1>Cotizaciones</h1><p>Consulta, da seguimiento y comparte propuestas comerciales.</p></div>
        <div className="cot-header-actions">
          <button disabled={exportando} onClick={() => exportar("pdf")}><Download size={18} /> Reporte PDF</button>
          <button disabled={exportando} onClick={() => exportar("excel")}><Download size={18} /> Reporte Excel</button>
          {puedeEditar && <button onClick={() => navigate("/cotizaciones/fletes")}><Truck size={18} /> Tabulador de flete</button>}
          {puedeCrear && <button className="cot-primary cot-new-button" onClick={() => navigate("/productos/catalogo")}><span className="cot-new-button-icon"><Plus size={20} /></span><span>Nueva cotización</span></button>}
        </div>
      </header>
      <section className="cot-card cot-filters">
        <label className="cot-search"><Search size={18} /><input value={filtros.busqueda} onChange={(e) => actualizarFiltro("busqueda", e.target.value)} placeholder="Buscar por folio o cliente..." /></label>
        <select value={filtros.estado} onChange={(e) => actualizarFiltro("estado", e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(estados).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Vigencia" value={filtros.vigencia || ""} onChange={(e) => actualizarFiltro("vigencia", e.target.value)}>
          <option value="">Toda vigencia</option><option value="proxima">Por vencer ({DIAS_ALERTA_VIGENCIA} días)</option><option value="vencida">Vencidas</option>
        </select>
        <label className="cot-date-filter">Emisión desde<input type="date" value={filtros.desde || ""} onChange={(e) => actualizarFiltro("desde", e.target.value)} /></label>
        <label className="cot-date-filter">Hasta<input type="date" value={filtros.hasta || ""} onChange={(e) => actualizarFiltro("hasta", e.target.value)} /></label>
        <button type="button" onClick={() => { setPagina(0); setFiltros(FILTROS_DEFAULT); }}>Limpiar</button>
      </section>
      {error && <div className="cot-alert cot-alert-error">{error}</div>}
      {mensaje && <div className="cot-alert cot-alert-success" role="status">{mensaje}</div>}
      <section className="cot-card cot-table-wrap">
        <table className="cot-table">
          <thead><tr><th>Folio</th><th>Cliente</th><th>Emisión</th><th>Vigencia</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {!cargando && items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.folio}</strong></td><td>{item.clienteNombre}</td><td>{item.fechaEmision}</td>
                <td>{item.fechaVencimiento}{avisoVigencia(item) && <span className={`cot-vigencia-alert ${avisoVigencia(item) === "Vencida" ? "is-expired" : ""}`}><AlertTriangle size={14} /> {avisoVigencia(item)}</span>}</td><td><strong>{moneda(item.total)}</strong></td>
                <td>{puedeEditar && !["COMPLETADA", "CANCELADA"].includes(item.estado)
                  ? <select aria-label={`Estado de ${item.folio}`} className={`cot-status-select cot-status-${item.estado.toLowerCase()}`} value={item.estado} disabled={guardandoEstado} onChange={(e) => cambiarEstadoFila(item, e.target.value)}>{opcionesEstado(item.estado).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  : <span className={`cot-status cot-status-${item.estado.toLowerCase()}`}>{estados[item.estado]}</span>}</td>
                <td><div className="cot-actions">
                  <button title="Ver detalle" onClick={() => cargarDetalle(item.id)}><Eye size={17} /></button>
                  {puedeEditar && !["ACEPTADA", "COMPLETADA", "CANCELADA"].includes(item.estado) && <button title="Editar cotización" onClick={() => navigate(`/cotizaciones/${item.id}/editar`)}><Pencil size={17} /></button>}
                  <button title="Descargar PDF" onClick={() => conCotizacion(item.id, descargarPdfCotizacion)}><Download size={17} /></button>
                  <button title="Enviar por WhatsApp" disabled={enviandoWhatsApp} onClick={() => conCotizacion(item.id, enviarWhatsApp).catch((e) => setError(e.message))}><MessageCircle size={17} /></button>
                  {puedeCrearPedido && item.estado === "ACEPTADA" && <button title="Crear pedido de venta" disabled={creandoPedido} onClick={() => crearPedido(item.id)}><ClipboardList size={17} /></button>}
                  {puedeEditar && item.estado === "BORRADOR" && <button title="Eliminar borrador" aria-label={`Eliminar ${item.folio}`} onClick={() => eliminar(item)}><Trash2 size={17} /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && !items.length && <div className="cot-empty">No hay cotizaciones con estos filtros.</div>}
        {totalPaginas > 1 && <nav className="cot-pagination" aria-label="Páginas de cotizaciones"><button disabled={pagina === 0 || cargando} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button><span>Página {pagina + 1} de {totalPaginas}</span><button disabled={pagina + 1 >= totalPaginas || cargando} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button></nav>}
      </section>
      {detalle && <div className="cot-modal-backdrop" onClick={() => setDetalle(null)}>
        <article className="cot-modal" onClick={(e) => e.stopPropagation()}>
          <button className="cot-modal-close" onClick={() => setDetalle(null)}>×</button>
          <span className={`cot-status cot-status-${detalle.estado.toLowerCase()}`}>{estados[detalle.estado]}</span>
          <h2>{detalle.folio}</h2><p>{detalle.clienteNombre}</p>
          <div className="cot-status-editor"><label>Estatus<select value={estadoEditando} disabled={!puedeEditar || ["COMPLETADA", "CANCELADA"].includes(detalle.estado)} onChange={(e) => setEstadoEditando(e.target.value)}>{opcionesEstado(detalle.estado).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button disabled={!puedeEditar || guardandoEstado || estadoEditando === detalle.estado || ["COMPLETADA", "CANCELADA"].includes(detalle.estado)} onClick={guardarEstado}>Guardar estatus</button></div>
          <div className="cot-detail-list">{detalle.detalles.map((d) => <div key={d.id}>
            <span>{d.cantidad} × {d.sku} · {d.nombre}
              {d.cifTarifaVersionId && <small className="d-block text-muted">
                Costo unitario: insumos {moneda(d.costoInsumos)}, operaciones {moneda(d.costoOperaciones)},
                CIF {moneda(d.costoCif)} · tasa CIF {d.tasaCifMinuto}/min · {d.mesCif}/{d.anioCif}
              </small>}
            </span><strong>{moneda(d.importe)}</strong>
          </div>)}</div>
          <p className="cot-cost-note">Flete: {detalle.unidadesFlete || 1} × {moneda(Number(detalle.flete || 0) / (detalle.unidadesFlete || 1))} = {moneda(detalle.flete)}</p>
          <p className="cot-cost-note">Margen real después del descuento: {Number(detalle.margenRealPorcentaje || 0).toFixed(2)}%</p>
          <div className="cot-modal-total"><span>Total</span><strong>{moneda(detalle.total)}</strong></div>
          <div className="cot-modal-buttons">
            <button onClick={() => descargarPdfCotizacion(detalle)}><Download size={17} /> PDF</button>
            <button className="cot-primary" disabled={enviandoWhatsApp} onClick={() => enviarWhatsApp(detalle)}><MessageCircle size={17} /> {enviandoWhatsApp ? "Enviando..." : "Enviar WhatsApp"}</button>
            {puedeEditar && !["ACEPTADA", "COMPLETADA", "CANCELADA"].includes(detalle.estado) && <button onClick={() => navigate(`/cotizaciones/${detalle.id}/editar`)}><Pencil size={17} /> Editar</button>}
            {puedeCrearPedido && detalle.estado === "ACEPTADA" && <button className="cot-primary" disabled={creandoPedido} onClick={() => crearPedido(detalle.id)}><ClipboardList size={17} /> Crear pedido</button>}
            {puedeEditar && detalle.estado === "BORRADOR" && <button onClick={() => eliminar(detalle)}><Trash2 size={17} /> Eliminar borrador</button>}
          </div>
        </article>
      </div>}
    </div>
  );
}
