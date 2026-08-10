import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { obtenerClientesActivos } from "../../clientes/services/clientes";
import { obtenerProductos } from "../../productos/services/productos";
import { actualizarOrdenProduccion, crearOrdenProduccion, obtenerOrdenProduccion } from "../services/ordenesProduccion";
import "./ordenesProduccion.css";

export default function OrdenProduccionFormPage() {
  const { id } = useParams(); const navigate = useNavigate(); const editando = Boolean(id);
  const [clientes,setClientes]=useState([]); const [productos,setProductos]=useState([]);
  const [form,setForm]=useState({ origen:"MANUAL",clienteId:"",fechaInicioProgramada:"",fechaCompromiso:"",observaciones:"",partidas:[{productoId:"",cantidad:1}] });
  const [guardando,setGuardando]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{
    obtenerProductos({ activo:true, page:0, size:100 }).then(p=>setProductos(p.content||p||[])).catch(e=>setError(e.message));
    obtenerClientesActivos().then(c=>setClientes(c.content||c||[])).catch(()=>setClientes([]));
  },[]);
  useEffect(()=>{if(!id)return;obtenerOrdenProduccion(id).then(o=>setForm({origen:o.origen,clienteId:o.clienteId||"",fechaInicioProgramada:o.fechaInicioProgramada||"",fechaCompromiso:o.fechaCompromiso||"",observaciones:o.observaciones||"",partidas:o.partidas.map(p=>({productoId:p.productoId,cantidad:p.cantidadPlaneada,sku:p.sku,nombre:p.nombre}))})).catch(e=>setError(e.message));},[id]);
  const update=(key,value)=>setForm(x=>({...x,[key]:value}));
  const updatePartida=(index,key,value)=>setForm(x=>({...x,partidas:x.partidas.map((p,i)=>i===index?{...p,[key]:value}:p)}));
  const guardar=async(e)=>{e.preventDefault();try{setGuardando(true);setError("");const payload={...form,clienteId:form.clienteId?Number(form.clienteId):null,partidas:form.partidas.map(p=>({productoId:Number(p.productoId),cantidad:Number(p.cantidad)}))};const result=editando?await actualizarOrdenProduccion(id,payload):await crearOrdenProduccion(payload);navigate(`/ordenes-produccion/${result.id}`);}catch(err){setError(err.message||"No fue posible guardar la orden");}finally{setGuardando(false);}};
  return <div className="op-page"><button className="btn btn-link px-0" onClick={()=>navigate("/ordenes-produccion")}>← Volver</button><header className="op-header"><div><h1>{editando?"Editar orden":"Nueva orden de producción"}</h1><p>Captura productos y cantidades; la BOM se congelará al liberar.</p></div></header>
    {error&&<div className="alert alert-danger">{error}</div>}<form className="op-card p-4" onSubmit={guardar}>
      <div className="row g-3"><div className="col-md-6"><label className="form-label">Cliente (opcional)</label><select disabled={form.origen==='COTIZACION'} className="form-select" value={form.clienteId} onChange={e=>update("clienteId",e.target.value)}><option value="">Sin cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombreComercial||c.razonSocial||c.nombre}</option>)}</select></div>
      <div className="col-md-3"><label className="form-label">Inicio programado</label><input className="form-control" type="date" value={form.fechaInicioProgramada} onChange={e=>update("fechaInicioProgramada",e.target.value)}/></div>
      <div className="col-md-3"><label className="form-label">Fecha compromiso</label><input className="form-control" type="date" value={form.fechaCompromiso} onChange={e=>update("fechaCompromiso",e.target.value)}/></div></div>
      <hr/><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Productos</h5>{form.origen==='MANUAL'&&<button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>update("partidas",[...form.partidas,{productoId:"",cantidad:1}])}><Plus size={16}/> Agregar</button>}</div>
      {form.origen==='COTIZACION'&&<div className="alert alert-info py-2">Las partidas provienen de la cotización y no se pueden modificar.</div>}
      {form.partidas.map((p,index)=><div className="row g-2 align-items-end mb-2" key={index}><div className="col-md-8"><label className="form-label">Producto</label>{form.origen==='COTIZACION'?<input className="form-control" disabled value={`${p.sku} · ${p.nombre}`}/>:<select required className="form-select" value={p.productoId} onChange={e=>updatePartida(index,"productoId",e.target.value)}><option value="">Selecciona un producto</option>{productos.map(x=><option key={x.id} value={x.id}>{x.sku} · {x.nombre}</option>)}</select>}</div><div className="col-md-3"><label className="form-label">Cantidad</label><input required disabled={form.origen==='COTIZACION'} min="1" step="1" className="form-control" type="number" value={p.cantidad} onChange={e=>updatePartida(index,"cantidad",e.target.value)}/></div><div className="col-md-1">{form.origen==='MANUAL'&&<button type="button" className="btn btn-outline-danger" disabled={form.partidas.length===1} onClick={()=>update("partidas",form.partidas.filter((_,i)=>i!==index))}><Trash2 size={17}/></button>}</div></div>)}
      <div className="mt-3"><label className="form-label">Observaciones</label><textarea className="form-control" rows="3" maxLength="1000" value={form.observaciones} onChange={e=>update("observaciones",e.target.value)}/></div>
      <div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary" onClick={()=>navigate("/ordenes-produccion")}>Cancelar</button><button className="btn btn-primary" disabled={guardando}>{guardando?"Guardando…":"Guardar borrador"}</button></div>
    </form></div>;
}
