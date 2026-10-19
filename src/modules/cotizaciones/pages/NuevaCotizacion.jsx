import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Download, FileText, MessageCircle, Percent, Plus, Search, StickyNote, Trash2, Truck, UserPlus, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { crearCliente, obtenerClientesActivos } from "../../clientes/services/clientes";
import { actualizarCotizacion, buscarProductosCotizables, cotizarFlete, crearCotizacion, obtenerCotizacion } from "../services/cotizaciones";
import { descargarPdfCotizacion, compartirCotizacionWhatsApp } from "../utils/cotizacionPdf";
import { getUser, hasPermission } from "../../auth/services/authService";
import FleteMapa from "../components/FleteMapa";
import "./cotizaciones.css";
import "./cotizacion-detalle.css";

const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));
const duracion = (segundos) => {
  if (!segundos || Number(segundos) < 0) return "no disponible";
  const minutos = Math.ceil(Number(segundos || 0) / 60);
  return minutos >= 60 ? `${Math.floor(minutos / 60)} h ${minutos % 60} min` : `${minutos} min`;
};
const precioUnitario = (item, margen) => item.utilidad !== undefined && item.utilidad !== null
  ? Number(item.costoTotal) * (1 + Number(item.utilidad) / 100)
  : Number(item.costoTotal) / (1 - Number(margen || 0) / 100);
const clienteInicial = {
  clasificacion: "PROSPECTO", tipoPersona: "MORAL", nombre: "", razonSocial: "",
  nombreComercial: "", correo: "", telefono: "", whatsapp: "",
  diasCredito: 0, limiteCredito: 0, activo: true,
};
const direccionCliente = (cliente) => [cliente.calle, cliente.numeroExterior, cliente.colonia,
  cliente.ciudad, cliente.estado, cliente.codigoPostal, "México"].filter(Boolean).join(", ");

