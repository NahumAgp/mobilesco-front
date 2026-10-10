import { useEffect, useState } from "react";
import { Boxes, Search } from "lucide-react";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import usePersistedState from "../../../hooks/usePersistedState";
import { listarProductoTerminado } from "../services/productoTerminado";
import "../../pedidos-venta/pages/pedidosVenta.css";

const cantidad = (value) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(value || 0);

export default function ProductoTerminadoPage() {
  const [busqueda, setBusqueda] = usePersistedState("producto-terminado:busqueda", "");
  const texto = useDebouncedValue(busqueda, 350);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let activa = true;
    setCargando(true);
    listarProductoTerminado({ busqueda: texto, size: 100 }).then((data) => { if (activa) { setItems(data.content || []); setError(""); } })
      .catch((e) => activa && setError(e.message || "No fue posible cargar el inventario"))
      .finally(() => activa && setCargando(false));
    return () => { activa = false; };
  }, [texto]);
  const totales = items.reduce((a, i) => ({ existencia: a.existencia + Number(i.existencia || 0), reservado: a.reservado + Number(i.reservado || 0), disponible: a.disponible + Number(i.disponible || 0) }), { existencia: 0, reservado: 0, disponible: 0 });
  return <div className="pv-page">
    <header className="pv-header"><div><h1><Boxes size={30} /> Producto terminado</h1><p>Existencias generadas por producción y reservas comprometidas con pedidos.</p></div></header>
    <section className="pv-summary"><article><span>Existencia</span><strong>{cantidad(totales.existencia)}</strong></article><article><span>Reservado</span><strong>{cantidad(totales.reservado)}</strong></article><article><span>Disponible</span><strong>{cantidad(totales.disponible)}</strong></article></section>
    <section className="pv-card pv-filters"><label className="pv-search"><Search size={18} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar SKU o producto" /></label></section>
    {error && <div className="alert alert-danger">{error}</div>}
    <section className="pv-card table-responsive"><table className="table align-middle mb-0"><thead><tr><th>SKU</th><th>Producto</th><th>Existencia</th><th>Reservado</th><th>Disponible</th><th>Actualización</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.sku}</strong></td><td>{item.nombre}</td><td>{cantidad(item.existencia)}</td><td>{cantidad(item.reservado)}</td><td><strong>{cantidad(item.disponible)}</strong></td><td>{item.fechaActualizacion ? new Date(item.fechaActualizacion).toLocaleString("es-MX") : "—"}</td></tr>)}</tbody></table>{!cargando && !items.length && <div className="pv-empty">Todavía no hay producto terminado registrado.</div>}</section>
  </div>;
}
