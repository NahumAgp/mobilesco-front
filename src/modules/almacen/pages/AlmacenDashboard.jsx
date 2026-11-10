import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ChartNoAxesCombined, CircleDollarSign, ClipboardList, Gauge, PackageSearch, RefreshCw, ShoppingCart, Truck } from "lucide-react";
import { hasPermission } from "../../auth/services/authService";
import { conectarEventosTablero, obtenerResumenTablero } from "../../tablero/services/tablero";

const periodos = [["MES", "Este mes"], ["ULTIMOS_30_DIAS", "Últimos 30 días"], ["TRIMESTRE", "Últimos 90 días"], ["ANIO", "Este año"]];
const moneda = (valor) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor) || 0);

export default function AlmacenDashboard({ usuario }) {
  const [periodo, setPeriodo] = useState("MES");
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [conexion, setConexion] = useState("conectando");
  const [actualizado, setActualizado] = useState(null);
  const solicitudActual = useRef(0);

  const cargar = useCallback(async () => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    try {
      const datos = await obtenerResumenTablero(periodo);
      if (solicitud !== solicitudActual.current) return;
      setResumen(datos);
      setActualizado(new Date());
      setError("");
    } catch (e) {
      if (solicitud === solicitudActual.current) setError(e.message || "No fue posible cargar los indicadores.");
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, [periodo]);

  const cargarActual = useRef(cargar);
  cargarActual.current = cargar;

  useEffect(() => {
    void cargar();
    return () => { solicitudActual.current += 1; };
  }, [cargar]);

  useEffect(() => {
    let refresco;
    let conectado = false;
    const actualizar = () => {
      clearTimeout(refresco);
      refresco = setTimeout(() => void cargarActual.current(), 300);
    };
    const desconectar = conectarEventosTablero({
      onConnect: () => { setConexion("conectado"); if (conectado) actualizar(); conectado = true; },
      onChange: actualizar,
      onDisconnect: () => setConexion("reconectando"),
    });
    const respaldo = setInterval(() => void cargarActual.current(), 60000);
    return () => { desconectar(); clearTimeout(refresco); clearInterval(respaldo); };
  }, []);

  const operacion = resumen?.indicadoresOperativos;
  const inventario = resumen?.indicadoresInventario;
  const widgets = operacion ? [
    { titulo: "Stock bajo", valor: operacion.insumosStockBajo, detalle: "Insumos en mínimo o por debajo", ruta: "/insumos?stockBajo=true", permiso: "VIEW_INVENTORY", icono: PackageSearch, tono: "alerta" },
    { titulo: "Compras por recibir", valor: operacion.comprasPendientesRecepcion, detalle: "Pendientes o recibidas parcialmente", ruta: "/almacen/entradas", permiso: "VIEW_WAREHOUSE_RECEIPTS", icono: ShoppingCart, tono: "azul" },
    { titulo: "Requisiciones por atender", valor: operacion.requisicionesPendientes, detalle: "Enviadas o en revisión", ruta: "/almacen/requisiciones", permiso: "VIEW_WAREHOUSE_REQUISITIONS", icono: ClipboardList, tono: "amarillo" },
    { titulo: "Salidas del periodo", valor: operacion.salidasPeriodo, detalle: `${resumen.desde} al ${resumen.hasta}`, ruta: "/salidas-insumos", permiso: "VIEW_INVENTORY_OUTPUTS", icono: Truck, tono: "verde" },
  ].filter((widget) => hasPermission(usuario, widget.permiso)) : [];

  return <section className="almacen-dashboard" aria-labelledby="almacen-dashboard-title">
    <div className="almacen-dashboard-heading">
      <div><span className="almacen-inicio-eyebrow">Operación en tiempo real</span><h2 id="almacen-dashboard-title">Dashboard de Almacén</h2><p>Existencias, recepciones y movimientos en un solo lugar.</p></div>
      <div className="almacen-dashboard-controls">
        <span className={`almacen-dashboard-live almacen-dashboard-live-${conexion}`} role="status">{conexion === "conectado" ? "En vivo" : conexion === "reconectando" ? "Reconectando…" : "Conectando…"}{actualizado && <small>Actualizado {actualizado.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</small>}</span>
        <label>Periodo<select value={periodo} onChange={(event) => setPeriodo(event.target.value)} aria-label="Periodo del dashboard de Almacén">{periodos.map(([valor, etiqueta]) => <option value={valor} key={valor}>{etiqueta}</option>)}</select></label>
      </div>
    </div>
    {error && <div className="almacen-dashboard-error" role="alert"><AlertTriangle size={18} /> {error} <button type="button" onClick={() => void cargar()}><RefreshCw size={15} /> Reintentar</button></div>}
    {cargando && !resumen ? <p className="almacen-dashboard-loading" role="status">Cargando indicadores de almacén…</p> : <>
      {widgets.length > 0 && <div className="almacen-dashboard-grid" aria-label="Indicadores operativos de almacén">{widgets.map(({ titulo, valor, detalle, ruta, icono, tono }) => <Link className={`almacen-widget almacen-widget-${tono}`} to={ruta} key={titulo}><span className="almacen-widget-icon">{createElement(icono, { size: 23 })}</span><span className="almacen-widget-copy"><small>{titulo}</small><strong>{valor}</strong><span>{detalle}</span></span><ArrowRight size={17} className="almacen-widget-arrow" aria-hidden="true" /></Link>)}</div>}
      {hasPermission(usuario, "VIEW_INVENTORY") && inventario && <div className="almacen-inventario-panel"><h3>Analítica de inventario</h3><div className="almacen-dashboard-grid almacen-dashboard-grid-finanzas" aria-label="Indicadores de inventario">{[
        { titulo: "Valor total de inventario", valor: moneda(inventario.valorTotalInventario), detalle: "Existencia × mejor costo disponible", icono: CircleDollarSign },
        { titulo: "Consumo mensual", valor: moneda(inventario.consumoMensual), detalle: "Salidas valorizadas del mes actual", icono: ChartNoAxesCombined },
        { titulo: "Rotación mensual", valor: `${Number(inventario.rotacionMensual || 0).toFixed(2)}x`, detalle: "Consumo mensual ÷ valor del inventario", icono: Gauge },
      ].map(({ titulo, valor, detalle, icono }) => <article className="almacen-widget" key={titulo}><span className="almacen-widget-icon">{createElement(icono, { size: 23 })}</span><span className="almacen-widget-copy"><small>{titulo}</small><strong>{valor}</strong><span>{detalle}</span></span></article>)}</div></div>}
      {hasPermission(usuario, "VIEW_INVENTORY") && resumen?.alertas?.filter((alerta) => alerta.tipo === "STOCK_BAJO").map((alerta) => <Link className="almacen-dashboard-alert" to="/insumos?stockBajo=true" key={alerta.tipo}><AlertTriangle size={20} /><span><strong>{alerta.titulo}</strong><small>{alerta.descripcion}</small></span><ArrowRight size={17} /></Link>)}
    </>}
  </section>;
}
