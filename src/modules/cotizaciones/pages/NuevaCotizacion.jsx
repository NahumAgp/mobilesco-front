import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Barcode, Download, MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { obtenerClientesActivos } from "../../clientes/services/clientes";
import { buscarProductosCotizables, crearCotizacion } from "../services/cotizaciones";
import { descargarPdfCotizacion, compartirCotizacionWhatsApp } from "../utils/cotizacionPdf";
import "./cotizaciones.css";

const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("NOMBRE");
  const [resultados, setResultados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [margen, setMargen] = useState(35);
  const [descuento, setDescuento] = useState(0);
  const [flete, setFlete] = useState(0);
  const [iva, setIva] = useState(16);
  const [vigencia, setVigencia] = useState(15);
  const [notas, setNotas] = useState("");
  const [condiciones, setCondiciones] = useState("Precios sujetos a la vigencia indicada y disponibilidad.");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(null);

  useEffect(() => { obtenerClientesActivos().then(setClientes).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return undefined; }
    const timer = setTimeout(() => buscarProductosCotizables(busqueda, tipo)
      .then(setResultados).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(timer);
  }, [busqueda, tipo]);

  const resumen = useMemo(() => {
    const divisor = 1 - Number(margen || 0) / 100;
    const subtotalCostos = carrito.reduce((s, item) => s + Number(item.costoTotal) * item.cantidad, 0);
    const subtotal = divisor > 0 ? carrito.reduce((s, item) => s + (Number(item.costoTotal) / divisor) * item.cantidad, 0) : 0;
    const montoDescuento = subtotal * Number(descuento || 0) / 100;
    const baseIva = subtotal - montoDescuento + Number(flete || 0);
    const montoIva = baseIva * Number(iva || 0) / 100;
    return { subtotalCostos, subtotal, montoDescuento, baseIva, montoIva, total: baseIva + montoIva };
  }, [carrito, margen, descuento, flete, iva]);

  const agregar = (producto) => {
    if (!producto.cotizable) return;
    setCarrito((actual) => {
      const existente = actual.find((i) => i.id === producto.id);
      return existente
        ? actual.map((i) => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...actual, { ...producto, cantidad: 1 }];
    });
    setBusqueda("");
  };
  const cantidad = (id, valor) => setCarrito((items) => items.map((i) => i.id === id ? { ...i, cantidad: Math.max(1, Number(valor) || 1) } : i));

  const guardar = async (estado) => {
    if (!clienteId) return setError("Selecciona un cliente.");
    if (!carrito.length) return setError("Agrega al menos un producto cotizable.");
    setGuardando(true); setError("");
    try {
      const creada = await crearCotizacion({
        clienteId: Number(clienteId), estado, vigenciaDias: Number(vigencia),
        margenPorcentaje: Number(margen), descuentoPorcentaje: Number(descuento),
        flete: Number(flete), ivaPorcentaje: Number(iva), notas, condiciones,
        detalles: carrito.map((item) => ({ productoId: item.id, cantidad: item.cantidad })),
      });
      setGuardada(creada);
    } catch (e) { setError(e.message); } finally { setGuardando(false); }
  };

  if (guardada) return <div className="cot-page">
    <section className="cot-success cot-card">
      <div className="cot-success-icon">✓</div><h1>Cotización creada</h1>
      <p>{guardada.folio} · {guardada.clienteNombre}</p><strong>{moneda(guardada.total)}</strong>
      <div><button onClick={() => descargarPdfCotizacion(guardada)}><Download size={18} /> Descargar PDF</button>
      <button className="cot-primary" onClick={() => compartirCotizacionWhatsApp(guardada)}><MessageCircle size={18} /> Enviar por WhatsApp</button></div>
      <button className="cot-link" onClick={() => navigate("/cotizaciones")}>Volver a cotizaciones</button>
    </section>
  </div>;

  return <div className="cot-page">
    <header className="cot-header"><div><button className="cot-back" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={18} /> Cotizaciones</button><h1>Nueva cotización</h1><p>Agrega productos con costos completos y calcula la propuesta.</p></div>
      <div className="cot-header-actions"><button disabled={guardando} onClick={() => guardar("BORRADOR")}>Guardar borrador</button><button className="cot-primary" disabled={guardando} onClick={() => guardar("PENDIENTE")}>{guardando ? "Guardando..." : "Finalizar cotización"}</button></div></header>
    {error && <div className="cot-alert cot-alert-error">{error}</div>}
    <div className="cot-form-grid"><main>
      <section className="cot-card cot-section"><h2>1. Cliente</h2><select value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Selecciona un cliente...</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombreVisual}</option>)}</select></section>
      <section className="cot-card cot-section"><h2>2. Productos</h2>
        <div className="cot-search-mode"><button className={tipo === "NOMBRE" ? "active" : ""} onClick={() => setTipo("NOMBRE")}><Search size={17} /> Nombre</button><button className={tipo === "CODIGO" ? "active" : ""} onClick={() => setTipo("CODIGO")}><Barcode size={17} /> Código / barras</button></div>
        <label className="cot-search cot-product-search"><Search size={19} /><input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={tipo === "CODIGO" ? "Escanea o escribe el SKU..." : "Escribe el nombre del producto..."} /></label>
        {!!resultados.length && <div className="cot-results">{resultados.map((p) => <button key={p.id} disabled={!p.cotizable} onClick={() => agregar(p)}>
          <span><strong>{p.sku}</strong><small>{p.nombre}</small>{!p.cotizable && <em>{p.faltantes.join(". ")}</em>}</span>
          <span>{p.cotizable ? <><b>{moneda(p.costoTotal)}</b><Plus size={18} /></> : "No cotizable"}</span></button>)}</div>}
        <div className="cot-lines">{carrito.map((p) => <div key={p.id} className="cot-line"><div><strong>{p.sku}</strong><span>{p.nombre}</span></div><input aria-label="Cantidad" type="number" min="1" value={p.cantidad} onChange={(e) => cantidad(p.id, e.target.value)} /><span>{moneda((p.costoTotal / (1 - margen / 100)) * p.cantidad)}</span><button onClick={() => setCarrito((items) => items.filter((i) => i.id !== p.id))}><Trash2 size={18} /></button></div>)}</div>
        {!carrito.length && <div className="cot-empty">Busca por nombre o código para agregar productos.</div>}
      </section>
      <section className="cot-card cot-section"><h2>3. Condiciones</h2><div className="cot-fields"><label>Vigencia (días)<input type="number" min="1" value={vigencia} onChange={(e) => setVigencia(e.target.value)} /></label><label>Notas<textarea value={notas} onChange={(e) => setNotas(e.target.value)} /></label><label className="wide">Condiciones<textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} /></label></div></section>
    </main><aside className="cot-card cot-summary"><h2>Resumen</h2>
      <div className="cot-fields compact"><label>Margen real (%)<input type="number" min="0.01" max="95" value={margen} onChange={(e) => setMargen(e.target.value)} /></label><label>Descuento (%)<input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></label><label>Flete<input type="number" min="0" value={flete} onChange={(e) => setFlete(e.target.value)} /></label><label>IVA (%)<input type="number" min="0" value={iva} onChange={(e) => setIva(e.target.value)} /></label></div>
      <dl><div><dt>Costo de productos</dt><dd>{moneda(resumen.subtotalCostos)}</dd></div><div><dt>Subtotal venta</dt><dd>{moneda(resumen.subtotal)}</dd></div><div><dt>Descuento</dt><dd>-{moneda(resumen.montoDescuento)}</dd></div><div><dt>Flete</dt><dd>{moneda(flete)}</dd></div><div><dt>IVA</dt><dd>{moneda(resumen.montoIva)}</dd></div></dl>
      <div className="cot-grand-total"><span>Total</span><strong>{moneda(resumen.total)}</strong></div>
      <p className="cot-cost-note">El precio se calcula con margen real. El servidor volverá a validar todos los costos antes de guardar.</p>
      <button className="cot-primary cot-full" disabled={guardando} onClick={() => guardar("PENDIENTE")}>Finalizar cotización</button>
    </aside></div>
  </div>;
}
