import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import { obtenerInsumos } from "../services/insumos.js";
import { obtenerUnidadesMedida } from "../../unidades-medida/services/unidadMedidas.js";
import { guardarConjunto, obtenerConjuntos } from "../services/conjuntos.js";

const lista = (data) => Array.isArray(data) ? data : data?.content || [];
const nuevo = () => ({ nombre: "", descripcion: "", unidadMedidaId: "", componentes: [] });
const moneda = (valor) => Number(valor).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function ConjuntosDialog({ onClose, onSaved, onSelect, conjuntoId }) {
  const [conjuntos, setConjuntos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [insumos, setInsumos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const dialog = useRef(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerConjuntos(), obtenerUnidadesMedida()]).then(([items, uds]) => {
      if (!vigente) return;
      setConjuntos(items);
      setUnidades(lista(uds).filter((u) => u.estado !== false));
      if (conjuntoId) setForm(items.find((c) => String(c.id) === String(conjuntoId)) || null);
    }).catch((e) => { if (vigente) setError(e.message || "No se pudieron cargar los conjuntos"); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [conjuntoId]);

  useEffect(() => {
    let vigente = true;
    const timer = setTimeout(() => {
      setBuscando(true);
      obtenerInsumos({ activo: true, page: 0, size: 100, busqueda: busquedaInsumo })
        .then((data) => { if (vigente) setInsumos(lista(data)); })
        .catch((e) => { if (vigente) setError(e.message || "No se pudieron buscar los insumos"); })
        .finally(() => { if (vigente) setBuscando(false); });
    }, 250);
    return () => { vigente = false; clearTimeout(timer); };
  }, [busquedaInsumo]);

  useEffect(() => {
    const previo = document.activeElement;
    dialog.current?.focus();
    return () => previo?.focus?.();
  }, []);

  const guardar = async () => {
    setError("");
    if (!form.nombre.trim() || !form.unidadMedidaId || !form.componentes.length) {
      setError("Captura nombre, unidad y al menos un insumo."); return;
    }
    if (form.componentes.some((c) => !Number.isFinite(Number(c.cantidad)) || Number(c.cantidad) <= 0)) {
      setError("Cada componente debe tener una cantidad mayor a cero."); return;
    }
    setGuardando(true);
    try {
      const saved = await guardarConjunto({ ...form, nombre: form.nombre.trim(), unidadMedidaId: Number(form.unidadMedidaId),
        componentes: form.componentes.map((c) => ({ insumoId: c.insumoId, cantidad: Number(c.cantidad) })) });
      setConjuntos((actual) => [...actual.filter((c) => c.id !== saved.id), saved].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm(saved);
      onSaved?.(saved);
    } catch (e) { setError(e.message || "No se pudo guardar el conjunto"); }
    finally { setGuardando(false); }
  };

  const teclado = (event) => {
    if (event.key === "Escape" && !guardando) { event.stopPropagation(); onClose(); }
    if (event.key !== "Tab") return;
    const focusables = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
      .filter((el) => el.getClientRects().length);
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return createPortal(
    <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,.45)", zIndex: 1130 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="conjuntos-title" tabIndex={-1} ref={dialog} onKeyDown={teclado}>
          <div className="modal-header">
            <h5 className="modal-title" id="conjuntos-title">Conjuntos de insumos</h5>
            <button type="button" className="btn-close" aria-label="Cerrar conjuntos" onClick={onClose} disabled={guardando} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {cargando ? <p role="status">Cargando conjuntos...</p> : <div className="row g-3">
              <div className="col-md-4">
                <div className="d-flex gap-2 mb-3">
                  <input className="form-control" aria-label="Buscar conjuntos" placeholder="Buscar conjunto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                  <button type="button" className="btn btn-outline-primary" title="Nuevo conjunto" aria-label="Nuevo conjunto" disabled={guardando} onClick={() => { setForm(nuevo()); setError(""); }}><i className="bi bi-plus-lg" /></button>
                </div>
                <div className="list-group">
                  {conjuntos.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((c) =>
                    <button type="button" key={c.id} disabled={guardando} className={`list-group-item list-group-item-action ${form?.id === c.id ? "active" : ""}`} onClick={() => { setForm(c); setError(""); }}>
                      <span className="d-block fw-semibold text-break">{c.nombre}</span><small>{c.componentes.length} insumos</small>
                    </button>)}
                  {!conjuntos.length && <div className="text-muted">No hay conjuntos registrados.</div>}
                </div>
              </div>
              <div className="col-md-8">
                {form ? <fieldset disabled={guardando}>
                  <div className="row g-2 mb-3">
                    <label className="col-sm-8">Nombre<input className="form-control" maxLength={150} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
                    <label className="col-sm-4">Unidad<select className="form-select" value={form.unidadMedidaId} onChange={(e) => setForm({ ...form, unidadMedidaId: e.target.value })}><option value="">Seleccionar...</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre} ({u.simbolo})</option>)}</select></label>
                    <label className="col-12">Descripcion<textarea className="form-control" rows={2} maxLength={500} value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
                  </div>
                  <SearchableSelect label="Insumos del conjunto" value="" closeOnSelect={false} options={insumos.filter((i) => !form.componentes.some((c) => c.insumoId === i.id))}
                    onSearchChange={setBusquedaInsumo} loading={buscando} placeholder="Agregar insumo..." getOptionValue={(i) => i.id} getOptionLabel={(i) => `${i.codigo || ""} ${i.nombre}`}
                    onChange={(_id, item) => { if (item) setForm({ ...form, componentes: [...form.componentes, { insumoId: item.id, nombre: item.nombre, unidadMedida: item.unidadMedida?.simbolo, costoCotizacion: item.costoCotizacion, cantidad: 1 }] }); }} />
                  <div className="table-responsive mt-3"><table className="table table-sm align-middle" style={{ minWidth: 600 }}>
                    <thead><tr><th>Insumo</th><th style={{ width: 130 }}>Cantidad</th><th>Unidad</th><th className="text-end text-nowrap">Costo unitario</th><th className="text-end">Subtotal</th><th style={{ width: 44 }} /></tr></thead>
                    <tbody>{form.componentes.map((c) => <tr key={c.insumoId}>
                      <td className="text-break">{c.nombre}</td>
                      <td><input type="number" className="form-control form-control-sm" aria-label={`Cantidad de ${c.nombre}`} min="0.0001" step="0.0001" value={c.cantidad} onChange={(e) => setForm({ ...form, componentes: form.componentes.map((item) => item.insumoId === c.insumoId ? { ...item, cantidad: e.target.value } : item) })} /></td>
                      <td>{c.unidadMedida}</td>
                      <td className="text-end text-nowrap">{c.costoCotizacion > 0 ? moneda(c.costoCotizacion) : <span className="text-muted">Sin costo</span>}</td>
                      <td className="text-end text-nowrap fw-semibold">{c.costoCotizacion > 0 ? moneda(Number(c.cantidad || 0) * c.costoCotizacion) : <span className="text-muted fw-normal">Pendiente</span>}</td>
                      <td><button type="button" className="btn btn-sm btn-outline-danger" title={`Quitar ${c.nombre}`} aria-label={`Quitar ${c.nombre}`} onClick={() => setForm({ ...form, componentes: form.componentes.filter((item) => item.insumoId !== c.insumoId) })}><i className="bi bi-trash" /></button></td>
                    </tr>)}</tbody>
                  </table></div>
                  <div className="text-end mb-3">Costo por conjunto: <strong>{form.componentes.length && form.componentes.every((c) => c.costoCotizacion > 0) ? moneda(form.componentes.reduce((total, c) => total + Number(c.cantidad || 0) * c.costoCotizacion, 0)) : "Pendiente de costos"}</strong></div>
                  <div className="d-flex justify-content-end gap-2 flex-wrap">
                    {onSelect && form.id && <button type="button" className="btn btn-outline-primary" onClick={() => onSelect(conjuntos.find((c) => c.id === form.id))}><i className="bi bi-plus-lg me-1" />Asignar conjunto guardado</button>}
                    <button type="button" className="btn btn-primary" onClick={guardar}><i className="bi bi-floppy me-1" aria-hidden="true" />{guardando ? "Guardando..." : form.id ? "Guardar para todos los modelos" : "Crear conjunto"}</button>
                  </div>
                </fieldset> : <div className="text-muted">Ningun conjunto seleccionado.</div>}
              </div>
            </div>}
          </div>
        </div>
      </div>
    </div>, document.body
  );
}
