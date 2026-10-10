import { useEffect, useState } from "react";
import { ClipboardList, Eye, Factory, Search, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import usePersistedState from "../../../hooks/usePersistedState";
import { getUser, hasPermission } from "../../auth/services/authService";
import { crearOrdenDesdePedido } from "../../ordenes-produccion/services/ordenesProduccion";
import { cancelarPedidoVenta, confirmarPedidoVenta, listarPedidosVenta, obtenerPedidoVenta } from "../services/pedidosVenta";
import "./pedidosVenta.css";

const ESTADOS = {
  BORRADOR: "Borrador", CONFIRMADO: "Confirmado", EN_PRODUCCION: "En producción", LISTO: "Listo",
  PARCIALMENTE_ENTREGADO: "Entrega parcial", ENTREGADO: "Entregado", CANCELADO: "Cancelado"
};
const FILTROS = { busqueda: "", estado: "" };
const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);
const cantidad = (value) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(value || 0);

export default function PedidosVentaPage() {
  const navigate = useNavigate();
  const puedeEditar = hasPermission(getUser(), "ACTION_SALES_ORDERS_EDIT");
  const puedeCrearOrden = hasPermission(getUser(), "VIEW_PRODUCTION_ORDERS") && hasPermission(getUser(), "ACTION_PRODUCTION_ORDERS_CREATE");
  const [filtros, setFiltros] = usePersistedState("pedidos-venta:filtros", FILTROS);
  const busqueda = useDebouncedValue(filtros.busqueda, 350);
  const [items, setItems] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await listarPedidosVenta({ busqueda, estado: filtros.estado, size: 50 });
      setItems(data.content || []); setError("");
    } catch (e) { setError(e.message || "No fue posible cargar los pedidos"); }
    finally { setCargando(false); }
  };
  useEffect(() => { cargar(); }, [busqueda, filtros.estado]);

  const abrir = async (id) => {
    try { setDetalle(await obtenerPedidoVenta(id)); setError(""); }
    catch (e) { setError(e.message || "No fue posible abrir el pedido"); }
  };
  const ejecutar = async (accion) => {
    try { setProcesando(true); const actualizado = await accion(); setDetalle(actualizado); await cargar(); }
    catch (e) { setError(e.message || "No fue posible actualizar el pedido"); }
    finally { setProcesando(false); }
  };
  const crearOrden = async () => {
    if (!window.confirm("Se creará una orden por las cantidades que aún no están reservadas. ¿Continuar?")) return;
    try { setProcesando(true); const orden = await crearOrdenDesdePedido(detalle.id, {}); navigate(`/ordenes-produccion/${orden.id}`); }
    catch (e) { setError(e.message || "No fue posible crear la orden de producción"); }
    finally { setProcesando(false); }
  };

  return <div className="pv-page">
    <header className="pv-header"><div><h1><ClipboardList size={30} /> Pedidos de venta</h1><p>Da seguimiento desde la aceptación comercial hasta producción y entrega.</p></div></header>
    <section className="pv-card pv-filters">
      <label className="pv-search"><Search size={18} /><input value={filtros.busqueda} onChange={(e) => setFiltros((v) => ({ ...v, busqueda: e.target.value }))} placeholder="Buscar folio, cliente o producto" /></label>
      <select value={filtros.estado} onChange={(e) => setFiltros((v) => ({ ...v, estado: e.target.value }))}><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </section>
    {error && <div className="alert alert-danger">{error}</div>}
    <section className="pv-card table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Pedido</th><th>Cotización</th><th>Cliente</th><th>Fecha</th><th>Compromiso</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.folio}</strong></td><td>{item.cotizacionFolio || "—"}</td><td>{item.clienteNombre || "—"}</td><td>{item.fechaPedido}</td><td>{item.fechaCompromiso || "Por definir"}</td><td>{moneda(item.total)}</td><td><span className={`pv-status pv-status-${item.estado.toLowerCase()}`}>{ESTADOS[item.estado]}</span></td><td><button className="btn btn-sm btn-outline-primary" onClick={() => abrir(item.id)}><Eye size={16} /> Ver</button></td></tr>)}</tbody>
    </table>{!cargando && !items.length && <div className="pv-empty">No hay pedidos con estos filtros.</div>}</section>
    {detalle && <div className="pv-modal-backdrop" onClick={() => setDetalle(null)}><article className="pv-modal" onClick={(e) => e.stopPropagation()}>
      <button className="pv-close" onClick={() => setDetalle(null)}>×</button><span className={`pv-status pv-status-${detalle.estado.toLowerCase()}`}>{ESTADOS[detalle.estado]}</span>
      <h2>{detalle.folio}</h2><p>{detalle.clienteNombre} · {detalle.cotizacionFolio}</p>
      <div className="pv-progress-grid"><span>Producto</span><span>Pedido</span><span>Producido</span><span>Reservado</span><span>Entregado</span>{detalle.detalles.map((d) => <div className="pv-progress-row" key={d.id}><strong>{d.sku}<small>{d.nombre}</small></strong><span>{cantidad(d.cantidadSolicitada)}</span><span>{cantidad(d.cantidadProducida)}</span><span>{cantidad(d.cantidadReservada)}</span><span>{cantidad(d.cantidadEntregada)}</span></div>)}</div>
      <div className="pv-total"><span>Total</span><strong>{moneda(detalle.total)}</strong></div>
      <div className="pv-actions">
        {puedeEditar && detalle.estado === "BORRADOR" && <button disabled={procesando} className="btn btn-primary" onClick={() => ejecutar(() => confirmarPedidoVenta(detalle.id))}><ShieldCheck size={17} /> Confirmar pedido</button>}
        {puedeCrearOrden && ["CONFIRMADO", "EN_PRODUCCION"].includes(detalle.estado) && detalle.detalles.some((d) => Number(d.pendienteProduccion) > 0) && <button disabled={procesando} className="btn btn-primary" onClick={crearOrden}><Factory size={17} /> Crear orden de producción</button>}
        {puedeEditar && !["CANCELADO", "ENTREGADO"].includes(detalle.estado) && <button disabled={procesando} className="btn btn-outline-danger" onClick={() => window.confirm("¿Cancelar este pedido y liberar sus reservas?") && ejecutar(() => cancelarPedidoVenta(detalle.id))}><XCircle size={17} /> Cancelar</button>}
      </div>
    </article></div>}
  </div>;
}
