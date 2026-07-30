import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, FileText, PackageSearch, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUser, hasPermission } from "../../auth/services/authService";
import { obtenerResumenTablero } from "../services/tablero";
import "./tablero.css";

const PERIODOS = [
  ["MES", "Este mes"],
  ["ULTIMOS_30_DIAS", "Últimos 30 días"],
  ["TRIMESTRE", "Últimos 90 días"],
  ["ANIO", "Este año"],
];

const ESTADOS = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const moneda = (valor) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
    .format(Number(valor) || 0);

const relativo = (valor) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  const minutos = Math.round((fecha.getTime() - Date.now()) / 60000);
  const formato = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
  if (Math.abs(minutos) < 60) return formato.format(minutos, "minute");
  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return formato.format(horas, "hour");
  return formato.format(Math.round(horas / 24), "day");
};

function Cargando() {
  return (
    <div className="tab-loading" aria-label="Cargando tablero">
      <div className="tab-stats">{[0, 1, 2, 3].map((item) => <div className="tab-skeleton" key={item} />)}</div>
      <div className="tab-content"><div className="tab-skeleton tab-skeleton-large" /><div className="tab-skeleton tab-skeleton-large" /></div>
    </div>
  );
}

export default function Tablero() {
  const navigate = useNavigate();
  const user = getUser();
  const puedeVerCotizaciones = hasPermission(user, "VIEW_QUOTES");
  const puedeVerInventario = hasPermission(user, "VIEW_INVENTORY");
  const [periodo, setPeriodo] = useState("MES");
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setResumen(await obtenerResumenTablero(periodo));
      setError("");
    } catch (e) {
      setError(e.message || "No fue posible cargar el tablero.");
    } finally {
      setCargando(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirAlerta = (alerta) => {
    if (alerta.tipo === "STOCK_BAJO" && puedeVerInventario) navigate(alerta.ruta);
    if (alerta.tipo !== "STOCK_BAJO" && puedeVerCotizaciones) navigate(alerta.ruta);
  };

  const variacion = resumen?.indicadores?.variacionMontoPorcentaje;
  const stats = resumen ? [
    {
      titulo: "Cotizaciones activas",
      valor: resumen.indicadores.cotizacionesActivas,
      nota: "Borradores, pendientes y enviadas",
      color: "primary",
    },
    {
      titulo: "Cotizaciones del periodo",
      valor: resumen.indicadores.cotizacionesPeriodo,
      nota: `${resumen.desde} al ${resumen.hasta}`,
      color: "warning",
    },
    {
      titulo: "Monto cotizado",
      valor: moneda(resumen.indicadores.montoCotizado),
      nota: variacion == null ? "Sin periodo anterior comparable" : `${variacion >= 0 ? "+" : ""}${variacion}% vs periodo anterior`,
      color: "success",
    },
    {
      titulo: "Tasa de cierre",
      valor: `${resumen.indicadores.tasaCierrePorcentaje}%`,
      nota: "Aceptadas o completadas sobre decisiones",
      color: "secondary",
    },
  ] : [];

  return (
    <div className="tab-page">
      <header className="tab-header">
        <div>
          <h1>Tablero principal</h1>
          <p>Resumen actualizado de actividad comercial y alertas operativas.</p>
        </div>
        <div className="tab-header-actions">
          <label>
            <span>Periodo</span>
            <select value={periodo} onChange={(event) => setPeriodo(event.target.value)} disabled={cargando}>
              {PERIODOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {puedeVerCotizaciones && (
            <button className="tab-primary" onClick={() => navigate("/cotizaciones/nueva")}>
              <Plus size={18} /> Nueva cotización
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="tab-error" role="alert">
          <AlertCircle size={20} />
          <div><strong>No pudimos actualizar el tablero</strong><span>{error}</span></div>
          <button onClick={cargar}><RefreshCw size={16} /> Reintentar</button>
        </div>
      )}

      {cargando && !resumen ? <Cargando /> : (
        <>
          <section className={`tab-stats ${cargando ? "tab-refreshing" : ""}`} aria-label="Indicadores">
            {stats.map((stat) => (
              <article className="tab-card tab-stat" key={stat.titulo}>
                <div><span>{stat.titulo}</span><i className={`tab-dot tab-dot-${stat.color}`} /></div>
                <strong>{stat.valor}</strong>
                <small>{stat.nota}</small>
              </article>
            ))}
          </section>

          <div className={`tab-content ${cargando ? "tab-refreshing" : ""}`}>
            <section className="tab-card tab-recent">
              <div className="tab-section-title">
                <div><h2>Cotizaciones recientes</h2><p>Últimos movimientos registrados en el sistema.</p></div>
                {puedeVerCotizaciones && <button onClick={() => navigate("/cotizaciones")}>Ver todas <ArrowRight size={16} /></button>}
              </div>
              {!resumen?.cotizacionesRecientes?.length ? (
                <div className="tab-empty"><FileText size={30} /><strong>Aún no hay cotizaciones</strong><span>Los nuevos registros aparecerán aquí.</span></div>
              ) : resumen.cotizacionesRecientes.map((cotizacion) => (
                <button
                  type="button"
                  className="tab-quote"
                  key={cotizacion.id}
                  disabled={!puedeVerCotizaciones}
                  onClick={() => navigate(`/cotizaciones?cotizacion=${cotizacion.id}`)}
                >
                  <span className="tab-folio">{cotizacion.folio}</span>
                  <span className="tab-quote-main">
                    <strong>{cotizacion.cliente}</strong>
                    <small>{cotizacion.partidas} partida(s) · {cotizacion.unidades} unidad(es)</small>
                  </span>
                  <span className="tab-quote-total"><strong>{moneda(cotizacion.total)}</strong><small>{relativo(cotizacion.fechaRegistro)}</small></span>
                  <span className={`tab-status tab-status-${cotizacion.estado.toLowerCase()}`}>{ESTADOS[cotizacion.estado]}</span>
                </button>
              ))}
            </section>

            <aside className="tab-card tab-alerts">
              <div className="tab-section-title"><div><h2>Alertas del sistema</h2><p>Acciones basadas en datos actuales.</p></div></div>
              {!resumen?.alertas?.length ? (
                <div className="tab-empty"><PackageSearch size={30} /><strong>Todo en orden</strong><span>No hay alertas pendientes.</span></div>
              ) : resumen.alertas.map((alerta) => {
                const navegable = alerta.tipo === "STOCK_BAJO" ? puedeVerInventario : puedeVerCotizaciones;
                return (
                  <article className={`tab-alert tab-alert-${alerta.severidad}`} key={alerta.tipo}>
                    <div><strong>{alerta.titulo}</strong><span>{alerta.cantidad}</span></div>
                    <p>{alerta.descripcion}</p>
                    {navegable && <button onClick={() => abrirAlerta(alerta)}>Revisar registros <ArrowRight size={15} /></button>}
                  </article>
                );
              })}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
