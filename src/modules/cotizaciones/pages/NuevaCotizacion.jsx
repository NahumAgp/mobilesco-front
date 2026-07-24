import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Download, FileText, MessageCircle, Plus, Search, StickyNote, Trash2, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { crearCliente, obtenerClientesActivos } from "../../clientes/services/clientes";
import { buscarProductosCotizables, crearCotizacion } from "../services/cotizaciones";
import { descargarPdfCotizacion, compartirCotizacionWhatsApp } from "../utils/cotizacionPdf";
import "./cotizaciones.css";

const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const clienteInicial = {
  clasificacion: "PROSPECTO", tipoPersona: "MORAL", nombre: "", razonSocial: "",
  nombreComercial: "", correo: "", telefono: "", whatsapp: "",
  diasCredito: 0, limiteCredito: 0, activo: true,
};

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [busqueda, setBusqueda] = useState("");
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
  const [mostrarCliente, setMostrarCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(clienteInicial);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");

  useEffect(() => { obtenerClientesActivos().then(setClientes).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return undefined; }
    const timer = setTimeout(() => buscarProductosCotizables(busqueda)
      .then(setResultados).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(timer);
  }, [busqueda]);

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

  const cambiarCliente = (event) => {
    const { name, value } = event.target;
    setNuevoCliente((actual) => ({ ...actual, [name]: value }));
  };

  const guardarClienteRapido = async (event) => {
    event.preventDefault();
    setErrorCliente("");
    setGuardandoCliente(true);
    try {
      const creado = await crearCliente({
        ...nuevoCliente,
        nombre: nuevoCliente.nombre.trim() || null,
        razonSocial: nuevoCliente.razonSocial.trim() || null,
        nombreComercial: nuevoCliente.nombreComercial.trim() || null,
        correo: nuevoCliente.correo.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null,
        whatsapp: nuevoCliente.whatsapp.trim() || null,
      });
      setClientes((actual) => [...actual, creado].sort((a, b) => a.nombreVisual.localeCompare(b.nombreVisual)));
      setClienteId(String(creado.id));
      setNuevoCliente(clienteInicial);
      setMostrarCliente(false);
    } catch (e) {
      setErrorCliente(e.message || "No fue posible crear el cliente.");
    } finally {
      setGuardandoCliente(false);
    }
  };

  const guardar = async (estado) => {
    if (!carrito.length) return setError("Agrega al menos un producto cotizable.");
    setGuardando(true); setError("");
    try {
      const creada = await crearCotizacion({
        clienteId: clienteId ? Number(clienteId) : null, estado, vigenciaDias: Number(vigencia),
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
      <section className="cot-card cot-section cot-client-section">
        <div className="cot-section-title"><div><h2>1. Cliente <span>Opcional</span></h2><p>Selecciona un cliente o continúa como público general.</p></div></div>
        <div className="cot-client-picker">
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Público general / sin cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombreVisual}</option>)}
          </select>
          <button type="button" className="cot-add-client" title="Crear cliente" onClick={() => setMostrarCliente(true)}><Plus size={22} /><span>Nuevo cliente</span></button>
        </div>
      </section>
      <section className="cot-card cot-section"><h2>2. Productos</h2>
        <label className="cot-search cot-product-search"><Search size={20} /><input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras..." /></label>
        {!!resultados.length && <div className="cot-results">{resultados.map((p) => <button key={p.id} disabled={!p.cotizable} onClick={() => agregar(p)}>
          <span><strong>{p.sku}</strong><small>{p.nombre}</small>{!p.cotizable && <em>{p.faltantes.join(". ")}</em>}</span>
          <span>{p.cotizable ? <><b>{moneda(p.costoTotal)}</b><Plus size={18} /></> : "No cotizable"}</span></button>)}</div>}
        <div className="cot-lines">{carrito.map((p) => <div key={p.id} className="cot-line"><div><strong>{p.sku}</strong><span>{p.nombre}</span></div><input aria-label="Cantidad" type="number" min="1" value={p.cantidad} onChange={(e) => cantidad(p.id, e.target.value)} /><span>{moneda((p.costoTotal / (1 - margen / 100)) * p.cantidad)}</span><button onClick={() => setCarrito((items) => items.filter((i) => i.id !== p.id))}><Trash2 size={18} /></button></div>)}</div>
        {!carrito.length && <div className="cot-empty">Escribe un nombre o código; los resultados se filtrarán mientras tecleas.</div>}
      </section>
      <section className="cot-card cot-section cot-conditions">
        <div className="cot-section-title">
          <div className="cot-section-icon"><FileText size={21} /></div>
          <div><h2>3. Condiciones comerciales</h2><p>Define la vigencia y los detalles que aparecerán en la cotización.</p></div>
        </div>
        <div className="cot-condition-grid">
          <label className="cot-condition-field"><span><CalendarDays size={16} /> Vigencia</span><div className="cot-input-suffix"><input type="number" min="1" value={vigencia} onChange={(e) => setVigencia(e.target.value)} /><b>días</b></div></label>
          <label className="cot-condition-field"><span><StickyNote size={16} /> Notas internas</span><textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agrega observaciones para esta cotización..." /></label>
          <label className="cot-condition-field cot-condition-wide"><span><FileText size={16} /> Condiciones para el cliente</span><textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} /></label>
        </div>
      </section>
    </main><aside className="cot-card cot-summary"><h2>Resumen</h2>
      <div className="cot-fields compact"><label>Margen real (%)<input type="number" min="0.01" max="95" value={margen} onChange={(e) => setMargen(e.target.value)} /></label><label>Descuento (%)<input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></label><label>Flete<input type="number" min="0" value={flete} onChange={(e) => setFlete(e.target.value)} /></label><label>IVA (%)<input type="number" min="0" value={iva} onChange={(e) => setIva(e.target.value)} /></label></div>
      <dl><div><dt>Costo de productos</dt><dd>{moneda(resumen.subtotalCostos)}</dd></div><div><dt>Subtotal venta</dt><dd>{moneda(resumen.subtotal)}</dd></div><div><dt>Descuento</dt><dd>-{moneda(resumen.montoDescuento)}</dd></div><div><dt>Flete</dt><dd>{moneda(flete)}</dd></div><div><dt>IVA</dt><dd>{moneda(resumen.montoIva)}</dd></div></dl>
      <div className="cot-grand-total"><span>Total</span><strong>{moneda(resumen.total)}</strong></div>
      <p className="cot-cost-note">El precio se calcula con margen real. El servidor volverá a validar todos los costos antes de guardar.</p>
      <button className="cot-primary cot-full" disabled={guardando} onClick={() => guardar("PENDIENTE")}>Finalizar cotización</button>
    </aside></div>
    {mostrarCliente && <div className="cot-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMostrarCliente(false)}>
      <form className="cot-modal cot-client-modal" onSubmit={guardarClienteRapido}>
        <button type="button" className="cot-modal-close" aria-label="Cerrar" onClick={() => setMostrarCliente(false)}><X size={22} /></button>
        <div className="cot-client-modal-heading"><span><UserPlus size={24} /></span><div><h2>Nuevo cliente</h2><p>Regístralo sin salir de la cotización.</p></div></div>
        {errorCliente && <div className="cot-alert cot-alert-error">{errorCliente}</div>}
        <div className="cot-client-form">
          <label>Tipo de persona<select name="tipoPersona" value={nuevoCliente.tipoPersona} onChange={cambiarCliente}><option value="MORAL">Persona moral</option><option value="FISICA">Persona física</option></select></label>
          <label>Clasificación<select name="clasificacion" value={nuevoCliente.clasificacion} onChange={cambiarCliente}><option value="PROSPECTO">Prospecto</option><option value="NUEVO">Cliente nuevo</option><option value="RECURRENTE">Cliente recurrente</option><option value="DISTRIBUIDOR">Distribuidor</option><option value="FORANEO">Cliente foráneo</option><option value="PRIORITARIO">Cliente prioritario</option></select></label>
          <label className="wide">{nuevoCliente.tipoPersona === "MORAL" ? "Razón social *" : "Nombre *"}<input required name={nuevoCliente.tipoPersona === "MORAL" ? "razonSocial" : "nombre"} value={nuevoCliente.tipoPersona === "MORAL" ? nuevoCliente.razonSocial : nuevoCliente.nombre} onChange={cambiarCliente} /></label>
          <label className="wide">Nombre comercial<input name="nombreComercial" value={nuevoCliente.nombreComercial} onChange={cambiarCliente} /></label>
          <label>WhatsApp<input name="whatsapp" value={nuevoCliente.whatsapp} onChange={cambiarCliente} placeholder="Ej. 4491234567" /></label>
          <label>Correo<input type="email" name="correo" value={nuevoCliente.correo} onChange={cambiarCliente} placeholder="cliente@correo.com" /></label>
        </div>
        <div className="cot-client-modal-actions"><button type="button" onClick={() => setMostrarCliente(false)}>Cancelar</button><button className="cot-primary" disabled={guardandoCliente}>{guardandoCliente ? "Guardando..." : "Crear y seleccionar"}</button></div>
      </form>
    </div>}
  </div>;
}
