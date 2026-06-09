import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Toast from "../../../../components/ui/Toast.jsx";
import { obtenerUnidadesMedida } from "../../../unidades-medida/services/unidadMedidas.js";
import { crearInsumo } from "../../../insumos/services/insumos.js";
import { obtenerEntradaPorId, recepcionarDetalleCompra } from "../services/entradas.js";

function formatoFecha(valor) {
  if (!valor) return "--";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export default function EntradaRecepcionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compra, setCompra] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [entregadoPor, setEntregadoPor] = useState("");
  const [recepciones, setRecepciones] = useState([]);
  const [mostrarPopupInsumo, setMostrarPopupInsumo] = useState(false);
  const [creandoInsumo, setCreandoInsumo] = useState(false);
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: "",
    unidadMedidaId: "",
    stockMinimo: 0,
    descripcion: ""
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [compraData, unidadesData] = await Promise.all([
        obtenerEntradaPorId(id),
        obtenerUnidadesMedida()
      ]);

      setCompra(compraData);
      setEntregadoPor(compraData.entregadoPor || "");
      setUnidades(Array.isArray(unidadesData?.content) ? unidadesData.content : Array.isArray(unidadesData) ? unidadesData : []);
      setRecepciones((compraData.detalles || []).map((detalle) => ({
        detalleId: detalle.id,
        nombre: detalle.insumoNombre,
        cantidadComprada: Number(detalle.cantidad || 0),
        cantidadRecibidaAnterior: Number(detalle.cantidadRecibida || 0),
        cantidadRecibirAhora: Number(detalle.cantidadPendiente || 0),
        motivoNoRecepcion: detalle.motivoNoRecepcion || "",
        cantidadPendiente: Number(detalle.cantidadPendiente || 0)
      })));
    } catch (error) {
      console.error(error);
      setToastType("danger");
      setToastMessage("No se pudo cargar la entrada");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalPendiente = useMemo(() => {
    return recepciones.reduce((acc, item) => acc + Number(item.cantidadPendiente || 0), 0);
  }, [recepciones]);

  const manejarCambioRecepcion = (detalleId, campo, valor) => {
    setRecepciones((prev) => prev.map((item) => (
      item.detalleId === detalleId
        ? { ...item, [campo]: campo === "cantidadRecibirAhora" ? Number(valor || 0) : valor }
        : item
    )));
  };

  const recibirTodo = (detalleId) => {
    setRecepciones((prev) => prev.map((item) => (
      item.detalleId === detalleId
        ? { ...item, cantidadRecibirAhora: item.cantidadPendiente, motivoNoRecepcion: "" }
        : item
    )));
  };

  const guardarRecepcion = async () => {
    if (!entregadoPor.trim()) {
      setToastType("danger");
      setToastMessage("Debes indicar quién entregó la compra");
      return;
    }

    const itemsARecibir = recepciones.filter((item) => Number(item.cantidadRecibirAhora || 0) > 0);
    if (itemsARecibir.length === 0) {
      setToastType("danger");
      setToastMessage("Agrega al menos una cantidad a recibir");
      return;
    }

    try {
      setGuardando(true);
      for (const item of itemsARecibir) {
        await recepcionarDetalleCompra(item.detalleId, {
          cantidadRecibida: item.cantidadRecibirAhora,
          entregadoPor: entregadoPor.trim(),
          motivoNoRecepcion: item.motivoNoRecepcion?.trim() || null
        });
      }

      setToastType("success");
      setToastMessage("Recepción registrada y stock actualizado");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo registrar la recepción");
    } finally {
      setGuardando(false);
    }
  };

  const crearInsumoRapido = async (e) => {
    e.preventDefault();

    try {
      setCreandoInsumo(true);
      await crearInsumo({
        nombre: nuevoInsumo.nombre.trim(),
        descripcion: nuevoInsumo.descripcion.trim() || null,
        unidadMedidaId: Number(nuevoInsumo.unidadMedidaId),
        stockMinimo: Number(nuevoInsumo.stockMinimo || 0)
      });
      setToastType("success");
      setToastMessage("Insumo creado correctamente");
      setMostrarPopupInsumo(false);
      setNuevoInsumo({ nombre: "", unidadMedidaId: "", stockMinimo: 0, descripcion: "" });
      const unidadesData = await obtenerUnidadesMedida();
      setUnidades(Array.isArray(unidadesData?.content) ? unidadesData.content : Array.isArray(unidadesData) ? unidadesData : []);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo crear el insumo");
    } finally {
      setCreandoInsumo(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">Cargando entrada...</div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Entrada no encontrada</div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/almacen/entradas")}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Recepción de entrada</h2>
          <p className="text-muted mb-0">
            Compra {compra.folio} · {compra.proveedorRazonSocial}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/almacen/entradas")}>
            Volver
          </button>
          <button className="btn btn-outline-primary" onClick={() => setMostrarPopupInsumo(true)}>
            Nuevo insumo
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Proveedor</div>
              <div className="fw-semibold">{compra.proveedorRazonSocial}</div>
              <div className="text-muted small">{compra.proveedorRfc}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Estado</div>
              <div className="fw-semibold">{compra.estado}</div>
              <div className="text-muted small">{formatoFecha(compra.fechaCompra)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Entregado por</div>
              <input
                type="text"
                className="form-control"
                value={entregadoPor}
                onChange={(e) => setEntregadoPor(e.target.value)}
                placeholder="Nombre de quien entrega"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Insumo</th>
                <th className="text-end">Comprado</th>
                <th className="text-end">Recibido antes</th>
                <th className="text-end">Pendiente</th>
                <th className="text-end">Recibir ahora</th>
                <th>Motivo si falta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recepciones.map((item) => (
                <tr key={item.detalleId}>
                  <td>{item.nombre}</td>
                  <td className="text-end">{Number(item.cantidadComprada).toFixed(2)}</td>
                  <td className="text-end">{Number(item.cantidadRecibidaAnterior).toFixed(2)}</td>
                  <td className="text-end">{Number(item.cantidadPendiente).toFixed(2)}</td>
                  <td className="text-end" style={{ maxWidth: "150px" }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control form-control-sm text-end"
                      value={item.cantidadRecibirAhora}
                      onChange={(e) => manejarCambioRecepcion(item.detalleId, "cantidadRecibirAhora", e.target.value)}
                    />
                  </td>
                  <td style={{ minWidth: "240px" }}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={item.motivoNoRecepcion}
                      onChange={(e) => manejarCambioRecepcion(item.detalleId, "motivoNoRecepcion", e.target.value)}
                      placeholder="Opcional si no se recibe completo"
                    />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => recibirTodo(item.detalleId)}
                    >
                      Todo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-body border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="text-muted">
            Pendiente total: <strong>{totalPendiente.toFixed(2)}</strong>
          </div>
          <button className="btn btn-primary" disabled={guardando} onClick={guardarRecepcion}>
            {guardando ? "Registrando..." : "Recibir"}
          </button>
        </div>
      </div>

      {mostrarPopupInsumo && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={crearInsumoRapido}>
                <div className="modal-header">
                  <h5 className="modal-title">Nuevo insumo</h5>
                  <button type="button" className="btn-close" onClick={() => setMostrarPopupInsumo(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" value={nuevoInsumo.nombre} onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, nombre: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Unidad de medida *</label>
                    <select className="form-select" value={nuevoInsumo.unidadMedidaId} onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, unidadMedidaId: e.target.value }))}>
                      <option value="">Selecciona...</option>
                      {unidades.map((unidad) => (
                        <option key={unidad.id} value={unidad.id}>{unidad.nombre} ({unidad.simbolo})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Stock mínimo</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={nuevoInsumo.stockMinimo} onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, stockMinimo: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" rows="3" value={nuevoInsumo.descripcion} onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, descripcion: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setMostrarPopupInsumo(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={creandoInsumo}>{creandoInsumo ? "Creando..." : "Crear insumo"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
