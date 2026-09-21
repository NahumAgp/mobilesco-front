import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, Search, Trash2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buscarProductosCotizables } from "../services/cotizaciones";
import { obtenerEstructuraCostos } from "../../productos/services/productos";
import { construirUrlImagen } from "../../productos/services/imagenes";
import "./cotizaciones.css";
import "./cotizacion-rapida.css";

const UTILIDADES = [40, 50, 60, 80];
const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const precioConUtilidad = (costo, utilidad) => Number(costo || 0) * (1 + Number(utilidad || 0) / 100);

export default function CotizacionRapida() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [utilidadManual, setUtilidadManual] = useState("");
  const [productoActivo, setProductoActivo] = useState(null);
  const [estructura, setEstructura] = useState(null);
  const [cargandoEstructura, setCargandoEstructura] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return undefined; }
    const timer = setTimeout(async () => {
      setCargando(true);
      try { setResultados(await buscarProductosCotizables(busqueda)); setError(""); }
      catch (e) { setError(e.message || "No fue posible buscar productos."); }
      finally { setCargando(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const total = useMemo(() => seleccionados.reduce((sum, item) => sum + precioConUtilidad(item.costoTotal, item.utilidad), 0), [seleccionados]);
  const productosDisponibles = resultados.filter((producto) => producto.cotizable);
  const costoSeleccionado = estructura?.costoTotal ?? productoActivo?.costoTotal ?? 0;

  const seleccionarProducto = async (producto) => {
    setProductoActivo(producto);
    setEstructura(null);
    setCargandoEstructura(true);
    try {
      setEstructura(await obtenerEstructuraCostos(producto.id));
      setError("");
    } catch (e) {
      setError(e.message || "No fue posible cargar la estructura de costos.");
    } finally {
      setCargandoEstructura(false);
    }
  };

  const agregar = (producto, utilidad) => {
    const porcentaje = Number(utilidad);
    if (!producto.cotizable || !Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 95) return;
    setSeleccionados((actual) => actual.some((item) => item.id === producto.id)
      ? actual.map((item) => item.id === producto.id ? { ...item, utilidad: porcentaje } : item)
      : [...actual, { ...producto, utilidad: porcentaje, cantidad: 1 }]);
    setUtilidadManual("");
  };

  const quitar = (id) => setSeleccionados((actual) => actual.filter((item) => item.id !== id));
  const enviar = () => {
    if (!seleccionados.length) return setError("Agrega al menos un producto con utilidad.");
    navigate("/cotizaciones/formal", {
      state: {
        carritoInicial: seleccionados,
        cotizacionRapida: true,
      },
    });
  };

  return <div className="cot-page">
    <header className="cot-header">
      <div>
        <button className="cot-back" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={18} /> Cotizaciones</button>
        <h1>Nueva cotización</h1>
        <p>Elige productos, compara utilidades y prepara una cotización formal.</p>
      </div>
    </header>
    {error && <div className="cot-alert cot-alert-error">{error}</div>}
    <div className="cot-quick-grid">
      <main className="cot-quick-builder">
        <section className="cot-card cot-section">
          <div className="cot-quick-heading"><span className="cot-section-icon"><Zap size={21} /></span><div><h2>Selecciona un producto</h2><p>Escribe el nombre para encontrarlo.</p></div></div>
          <label className="cot-search cot-product-search"><Search size={20} /><input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Concha silla primaria" /></label>
          {cargando && <div className="cot-quick-status">Buscando productos...</div>}
          {!!productosDisponibles.length && <div className="cot-results cot-name-results">{productosDisponibles.slice(0, 5).map((p) => <button key={p.id} type="button" onClick={() => seleccionarProducto(p)} className={`cot-name-result ${productoActivo?.id === p.id ? "selected" : ""}`}><span>{p.nombre}</span><ArrowLeft size={16} /></button>)}</div>}
          {!cargando && busqueda && !productosDisponibles.length && <div className="cot-empty">No encontramos productos cotizables con esos términos.</div>}
          {!busqueda && <div className="cot-empty">Escribe cualquier combinación de palabras para comenzar.</div>}
        </section>
        {productoActivo && <section className="cot-card cot-section cot-cost-detail">
          <div className="cot-cost-heading"><div><span className="cot-section-kicker">Producto seleccionado</span><h2>{productoActivo.nombre}</h2><p>{productoActivo.sku}</p></div><strong>{cargandoEstructura ? "Cargando..." : estructura ? moneda(estructura.costoTotal) : ""}</strong></div>
          {cargandoEstructura && <div className="cot-quick-status">Consultando insumos, mano de obra y CIF...</div>}
          {estructura && <><div className="cot-cost-breakdown"><div><span>Insumos</span><b>{moneda(estructura.costoInsumosConDesperdicio)}</b></div><div><span>Mano de obra</span><b>{moneda(estructura.costoOperaciones)}</b></div><div><span>CIF</span><b>{moneda(estructura.costoCif)}</b></div><div className="total"><span>Costo total de fabricación</span><b>{moneda(estructura.costoTotal)}</b></div></div><div className="cot-utility-heading"><h3>Elige la utilidad</h3><span>Cada tarjeta agrega el producto al borrador</span></div><div className="cot-utility-cards">{UTILIDADES.map((utilidad) => <article className="cot-utility-card" key={utilidad}><div className="cot-utility-image">{productoActivo.imagenPrincipalUrl ? <img src={construirUrlImagen(productoActivo.imagenPrincipalUrl)} alt={productoActivo.nombre} /> : <span>Sin imagen</span>}</div><strong>{utilidad}% de utilidad</strong><b>{moneda(precioConUtilidad(costoSeleccionado, utilidad))}</b><button type="button" onClick={() => agregar(productoActivo, utilidad)}><Plus size={16} /> Agregar a borrador</button></article>)}<article className="cot-utility-card manual"><div className="cot-utility-image">{productoActivo.imagenPrincipalUrl ? <img src={construirUrlImagen(productoActivo.imagenPrincipalUrl)} alt={productoActivo.nombre} /> : <span>Sin imagen</span>}</div><strong>Utilidad manual</strong><div className="cot-manual-utility"><input type="number" min="0.01" max="95" step="0.01" value={utilidadManual} onChange={(e) => setUtilidadManual(e.target.value)} placeholder="Ej. 72.5" /><span>%</span></div><b>{utilidadManual ? moneda(precioConUtilidad(costoSeleccionado, utilidadManual)) : "Captura un porcentaje"}</b><button type="button" disabled={!utilidadManual} onClick={() => agregar(productoActivo, utilidadManual)}><Plus size={16} /> Agregar a borrador</button></article></div></>}
        </section>}
      </main>
      <aside className="cot-card cot-quick-summary">
        <div className="cot-quick-summary-heading"><div><span>Resumen</span><h2>Productos para cotizar</h2></div><strong>{seleccionados.length}</strong></div>
        <div className="cot-quick-selected">{seleccionados.map((item) => <div className="cot-quick-line" key={item.id}><div><strong>{item.nombre}</strong><small>{item.sku} · Utilidad {item.utilidad}%</small></div><div><b>{moneda(precioConUtilidad(item.costoTotal, item.utilidad))}</b><button title="Quitar producto" onClick={() => quitar(item.id)}><Trash2 size={16} /></button></div></div>)}</div>
        {!seleccionados.length && <div className="cot-empty">Aquí aparecerán los productos que elijas.</div>}
        <div className="cot-quick-total"><span>Total estimado por pieza</span><strong>{moneda(total)}</strong></div>
        <button className="cot-primary cot-full" disabled={!seleccionados.length} onClick={enviar}>Mandar a cotización <ArrowLeft size={17} className="cot-quick-send-icon" /></button>
      </aside>
    </div>
  </div>;
}