export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: cotizacionId } = useParams();
  const editando = Boolean(cotizacionId);
  const cotizacionRapida = Boolean(location.state?.cotizacionRapida);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [carrito, setCarrito] = useState(() => location.state?.carritoInicial || []);
  const [utilidadEditandoId, setUtilidadEditandoId] = useState(null);
  const [margen, setMargen] = useState(35);
  const [descuento, setDescuento] = useState(0);
  const [flete, setFlete] = useState(0);
  const [destinoFlete, setDestinoFlete] = useState("");
  const [puntoFlete, setPuntoFlete] = useState(null);
  const [rutaFlete, setRutaFlete] = useState(null);
  const [errorFlete, setErrorFlete] = useState("");
  const [calculandoFlete, setCalculandoFlete] = useState(false);
  const solicitudFlete = useRef(0);
  const puedeConfigurarFlete = hasPermission(getUser(), "ACTION_QUOTES_EDIT");
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
  const [cargandoEdicion, setCargandoEdicion] = useState(editando);

  useEffect(() => { obtenerClientesActivos().then(setClientes).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!editando) return;
    obtenerCotizacion(cotizacionId).then((data) => {
      setClienteId(data.clienteId ? String(data.clienteId) : "");
      setCarrito((data.detalles || []).map((d) => ({ id: d.productoId, sku: d.sku, nombre: d.nombre, costoTotal: d.costoUnitario, cantidad: d.cantidad, utilidad: d.utilidadPorcentaje })));
      setMargen(data.margenPorcentaje ?? 35);
      setDescuento(data.descuentoPorcentaje ?? 0);
      setFlete(data.flete ?? 0);
      setIva(data.ivaPorcentaje ?? 16);
      setVigencia(Math.max(1, Math.round((new Date(data.fechaVencimiento) - new Date(data.fechaEmision)) / 86400000)));
      setNotas(data.notas || "");
      setCondiciones(data.condiciones || "");
    }).catch((e) => setError(e.message)).finally(() => setCargandoEdicion(false));
  }, [cotizacionId, editando]);
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return undefined; }
    const timer = setTimeout(() => buscarProductosCotizables(busqueda)
      .then(setResultados).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const resumen = useMemo(() => {
    const divisor = 1 - Number(margen || 0) / 100;
    const subtotalCostos = carrito.reduce((s, item) => s + Number(item.costoTotal) * item.cantidad, 0);
    const subtotal = divisor > 0 ? carrito.reduce((s, item) => s + precioUnitario(item, margen) * item.cantidad, 0) : 0;
    const montoDescuento = subtotal * Number(descuento || 0) / 100;
    const baseIva = subtotal - montoDescuento + Number(flete || 0);
    const montoIva = baseIva * Number(iva || 0) / 100;
    const ventaNetaProductos = subtotal - montoDescuento;
    const margenReal = ventaNetaProductos > 0
      ? (ventaNetaProductos - subtotalCostos) / ventaNetaProductos * 100 : 0;
    return { subtotalCostos, subtotal, montoDescuento, baseIva, montoIva, total: baseIva + montoIva, margenReal };
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
  const utilidad = (id, valor) => setCarrito((items) => items.map((i) => i.id === id
    ? { ...i, utilidad: Math.min(95, Math.max(0.01, Number(valor) || 0.01)) }
    : i));

  const cambiarCliente = (event) => {
    const { name, value } = event.target;
    setNuevoCliente((actual) => ({ ...actual, [name]: value }));
  };

  const cambiarDestinoFlete = (valor) => {
    solicitudFlete.current += 1;
    setCalculandoFlete(false);
    setDestinoFlete(valor);
    setPuntoFlete(null);
    if (rutaFlete?.fleteSugerido != null && Number(flete) === Number(rutaFlete.fleteSugerido)) setFlete(0);
    setRutaFlete(null);
    setErrorFlete("");
  };

  const seleccionarPuntoFlete = (punto) => {
    solicitudFlete.current += 1;
    setCalculandoFlete(false);
    setPuntoFlete(punto);
    setDestinoFlete(`${punto.latitud.toFixed(6)}, ${punto.longitud.toFixed(6)}`);
    if (rutaFlete?.fleteSugerido != null && Number(flete) === Number(rutaFlete.fleteSugerido)) setFlete(0);
    setRutaFlete(null);
    setErrorFlete("");
  };

  const seleccionarCliente = (valor) => {
    setClienteId(valor);
    const cliente = clientes.find((item) => String(item.id) === valor);
    cambiarDestinoFlete(cliente && [cliente.calle, cliente.ciudad, cliente.codigoPostal].some(Boolean)
      ? direccionCliente(cliente) : "");
  };

  const calcularFlete = async () => {
    if (!puntoFlete && !destinoFlete.trim()) { setErrorFlete("Selecciona un punto o ingresa la dirección de entrega."); return; }
    const solicitud = ++solicitudFlete.current;
    setCalculandoFlete(true); setErrorFlete("");
    try {
      const ruta = await cotizarFlete(puntoFlete
        ? { latitud: puntoFlete.latitud, longitud: puntoFlete.longitud }
        : { destino: destinoFlete.trim() });
      if (solicitud !== solicitudFlete.current) return;
      setRutaFlete(ruta);
      if (ruta.fleteSugerido != null) setFlete(ruta.fleteSugerido);
      else if (rutaFlete?.fleteSugerido != null && Number(flete) === Number(rutaFlete.fleteSugerido)) setFlete(0);
    } catch (e) {
      if (solicitud === solicitudFlete.current) setErrorFlete(e.message || "No fue posible calcular el flete.");
    } finally {
      if (solicitud === solicitudFlete.current) setCalculandoFlete(false);
    }
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
        whatsapp: null,
      });
      setClientes((actual) => [...actual, creado].sort((a, b) => a.nombreVisual.localeCompare(b.nombreVisual)));
      seleccionarCliente(String(creado.id));
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
    if (estado !== "BORRADOR" && resumen.margenReal <= 0)
      return setError("El descuento deja la venta de productos sin utilidad.");
    setGuardando(true); setError("");
    try {
      const payload = {
        clienteId: clienteId ? Number(clienteId) : null, estado, vigenciaDias: Number(vigencia),
        descuentoPorcentaje: Number(descuento),
        flete: Number(flete), ivaPorcentaje: Number(iva), notas, condiciones,
        margenPorcentaje: carrito.every((item) => item.utilidad !== undefined && item.utilidad !== null) ? null : Number(margen),
        detalles: carrito.map((item) => ({ productoId: item.id, cantidad: item.cantidad, utilidadPorcentaje: item.utilidad ?? null })),
      };
      const creada = editando ? await actualizarCotizacion(cotizacionId, payload) : await crearCotizacion(payload);
      if (editando) navigate("/cotizaciones", { state: { mensaje: `Cotización ${creada.folio} actualizada.` } });
      else setGuardada(creada);
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

  if (cargandoEdicion) return <div className="cot-page"><div className="cot-card cot-empty">Cargando cotización...</div></div>;

  return <div className="cot-page">
    <header className="cot-header"><div><button className="cot-back" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={18} /> Cotizaciones</button><h1>{editando ? "Editar cotización" : "Nueva cotización"}</h1><p>{editando ? "Actualiza productos, cantidades y condiciones antes de continuar." : "Agrega productos con costos completos y calcula la propuesta."}</p></div>
      <div className="cot-header-actions"><button disabled={guardando} onClick={() => guardar("BORRADOR")}>Guardar borrador</button><button className="cot-primary" disabled={guardando || resumen.margenReal <= 0} onClick={() => guardar("PENDIENTE")}>{guardando ? "Guardando..." : "Finalizar cotización"}</button></div></header>
    {error && <div className="cot-alert cot-alert-error">{error}</div>}
    <div className="cot-form-grid"><main>
      <section className="cot-card cot-section cot-client-section">
        <div className="cot-section-title"><div><h2>1. Cliente <span>Opcional</span></h2><p>Selecciona un cliente o continúa como público general.</p></div></div>
        <div className="cot-client-picker">
          <select value={clienteId} onChange={(e) => seleccionarCliente(e.target.value)}>
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
        <div className="cot-lines">{carrito.map((p) => <div key={p.id} className={`cot-line ${p.utilidad !== undefined && p.utilidad !== null ? "cot-line-with-utility" : ""}`}><div><strong>{p.sku}</strong><span>{p.nombre}</span>{p.utilidad !== undefined && p.utilidad !== null && <small>Utilidad por renglón</small>}</div>{p.utilidad !== undefined && p.utilidad !== null && (utilidadEditandoId === p.id ? <input autoFocus aria-label="Utilidad del producto" type="number" min="0.01" max="95" step="0.01" value={p.utilidad} onChange={(e) => utilidad(p.id, e.target.value)} onBlur={() => setUtilidadEditandoId(null)} /> : <button type="button" className="cot-edit-utility" title="Modificar utilidad" aria-label="Modificar utilidad" onClick={() => setUtilidadEditandoId(p.id)}><Percent size={17} /></button>)}{p.utilidad !== undefined && p.utilidad !== null && <span className="cot-line-percent">%</span>}<input aria-label="Cantidad" type="number" min="1" value={p.cantidad} onChange={(e) => cantidad(p.id, e.target.value)} /><span>{moneda(precioUnitario(p, margen) * p.cantidad)}</span><button onClick={() => setCarrito((items) => items.filter((i) => i.id !== p.id))}><Trash2 size={18} /></button></div>)}</div>
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
      <div className="cot-flete-box">
        <label htmlFor="destino-flete">Dirección de entrega</label>
        <input id="destino-flete" value={destinoFlete} onChange={(e) => cambiarDestinoFlete(e.target.value)} placeholder="Calle, número, ciudad, estado y CP" />
        <FleteMapa punto={puntoFlete} ruta={rutaFlete} onSeleccionar={seleccionarPuntoFlete} />
        <button type="button" disabled={calculandoFlete} onClick={calcularFlete}><Truck size={17} /> {calculandoFlete ? "Calculando..." : "Calcular flete"}</button>
        {rutaFlete && <div className="cot-flete-resultado" role="status"><strong>Ruta óptima: {rutaFlete.distanciaKm} km · tiempo estimado {duracion(rutaFlete.duracionSegundos)}</strong>
          <span>Salida: {rutaFlete.origen}</span>
          {rutaFlete.fleteSugerido != null
            ? <span>Tarifa hasta {rutaFlete.hastaKm} km: {moneda(rutaFlete.fleteSugerido)}</span>
            : <span>No hay precio para esta distancia. Configura el tabulador o captura el flete manualmente.</span>}
        </div>}
        {errorFlete && <p className="cot-flete-error" role="alert">{errorFlete}</p>}
        {puedeConfigurarFlete
          ? <a className="cot-flete-tabulador" href="/cotizaciones/fletes" target="_blank" rel="noopener noreferrer">Configurar tabulador de flete ↗</a>
          : <p>El tabulador lo configura un usuario con permiso para editar cotizaciones.</p>}
      </div>
      <div className="cot-fields compact">{!cotizacionRapida && <label>{carrito.length && carrito.every((item) => item.utilidad !== undefined && item.utilidad !== null) ? "Utilidad por producto" : "Margen real (%)"}<input type="number" min="0.01" max="95" value={margen} disabled={carrito.some((item) => item.utilidad !== undefined && item.utilidad !== null)} onChange={(e) => setMargen(e.target.value)} /></label>}<label>Descuento (%)<input type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></label><label>Flete (MXN)<input type="number" min="0" value={flete} onChange={(e) => { solicitudFlete.current += 1; setCalculandoFlete(false); setFlete(e.target.value); }} /></label><label>IVA (%)<input type="number" min="0" value={iva} onChange={(e) => setIva(e.target.value)} /></label></div>
      <dl><div><dt>Costo de productos</dt><dd>{moneda(resumen.subtotalCostos)}</dd></div><div><dt>Subtotal venta</dt><dd>{moneda(resumen.subtotal)}</dd></div><div><dt>Descuento</dt><dd>-{moneda(resumen.montoDescuento)}</dd></div><div><dt>Flete</dt><dd>{moneda(flete)}</dd></div><div><dt>IVA</dt><dd>{moneda(resumen.montoIva)}</dd></div></dl>
      <p className={resumen.margenReal <= 0 && carrito.length ? "cot-alert cot-alert-error" : "cot-cost-note"}>
        Margen real después del descuento: {resumen.margenReal.toFixed(2)}% (sin incluir flete ni IVA).
      </p>
      <div className="cot-grand-total"><span>Total</span><strong>{moneda(resumen.total)}</strong></div>
      <p className="cot-cost-note">El precio se calcula con margen real. El servidor volverá a validar todos los costos antes de guardar.</p>
      <button className="cot-primary cot-full" disabled={guardando || resumen.margenReal <= 0} onClick={() => guardar("PENDIENTE")}>Finalizar cotización</button>
    </aside></div>
    {mostrarCliente && <div className="cot-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMostrarCliente(false)}>
      <form className="cot-modal cot-client-modal" onSubmit={guardarClienteRapido}>
        <button type="button" className="cot-modal-close" aria-label="Cerrar" onClick={() => setMostrarCliente(false)}><X size={22} /></button>
        <div className="cot-client-modal-heading"><span><UserPlus size={24} /></span><div><h2>Nuevo cliente</h2><p>Regístralo sin salir de la cotización.</p></div></div>
        {errorCliente && <div className="cot-alert cot-alert-error">{errorCliente}</div>}
        <div className="cot-client-form">
          <label>Tipo de persona<select name="tipoPersona" value={nuevoCliente.tipoPersona} onChange={cambiarCliente}><option value="MORAL">Persona moral</option><option value="FISICA">Persona física</option></select></label>
          <label>Clasificación<select name="clasificacion" value={nuevoCliente.clasificacion} onChange={cambiarCliente}><option value="PROSPECTO">Prospecto</option><option value="NUEVO">Cliente nuevo</option><option value="RECURRENTE">Cliente recurrente</option><option value="DISTRIBUIDOR">Distribuidor</option><option value="FORANEO">Cliente foráneo</option><option value="PRIORITARIO">Cliente prioritario</option></select></label>
          <label className="wide">{nuevoCliente.tipoPersona === "MORAL" ? "Razón social" : "Nombre *"}<input required={nuevoCliente.tipoPersona !== "MORAL"} name={nuevoCliente.tipoPersona === "MORAL" ? "razonSocial" : "nombre"} value={nuevoCliente.tipoPersona === "MORAL" ? nuevoCliente.razonSocial : nuevoCliente.nombre} onChange={cambiarCliente} /></label>
          <label className="wide">Nombre comercial<input name="nombreComercial" value={nuevoCliente.nombreComercial} onChange={cambiarCliente} /></label>
          <label>Teléfono<input name="telefono" value={nuevoCliente.telefono} onChange={cambiarCliente} placeholder="Ej. 4491234567" /></label>
          <label>Correo<input type="email" name="correo" value={nuevoCliente.correo} onChange={cambiarCliente} placeholder="cliente@correo.com" /></label>
        </div>
        <div className="cot-client-modal-actions"><button type="button" onClick={() => setMostrarCliente(false)}>Cancelar</button><button className="cot-primary" disabled={guardandoCliente}>{guardandoCliente ? "Guardando..." : "Crear y seleccionar"}</button></div>
      </form>
    </div>}
  </div>;
}
