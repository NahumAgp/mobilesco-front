import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, LogIn, LogOut, UserRound } from "lucide-react";
import { rhGet, rhPost } from "../services/rh";
import "./rh.css";

const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fecha = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-MX") : "—";
const fechaHora = value => value ? new Date(value).toLocaleString("es-MX") : "—";

export default function MiRhPage() {
  const [datos, setDatos] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState({ tipoId: "", desde: hoy(), hasta: hoy(), motivo: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cargar = useCallback(async () => {
    try {
      const [personal, catalogo] = await Promise.all([rhGet("/me"), rhGet("/me/tipos-ausencia")]);
      setDatos(personal); setTipos(catalogo); setError("");
    } catch (e) { setError(e.message || "No se pudo cargar tu información de RH"); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const ejecutar = async (accion) => {
    try { setBusy(true); setError(""); await accion(); await cargar(); }
    catch (e) { setError(e.message || "No se pudo completar la operación"); }
    finally { setBusy(false); }
  };
  const solicitar = (e) => { e.preventDefault(); ejecutar(async () => {
    await rhPost("/me/ausencias", { ...form, tipoId: Number(form.tipoId) });
    setForm({ tipoId: "", desde: hoy(), hasta: hoy(), motivo: "" });
  }); };
  const abierta = datos?.asistencias?.find(a => !a.salida);
  return <div className="rh-page">
    <header className="rh-hero"><div className="rh-kicker">PERSONAL · AUTOGESTIÓN</div><h1>Mi RH</h1><p>Consulta tus datos laborales, registra asistencia y solicita ausencias.</p></header>
    {error && <div className="alert alert-warning">{error}</div>}
    {!datos ? <div className="rh-panel">{error ? "Tu cuenta debe estar vinculada a un empleado para usar Mi RH." : "Cargando…"}</div> : <>
      <div className="rh-grid rh-grid-three">
        <section className="rh-panel"><div className="rh-panel-title"><UserRound size={20}/> Expediente</div><h2>{datos.nombre}</h2><p>{datos.expediente?.puesto || "Puesto sin registrar"}</p><div className="rh-meta">Ingreso: {fecha(datos.expediente?.fechaIngreso)}</div><div className="rh-meta">Jefatura: {datos.expediente?.jefeId ? `Empleado #${datos.expediente.jefeId}` : "Sin asignar"}</div></section>
        <section className="rh-panel"><div className="rh-panel-title"><Clock3 size={20}/> Asistencia</div><h2>{abierta ? "Turno en curso" : "Fuera de turno"}</h2><p>{abierta ? `Entrada: ${fechaHora(abierta.entrada)}` : "Registra tu entrada al comenzar la jornada."}</p><button className="rh-primary" disabled={busy} onClick={() => ejecutar(() => rhPost(abierta ? "/me/asistencia/salida" : "/me/asistencia/entrada"))}>{abierta ? <LogOut size={17}/> : <LogIn size={17}/>} {abierta ? "Registrar salida" : "Registrar entrada"}</button></section>
        <section className="rh-panel"><div className="rh-panel-title"><CalendarDays size={20}/> Saldos</div>{datos.saldos?.map(s => <div className="rh-balance" key={s.tipoId}><span>{s.nombre}</span><strong>{s.requiereSaldo ? `${s.diasDisponibles} días` : "No requiere saldo"}</strong></div>)}</section>
      </div>
      <div className="rh-grid rh-grid-two">
        <section className="rh-panel"><div className="rh-panel-title">Solicitar ausencia</div><form onSubmit={solicitar} className="rh-form"><label>Tipo<select required value={form.tipoId} onChange={e => setForm({ ...form, tipoId: e.target.value })}><option value="">Selecciona</option>{tipos.filter(t => t.activo).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label><div className="rh-fields"><label>Desde<input type="date" required value={form.desde} onChange={e => setForm({ ...form, desde: e.target.value })}/></label><label>Hasta<input type="date" required value={form.hasta} onChange={e => setForm({ ...form, hasta: e.target.value })}/></label></div><label>Motivo<textarea value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} maxLength={500}/></label><small>{tipos.find(t => String(t.id) === form.tipoId)?.diasNaturales ? "Se cuentan todos los días del periodo." : "Se cuentan lunes a viernes y se excluyen los feriados configurados."}</small><button className="rh-primary" disabled={busy}>Enviar solicitud</button></form></section>
        <section className="rh-panel"><div className="rh-panel-title">Mis solicitudes</div>{!datos.ausencias?.length ? <p className="rh-empty">Aún no hay solicitudes.</p> : <div className="rh-list">{datos.ausencias.map(a => <div className="rh-list-row" key={a.id}><div><strong>{tipos.find(t => t.id === a.tipoId)?.nombre || "Ausencia"}</strong><small>{fecha(a.desde)} – {fecha(a.hasta)} · {a.dias} días</small></div><div><span className={`rh-status rh-status-${a.estado.toLowerCase()}`}>{a.estado}</span>{a.estado === "PENDIENTE" && <button className="rh-link" disabled={busy} onClick={() => ejecutar(() => rhPost(`/me/ausencias/${a.id}/cancelar`))}>Cancelar</button>}</div></div>)}</div>}</section>
      </div>
      <div className="rh-grid rh-grid-two"><section className="rh-panel"><div className="rh-panel-title">Contratos</div>{datos.contratos?.length ? datos.contratos.map(c => <div className="rh-list-row" key={c.id}><div><strong>{c.tipo}</strong><small>{fecha(c.fechaInicio)} – {fecha(c.fechaFin)}</small></div><span className={`rh-status rh-status-${c.estado.toLowerCase()}`}>{c.estado}</span></div>) : <p className="rh-empty">No hay contratos registrados.</p>}</section><section className="rh-panel"><div className="rh-panel-title">Últimas asistencias y evaluaciones</div>{datos.asistencias?.slice(0, 5).map(a => <div className="rh-list-row" key={a.id}><span>{fechaHora(a.entrada)}</span><span>{fechaHora(a.salida)}</span></div>)}{datos.evaluaciones?.map(e => <div className="rh-list-row" key={`ev-${e.id}`}><span>Evaluación {fecha(e.periodoDesde)} – {fecha(e.periodoHasta)}</span><strong>{e.calificacion}/5</strong></div>)}</section></div>
    </>}
  </div>;
}
