import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  buscarInsumosRequisicion,
  crearRequisicion,
  obtenerSugerenciasRequisicion,
} from "../services/requisiciones";
import InsumoForm from "../../../insumos/pages/InsumoForm.jsx";

export default function RequisicionNuevaPage() {
  const navigate = useNavigate();
  const [sugerencias, setSugerencias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [observaciones, setObservaciones] = useState("");
  const [cargandoSugerencias, setCargandoSugerencias] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarNuevoInsumo, setMostrarNuevoInsumo] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const recargarSugerencias = async () => {
    try {
      setSugerencias(await obtenerSugerenciasRequisicion());
    } catch (err) {
      setError(err?.message || "No fue posible actualizar las sugerencias");
    }
  };

  useEffect(() => {
    obtenerSugerenciasRequisicion()
      .then(setSugerencias)
      .catch((err) => setError(err?.message || "No fue posible cargar las sugerencias"))
      .finally(() => setCargandoSugerencias(false));
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 2) return undefined;
    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        setResultados(await buscarInsumosRequisicion(busqueda.trim()));
      } catch (err) {
        setError(err?.message || "No fue posible buscar insumos");
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const cambiarBusqueda = (event) => {
    const value = event.target.value;
    setBusqueda(value);
    if (value.trim().length < 2) setResultados([]);
  };

  const agregar = (insumo, origenSugerencia = false) => {
    if (partidas.some((partida) => partida.insumoId === insumo.id)) {
      setAviso(`${insumo.nombre} ya está agregado.`);
      return;
    }
    setPartidas((actuales) => [...actuales, {
      insumoId: insumo.id,
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      unidadSimbolo: insumo.unidadSimbolo,
      stockActual: insumo.stockDisponible ?? insumo.stockActual,
      stockMinimo: insumo.stockMinimo,
      cantidadSolicitada: Math.max(Number(insumo.cantidadSugerida || 1), 0.01),
      origenSugerencia,
      observaciones: "",
    }]);
    setAviso(`${insumo.nombre} agregado. Confirma la cantidad solicitada.`);
  };

  const agregarInsumoCreado = async (creado) => {
    const normalizado = {
      id: creado.id,
      codigo: creado.codigoBarras || creado.codigo || "",
      nombre: creado.nombre,
      unidadSimbolo: creado.unidadMedida?.simbolo || "",
      stockActual: Number(creado.stockDisponible ?? creado.stockActual ?? 0),
      stockMinimo: creado.stockMinimo === null || creado.stockMinimo === undefined
        ? null
        : Number(creado.stockMinimo),
      cantidadSugerida: 1,
    };

    agregar(normalizado);
    setMostrarNuevoInsumo(false);
    setBusqueda("");
    setResultados([]);
    await recargarSugerencias();
  };

  const actualizarPartida = (insumoId, campo, value) => {
    setPartidas((actuales) => actuales.map((item) => item.insumoId === insumoId ? { ...item, [campo]: value } : item));
  };

  const quitar = (insumoId) => {
    setPartidas((actuales) => actuales.filter((item) => item.insumoId !== insumoId));
  };

  const enviar = async () => {
    if (partidas.length === 0) {
      setError("Agrega al menos un insumo antes de enviar.");
      return;
    }
    if (partidas.some((item) => Number(item.cantidadSolicitada) <= 0)) {
      setError("Todas las cantidades deben ser mayores a cero.");
      return;
    }
    try {
      setGuardando(true);
      setError("");
      const creada = await crearRequisicion({
        observaciones,
        partidas: partidas.map((item) => ({
          insumoId: item.insumoId,
          cantidadSolicitada: Number(item.cantidadSolicitada),
          origenSugerencia: item.origenSugerencia,
          observaciones: item.observaciones,
        })),
      });
      navigate(`/almacen/requisiciones/${creada.id}`);
    } catch (err) {
      setError(err?.message || "No fue posible enviar la requisición");
    } finally {
      setGuardando(false);
    }
  };

  const TarjetaInsumo = ({ item, sugerida = false }) => (
    <div className="border rounded p-3 h-100 bg-white">
      <div className="d-flex justify-content-between gap-3">
        <div>
          <div className="fw-semibold">{item.nombre}</div>
          <small className="text-muted">{item.codigo}</small>
        </div>
        {sugerida ? <span className="badge text-bg-warning align-self-start">Bajo mínimo</span> : null}
      </div>
      <div className="small mt-2">
        Stock: <strong>{item.stockActual} {item.unidadSimbolo || ""}</strong>
        {item.stockMinimo !== null ? <> · Mínimo: <strong>{item.stockMinimo}</strong></> : null}
      </div>
      {sugerida ? <div className="small text-danger mt-1">Faltante al mínimo: {item.faltanteMinimo} {item.unidadSimbolo || ""}</div> : null}
      <button type="button" className="btn btn-outline-primary btn-sm mt-3" onClick={() => agregar(item, sugerida)}>
        <i className="bi bi-plus-lg me-1"></i>Agregar
      </button>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <button className="btn btn-link px-0 text-decoration-none" onClick={() => navigate("/almacen/requisiciones")}>
        <i className="bi bi-arrow-left me-2"></i>Volver a requisiciones
      </button>
      <div className="mb-4">
        <h2 className="mb-1">Nueva requisición</h2>
        <p className="text-muted mb-0">Dirigida a Subdirección Administrativa. Las sugerencias no se agregan automáticamente.</p>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {aviso ? <div className="alert alert-info alert-dismissible"><span>{aviso}</span><button type="button" className="btn-close" onClick={() => setAviso("")}></button></div> : null}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div><h5 className="mb-1">Sugerencias por stock mínimo</h5><small className="text-muted">Revisa y agrega sólo lo que realmente necesites.</small></div>
          <span className="badge text-bg-warning">{sugerencias.length} sugerencias</span>
        </div>
        <div className="card-body">
          {cargandoSugerencias ? <div className="text-center py-4"><div className="spinner-border text-primary" /></div> :
            sugerencias.length === 0 ? <p className="text-success mb-0"><i className="bi bi-check-circle me-2"></i>No hay insumos bajo el mínimo.</p> :
              <div className="row g-3">{sugerencias.map((item) => <div className="col-md-6 col-xl-4" key={item.id}><TarjetaInsumo item={item} sugerida /></div>)}</div>}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center gap-3">
          <h5 className="mb-0">Buscar otro insumo</h5>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setMostrarNuevoInsumo(true)}>
            <i className="bi bi-plus-lg me-1"></i>Nuevo insumo
          </button>
        </div>
        <div className="card-body">
          <label className="form-label fw-semibold">Código o nombre</label>
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input className="form-control" value={busqueda} onChange={cambiarBusqueda} placeholder="Escribe al menos 2 caracteres" />
            {buscando ? <span className="input-group-text bg-white"><span className="spinner-border spinner-border-sm" /></span> : null}
          </div>
          {resultados.length > 0 ? <div className="row g-3 mt-1">{resultados.map((item) => <div className="col-md-6 col-xl-4" key={item.id}><TarjetaInsumo item={item} /></div>)}</div> : null}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between"><h5 className="mb-0">Partidas de la requisición</h5><span className="badge text-bg-primary">{partidas.length}</span></div>
        <div className="card-body p-0">
          {partidas.length === 0 ? <div className="text-center text-muted py-5">Agrega insumos desde sugerencias o búsqueda.</div> :
            <div className="table-responsive"><table className="table align-middle mb-0">
              <thead className="table-light"><tr><th>Insumo</th><th>Stock / mínimo</th><th style={{ minWidth: 170 }}>Cantidad solicitada</th><th style={{ minWidth: 220 }}>Observación</th><th></th></tr></thead>
              <tbody>{partidas.map((item) => <tr key={item.insumoId}>
                <td><div className="fw-semibold">{item.nombre}</div><small className="text-muted">{item.codigo}{item.origenSugerencia ? " · sugerido" : ""}</small></td>
                <td>{item.stockActual} / {item.stockMinimo ?? "Sin mínimo"} {item.unidadSimbolo || ""}</td>
                <td><div className="input-group"><input type="number" min="0.01" step="0.01" className="form-control" value={item.cantidadSolicitada} onChange={(e) => actualizarPartida(item.insumoId, "cantidadSolicitada", e.target.value)} /><span className="input-group-text">{item.unidadSimbolo || "u."}</span></div></td>
                <td><input className="form-control" value={item.observaciones} onChange={(e) => actualizarPartida(item.insumoId, "observaciones", e.target.value)} maxLength="500" /></td>
                <td><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => quitar(item.insumoId)} title="Quitar"><i className="bi bi-trash"></i></button></td>
              </tr>)}</tbody>
            </table></div>}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4"><div className="card-body">
        <label className="form-label fw-semibold">Observaciones generales</label>
        <textarea className="form-control" rows="3" maxLength="1000" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Urgencia, proyecto o información para Subdirección..." />
      </div></div>

      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-light" onClick={() => navigate("/almacen/requisiciones")}>Cancelar</button>
        <button className="btn btn-primary px-4" disabled={guardando || partidas.length === 0} onClick={enviar}>
          {guardando ? "Enviando..." : "Enviar requisición"}
        </button>
      </div>

      {mostrarNuevoInsumo && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Crear nuevo insumo</h5>
                    <small className="text-muted">Al guardarlo se agregará a esta requisición.</small>
                  </div>
                  <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMostrarNuevoInsumo(false)}></button>
                </div>
                <div className="modal-body">
                  <InsumoForm onSave={agregarInsumoCreado} onCancel={() => setMostrarNuevoInsumo(false)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
