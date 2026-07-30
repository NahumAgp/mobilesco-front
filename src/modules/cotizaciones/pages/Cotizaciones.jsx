import { useEffect, useState } from "react";
import { Download, Eye, MessageCircle, Plus, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listarCotizaciones, obtenerCotizacion } from "../services/cotizaciones";
import { descargarPdfCotizacion, compartirCotizacionWhatsApp } from "../utils/cotizacionPdf";
import "./cotizaciones.css";

const estados = {
  BORRADOR: "Borrador", PENDIENTE: "Pendiente", ENVIADA: "Enviada", ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada", VENCIDA: "Vencida", COMPLETADA: "Completada", CANCELADA: "Cancelada",
};
const moneda = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);

export default function Cotizaciones() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const cotizacionInicial = searchParams.get("cotizacion");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const data = await listarCotizaciones({ busqueda, estado, size: 50 });
        setItems(data.content || []);
        setError("");
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, estado]);

  useEffect(() => {
    if (!cotizacionInicial) return;
    obtenerCotizacion(cotizacionInicial)
      .then(setDetalle)
      .catch((e) => setError(e.message));
  }, [cotizacionInicial]);

  const cargarDetalle = async (id) => setDetalle(await obtenerCotizacion(id));
  const conCotizacion = async (id, accion) => accion(await obtenerCotizacion(id));

  return (
    <div className="cot-page">
      <header className="cot-header">
        <div><h1>Cotizaciones</h1><p>Consulta, da seguimiento y comparte propuestas comerciales.</p></div>
        <button className="cot-primary cot-new-button" onClick={() => navigate("/cotizaciones/nueva")}><span className="cot-new-button-icon"><Plus size={20} /></span><span>Nueva cotización</span></button>
      </header>
      <section className="cot-card cot-filters">
        <label className="cot-search"><Search size={18} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por folio o cliente..." /></label>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(estados).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>
      {error && <div className="cot-alert cot-alert-error">{error}</div>}
      <section className="cot-card cot-table-wrap">
        <table className="cot-table">
          <thead><tr><th>Folio</th><th>Cliente</th><th>Emisión</th><th>Vigencia</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {!cargando && items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.folio}</strong></td><td>{item.clienteNombre}</td><td>{item.fechaEmision}</td>
                <td>{item.fechaVencimiento}</td><td><strong>{moneda(item.total)}</strong></td>
                <td><span className={`cot-status cot-status-${item.estado.toLowerCase()}`}>{estados[item.estado]}</span></td>
                <td><div className="cot-actions">
                  <button title="Ver" onClick={() => cargarDetalle(item.id)}><Eye size={17} /></button>
                  <button title="Descargar PDF" onClick={() => conCotizacion(item.id, descargarPdfCotizacion)}><Download size={17} /></button>
                  <button title="Enviar por WhatsApp" onClick={() => conCotizacion(item.id, compartirCotizacionWhatsApp)}><MessageCircle size={17} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && <div className="cot-empty">Cargando cotizaciones...</div>}
        {!cargando && !items.length && <div className="cot-empty">No hay cotizaciones con estos filtros.</div>}
      </section>
      {detalle && <div className="cot-modal-backdrop" onClick={() => setDetalle(null)}>
        <article className="cot-modal" onClick={(e) => e.stopPropagation()}>
          <button className="cot-modal-close" onClick={() => setDetalle(null)}>×</button>
          <span className={`cot-status cot-status-${detalle.estado.toLowerCase()}`}>{estados[detalle.estado]}</span>
          <h2>{detalle.folio}</h2><p>{detalle.clienteNombre}</p>
          <div className="cot-detail-list">{detalle.detalles.map((d) => <div key={d.id}><span>{d.cantidad} × {d.sku} · {d.nombre}</span><strong>{moneda(d.importe)}</strong></div>)}</div>
          <div className="cot-modal-total"><span>Total</span><strong>{moneda(detalle.total)}</strong></div>
          <div className="cot-modal-buttons">
            <button onClick={() => descargarPdfCotizacion(detalle)}><Download size={17} /> PDF</button>
            <button className="cot-primary" onClick={() => compartirCotizacionWhatsApp(detalle)}><MessageCircle size={17} /> WhatsApp</button>
          </div>
        </article>
      </div>}
    </div>
  );
}
