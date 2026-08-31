import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import { obtenerClientesActivos } from "../../clientes/services/clientes";
import { obtenerProductos } from "../../productos/services/productos";
import { actualizarOrdenProduccion, crearOrdenProduccion, obtenerOrdenProduccion } from "../services/ordenesProduccion";
import "./ordenesProduccion.css";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return respuesta?.content || respuesta?.data || respuesta?.items || [];
};

const getCodigoProducto = (producto) =>
  producto?.codigo
  || producto?.codigoProducto
  || producto?.codigo_producto
  || producto?.modeloCodigo
  || producto?.codigo_modelo
  || producto?.modelo?.codigo
  || "";

const getProductoLabel = (producto) => {
  const partes = [producto?.sku, getCodigoProducto(producto), producto?.nombre]
    .filter(Boolean);
  return [...new Set(partes)].join(" · ");
};

const getProductoSearchText = (producto) =>
  [
    producto?.sku,
    getCodigoProducto(producto),
    producto?.nombre,
    producto?.descripcion,
    producto?.descripcionCorta,
    producto?.modeloNombre,
    producto?.nombre_modelo,
    producto?.modelo?.nombre,
    producto?.nivelNombre,
    producto?.nombre_nivel,
    producto?.categoriaNombre,
    producto?.materialNombre,
    producto?.nombre_material,
    producto?.materialCodigo,
    producto?.codigo_material,
    producto?.colorNombre,
    producto?.nombre_color,
    producto?.colorCodigo,
    producto?.codigo_color
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("es-MX");

const combinarProductos = (actuales, nuevos) => {
  const mapa = new Map();
  [...actuales, ...nuevos].forEach((producto) => {
    if (producto?.id) mapa.set(String(producto.id), producto);
  });
  return [...mapa.values()];
};

export default function OrdenProduccionFormPage() {
  const { id } = useParams(); const navigate = useNavigate(); const editando = Boolean(id);
  const [clientes,setClientes]=useState([]); const [productos,setProductos]=useState([]);
  const [form,setForm]=useState({ origen:"MANUAL",clienteId:"",fechaInicioProgramada:"",fechaCompromiso:"",observaciones:"",partidas:[] });
  const [productoSeleccionado,setProductoSeleccionado]=useState("");
  const [guardando,setGuardando]=useState(false); const [error,setError]=useState("");
  const [cargandoProductos,setCargandoProductos]=useState(false);
  const busquedaProductosRef=useRef(0);
  const busquedaProductosTimerRef=useRef(null);

  const productosOrdenados = useMemo(
    () => [...productos].sort((a,b)=>getProductoLabel(a).localeCompare(getProductoLabel(b),"es",{numeric:true,sensitivity:"base"})),
    [productos]
  );

  const productosPorId = useMemo(
    () => new Map(productos.map((producto)=>[String(producto.id),producto])),
    [productos]
  );

  const buscarProductosEnSelector = (termino) => {
    const busqueda = termino.trim();
    const consultaId = busquedaProductosRef.current + 1;
    busquedaProductosRef.current = consultaId;

    window.clearTimeout(busquedaProductosTimerRef.current);
    busquedaProductosTimerRef.current = window.setTimeout(async () => {
      try {
        setCargandoProductos(true);
        const data = await obtenerProductos({ activo:true, busqueda, page:0, size:100, sortBy:"sku", direction:"asc" });
        if (busquedaProductosRef.current === consultaId) {
          setProductos((actuales)=>combinarProductos(actuales,getLista(data)));
        }
      } catch (e) {
        setError(e.message || "No se pudieron buscar productos.");
      } finally {
        if (busquedaProductosRef.current === consultaId) setCargandoProductos(false);
      }
    }, 250);
  };

  useEffect(()=>{
    setCargandoProductos(true);
    obtenerProductos({ activo:true, page:0, size:100, sortBy:"sku", direction:"asc" }).then(p=>setProductos(getLista(p))).catch(e=>setError(e.message)).finally(()=>setCargandoProductos(false));
    obtenerClientesActivos().then(c=>setClientes(c.content||c||[])).catch(()=>setClientes([]));
  },[]);
  useEffect(()=>()=>window.clearTimeout(busquedaProductosTimerRef.current),[]);
  useEffect(()=>{if(!id)return;obtenerOrdenProduccion(id).then(o=>{setForm({origen:o.origen,clienteId:o.clienteId||"",fechaInicioProgramada:o.fechaInicioProgramada||"",fechaCompromiso:o.fechaCompromiso||"",observaciones:o.observaciones||"",partidas:o.partidas.map(p=>({productoId:p.productoId,cantidad:p.cantidadPlaneada,sku:p.sku,nombre:p.nombre}))});setProductos(actuales=>combinarProductos(actuales,o.partidas.map(p=>({id:p.productoId,sku:p.sku,nombre:p.nombre}))));}).catch(e=>setError(e.message));},[id]);
  const update=(key,value)=>setForm(x=>({...x,[key]:value}));
  const updatePartida=(index,key,value)=>setForm(x=>({...x,partidas:x.partidas.map((p,i)=>i===index?{...p,[key]:value}:p)}));
  const getProductoPartida=(partida)=>productosPorId.get(String(partida.productoId))||partida;
  const agregarProductoPartida=(value, producto)=>{
    if(!value)return;
    setProductoSeleccionado("");
    setForm((actual)=>{
      const existente=actual.partidas.findIndex((partida)=>String(partida.productoId)===String(value));
      if(existente>=0){
        return {...actual,partidas:actual.partidas.map((partida,index)=>index===existente?{...partida,cantidad:Number(partida.cantidad||0)+1}:partida)};
      }
      return {...actual,partidas:[...actual.partidas,{productoId:value,cantidad:1,sku:producto?.sku,nombre:producto?.nombre,codigo:getCodigoProducto(producto)}]};
    });
  };
  const guardar=async(e)=>{e.preventDefault();try{setGuardando(true);setError("");if(form.partidas.length===0){setError("Agrega al menos un producto a la orden.");return;}if(form.partidas.some(p=>!p.productoId)){setError("Selecciona un producto en cada partida.");return;}if(form.partidas.some(p=>Number(p.cantidad)<1)){setError("La cantidad debe ser mayor o igual a 1 en cada producto.");return;}const payload={...form,clienteId:form.clienteId?Number(form.clienteId):null,partidas:form.partidas.map(p=>({productoId:Number(p.productoId),cantidad:Number(p.cantidad)}))};const result=editando?await actualizarOrdenProduccion(id,payload):await crearOrdenProduccion(payload);navigate(`/ordenes-produccion/${result.id}`);}catch(err){setError(err.message||"No fue posible guardar la orden");}finally{setGuardando(false);}};
  return <div className="op-page"><button className="btn btn-link px-0" onClick={()=>navigate("/ordenes-produccion")}>← Volver</button><header className="op-header"><div><h1>{editando?"Editar orden":"Nueva orden de producción"}</h1><p>Captura productos y cantidades; la BOM se congelará al liberar.</p></div></header>
    {error&&<div className="alert alert-danger">{error}</div>}<form className="op-card p-4" onSubmit={guardar}>
      <div className="row g-3"><div className="col-md-6"><label className="form-label">Cliente (opcional)</label><select disabled={form.origen==='COTIZACION'} className="form-select" value={form.clienteId} onChange={e=>update("clienteId",e.target.value)}><option value="">Sin cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombreComercial||c.razonSocial||c.nombre}</option>)}</select></div>
      <div className="col-md-3"><label className="form-label">Inicio programado</label><input className="form-control" type="date" value={form.fechaInicioProgramada} onChange={e=>update("fechaInicioProgramada",e.target.value)}/></div>
      <div className="col-md-3"><label className="form-label">Fecha compromiso</label><input className="form-control" type="date" value={form.fechaCompromiso} onChange={e=>update("fechaCompromiso",e.target.value)}/></div></div>
      <hr/><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Productos</h5></div>
      {form.origen==='COTIZACION'&&<div className="alert alert-info py-2">Las partidas provienen de la cotización y no se pueden modificar.</div>}
      {form.origen==='MANUAL'&&(
        <div className="op-product-picker mb-3">
          <SearchableSelect
            label="Producto"
            value={productoSeleccionado}
            options={productosOrdenados}
            onChange={agregarProductoPartida}
            onSearchChange={buscarProductosEnSelector}
            placeholder="Busca y selecciona un producto"
            searchPlaceholder="Busca por SKU, código o nombre"
            loading={cargandoProductos}
            emptyText="No hay productos que coincidan"
            getOptionLabel={getProductoLabel}
            getOptionSearchText={getProductoSearchText}
            renderOptionLabel={(producto)=>(
              <span className="op-product-option">
                <strong>{producto.sku || getCodigoProducto(producto) || "Sin código"}</strong>
                <span>{producto.nombre || "Producto sin nombre"}</span>
              </span>
            )}
          />
        </div>
      )}
      <div className="op-products-list">
        {form.partidas.length===0?(
          <div className="op-empty py-4">Selecciona productos para agregarlos a la orden.</div>
        ):form.partidas.map((p,index)=>{
          const producto=getProductoPartida(p);
          return (
            <div className="op-product-row" key={`${p.productoId}-${index}`}>
              <div className="op-product-row-info">
                <strong>{producto.sku || getCodigoProducto(producto) || "Sin código"}</strong>
                <span>{producto.nombre || "Producto sin nombre"}</span>
              </div>
              <div className="op-product-row-quantity">
                <label className="form-label">Cantidad</label>
                <input required disabled={form.origen==='COTIZACION'} min="1" step="1" className="form-control" type="number" value={p.cantidad} onChange={e=>updatePartida(index,"cantidad",e.target.value)}/>
              </div>
              {form.origen==='MANUAL'&&<button type="button" className="btn btn-outline-danger op-product-row-delete" onClick={()=>update("partidas",form.partidas.filter((_,i)=>i!==index))} aria-label="Eliminar producto"><Trash2 size={17}/></button>}
            </div>
          );
        })}
      </div>
      <div className="mt-3"><label className="form-label">Observaciones</label><textarea className="form-control" rows="3" maxLength="1000" value={form.observaciones} onChange={e=>update("observaciones",e.target.value)}/></div>
      <div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary" onClick={()=>navigate("/ordenes-produccion")}>Cancelar</button><button className="btn btn-primary" disabled={guardando}>{guardando?"Guardando…":"Guardar borrador"}</button></div>
    </form></div>;
}
