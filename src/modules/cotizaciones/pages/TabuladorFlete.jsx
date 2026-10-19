import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { guardarTabuladorFlete, obtenerTabuladorFlete } from "../services/cotizaciones";
import "./cotizaciones.css";
import "./tabulador-flete.css";

export default function TabuladorFlete() {
  const navigate = useNavigate();
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    obtenerTabuladorFlete().then((data) => setFilas(data || []))
      .catch((e) => setError(e.message || "No se pudo cargar el tabulador."))
      .finally(() => setCargando(false));
  }, []);

  const cambiar = (indice, campo, valor) => {
    setFilas((actual) => actual.map((fila, i) => i === indice ? { ...fila, [campo]: valor } : fila));
    setMensaje("");
  };

  const guardar = async (event) => {
    event.preventDefault();
    const datos = filas.map((fila) => ({ hastaKm: Number(fila.hastaKm), precio: Number(fila.precio) }));
    if (datos.some((fila) => !Number.isFinite(fila.hastaKm) || fila.hastaKm <= 0 ||
      !Number.isFinite(fila.precio) || fila.precio < 0 ||
      Math.abs(Math.round(fila.hastaKm * 100) - fila.hastaKm * 100) > 1e-7 ||
      Math.abs(Math.round(fila.precio * 100) - fila.precio * 100) > 1e-7) ||
      datos.some((fila, i) => i > 0 && fila.hastaKm <= datos[i - 1].hastaKm)) {
      setError("Captura límites crecientes y precios válidos con hasta dos decimales.");
      return;
    }
    setGuardando(true); setError(""); setMensaje("");
    try {
      setFilas(await guardarTabuladorFlete(datos));
      setMensaje("Tabulador guardado.");
    } catch (e) {
      setError(e.message || "No se pudo guardar el tabulador.");
    } finally {
      setGuardando(false);
    }
  };

  return <div className="cot-page cot-tabulador-page">
    <header className="cot-header"><div>
      <button className="cot-back" onClick={() => navigate("/cotizaciones")}><ArrowLeft size={18} /> Cotizaciones</button>
      <h1>Tabulador de flete</h1>
      <p>Captura el precio fijo para cada límite de distancia. El primer rango va de 0 km al primer límite; los siguientes comienzan justo después del límite anterior.</p>
    </div></header>
    {error && <div className="cot-alert cot-alert-error" role="alert">{error}</div>}
    {mensaje && <div className="cot-alert cot-alert-success" role="status">{mensaje}</div>}
    <form className="cot-card cot-tabulador" onSubmit={guardar}>
      {cargando ? <p>Cargando tabulador...</p> : <>
        <div className="cot-tabulador-heading"><strong>Hasta (km)</strong><strong>Precio (MXN)</strong></div>
        {filas.map((fila, indice) => <div className="cot-tabulador-row" key={indice}>
          <input type="number" min="0.01" step="0.01" required aria-label={`Límite de kilómetros del rango ${indice + 1}`} value={fila.hastaKm} onChange={(e) => cambiar(indice, "hastaKm", e.target.value)} />
          <input type="number" min="0" step="0.01" required aria-label={`Precio del rango ${indice + 1}`} value={fila.precio} onChange={(e) => cambiar(indice, "precio", e.target.value)} />
          <button type="button" aria-label={`Eliminar rango ${indice + 1}`} onClick={() => setFilas((actual) => actual.filter((_, i) => i !== indice))}><Trash2 size={18} /></button>
        </div>)}
        {!filas.length && <p>Agrega el primer rango para habilitar el cálculo automático.</p>}
        <div className="cot-tabulador-actions">
          <button type="button" onClick={() => setFilas((actual) => [...actual, { hastaKm: "", precio: "" }])}><Plus size={18} /> Agregar rango</button>
          <button className="cot-primary" type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar tabulador"}</button>
        </div>
      </>}
    </form>
  </div>;
}
