import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Plus, Search, TriangleAlert } from "lucide-react";
import { getUser, hasPermission } from "../../auth/services/authService";
import { listarOrdenesProduccion } from "../services/ordenesProduccion";
import "./ordenesProduccion.css";

const ESTADOS = { BORRADOR: "Borrador", LIBERADA: "Liberada", EN_PROCESO: "En proceso", TERMINADA: "Terminada", CANCELADA: "Cancelada" };

export default function OrdenesProduccionPage() {
  const navigate = useNavigate();
  const puedeCrear = hasPermission(getUser(), "ACTION_PRODUCTION_ORDERS_CREATE");
  const [items, setItems] = useState([]);
  const [filtros, setFiltros] = useState({ busqueda: "", estado: "", origen: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setCargando(true);
        const data = await listarOrdenesProduccion({ ...filtros, size: 50 });
        setItems(data.content || []);
        setError("");
      } catch (err) { setError(err.message || "No fue posible cargar las órdenes"); }
      finally { setCargando(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [filtros]);

  const set = (key, value) => setFiltros((current) => ({ ...current, [key]: value }));
  return <div className="op-page">
    <header className="op-header"><div><h1><Factory size={30} /> Órdenes de producción</h1><p>Planea materiales, operaciones y avances de fabricación.</p></div>
      {puedeCrear && <button className="btn btn-primary" onClick={() => navigate("/ordenes-produccion/nueva")}><Plus size={18} /> Nueva orden</button>}
    </header>
    <section className="op-card op-filters">
      <label className="op-search"><Search size={18} /><input value={filtros.busqueda} onChange={(e) => set("busqueda", e.target.value)} placeholder="Buscar folio, producto o cliente" /></label>
      <select value={filtros.estado} onChange={(e) => set("estado", e.target.value)}><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select value={filtros.origen} onChange={(e) => set("origen", e.target.value)}><option value="">Todos los orígenes</option><option value="MANUAL">Manual</option><option value="COTIZACION">Cotización</option></select>
    </section>
    {error && <div className="alert alert-danger">{error}</div>}
    <section className="op-card table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Folio</th><th>Origen</th><th>Cliente</th><th>Inicio</th><th>Compromiso</th><th>Avance</th><th>Estado</th></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id} className="op-row" onClick={() => navigate(`/ordenes-produccion/${item.id}`)}>
        <td><strong>{item.folio}</strong>{item.tieneFaltantes && <TriangleAlert className="text-warning ms-2" size={17} aria-label="Tiene faltantes" />}</td>
        <td>{item.origen === "COTIZACION" ? "Cotización" : "Manual"}</td><td>{item.clienteNombre || "Sin cliente"}</td><td>{item.fechaInicioProgramada || "—"}</td><td>{item.fechaCompromiso || "—"}</td>
        <td><div className="progress" title={`${item.porcentajeAvance || 0}%`}><div className="progress-bar" style={{ width: `${Math.min(100, item.porcentajeAvance || 0)}%` }} /></div><small>{item.porcentajeAvance || 0}%</small></td>
        <td><span className={`op-status op-status-${item.estado.toLowerCase()}`}>{ESTADOS[item.estado]}</span></td>
      </tr>)}</tbody></table>
      {cargando && <div className="op-empty">Cargando órdenes…</div>}{!cargando && !items.length && <div className="op-empty">No hay órdenes con estos filtros.</div>}
    </section>
  </div>;
}
