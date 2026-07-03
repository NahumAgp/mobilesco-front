import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Toast from "../../../../components/ui/Toast.jsx";
import { obtenerUnidadesMedida } from "../../../unidades-medida/services/unidadMedidas.js";
import { crearInsumo } from "../../../insumos/services/insumos.js";
import { actualizarCompra } from "../../../compras/services/compras.js";
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

function fechaLocalISO(date = new Date()) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

const RECEPCION_ACTION_BUTTON_STYLE = {
  width: "2rem",
  height: "2rem",
  minWidth: "2rem"
};

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
  const [ajusteActivoId, setAjusteActivoId] = useState(null);
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
      setRecepciones((compraData.detalles || []).map((detalle) => {
        const cantidadComprada = Number(detalle.cantidad || 0);
        const cantidadRecibidaAnterior = Number(detalle.cantidadRecibida || 0);
        const cantidadPendiente = Number(detalle.cantidadPendiente || Math.max(cantidadComprada - cantidadRecibidaAnterior, 0));

        return {
          detalleId: detalle.id,
          nombre: detalle.insumoNombre,
          cantidadComprada,
          cantidadRecibidaAnterior,
          cantidadRecibirAhora: 0,
          motivoNoRecepcion: detalle.motivoNoRecepcion || "",
          cantidadPendiente,
          estadoRecepcion: cantidadPendiente <= 0 ? "palomita" : ""
        };
      }));
      setAjusteActivoId(null);
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

  const totalPendiente = useMemo(
    () => recepciones.reduce((acc, item) => acc + Number(item.cantidadPendiente || 0), 0),
    [recepciones]
  );

  const totalSeleccionado = useMemo(
    () => recepciones.reduce((acc, item) => acc + Number(item.cantidadRecibirAhora || 0), 0),
    [recepciones]
  );

  const totalCompletos = useMemo(
    () => recepciones.filter((item) => Number(item.cantidadPendiente || 0) <= 0).length,
    [recepciones]
  );

  const totalPendientes = useMemo(
    () => recepciones.filter((item) => Number(item.cantidadPendiente || 0) > 0).length,
    [recepciones]
  );

  const porcentajeRecibido = useMemo(() => {
    if (recepciones.length === 0) return 0;
    return Math.round((totalCompletos / recepciones.length) * 100);
  }, [totalCompletos, recepciones.length]);

  const hayPendientes = totalPendiente > 0;
  const entradaCerrada = compra?.estado === "RECIBIDA";

  const manejarCambioRecepcion = (detalleId, campo, valor) => {
    setRecepciones((prev) => prev.map((item) => {
      if (item.detalleId !== detalleId) return item;

      if (campo === "cantidadRecibirAhora") {
        if (valor === "") {
          return { ...item, cantidadRecibirAhora: "", estadoRecepcion: "ajuste" };
        }

        const valorNumerico = Math.max(Number(valor || 0), 0);
        const maximo = Number(item.cantidadPendiente || 0);
        return { ...item, cantidadRecibirAhora: Math.min(valorNumerico, maximo), estadoRecepcion: "ajuste" };
      }

      return { ...item, [campo]: valor, estadoRecepcion: campo === "motivoNoRecepcion" ? "ajuste" : item.estadoRecepcion };
    }));
  };

  const seleccionarPalomita = (seleccionado) => {
    if (Number(seleccionado.cantidadPendiente || 0) <= 0) {
      return;
    }

    setRecepciones((prev) => prev.map((item) => (
      item.detalleId === seleccionado.detalleId
        ? {
            ...item,
            cantidadRecibirAhora: Number(item.cantidadPendiente || 0),
            motivoNoRecepcion: "",
            estadoRecepcion: "palomita"
          }
        : item
    )));
    setAjusteActivoId((actual) => (actual === seleccionado.detalleId ? null : actual));
  };

  const abrirAjuste = (item) => {
    if (Number(item.cantidadPendiente || 0) <= 0) {
      return;
    }

    setRecepciones((prev) => prev.map((actual) => (
      actual.detalleId === item.detalleId
        ? {
            ...actual,
            cantidadRecibirAhora: Number(actual.cantidadRecibirAhora || 0) > 0
              && Number(actual.cantidadRecibirAhora || 0) < Number(actual.cantidadPendiente || 0)
                ? actual.cantidadRecibirAhora
                : "",
            estadoRecepcion: "ajuste"
          }
        : actual
    )));
    setAjusteActivoId(item.detalleId);
  };

  const marcarNoLlego = (seleccionado) => {
    if (Number(seleccionado.cantidadPendiente || 0) <= 0) {
      return;
    }

    setRecepciones((prev) => prev.map((item) => (
      item.detalleId === seleccionado.detalleId
        ? {
            ...item,
            cantidadRecibirAhora: 0,
            motivoNoRecepcion: "",
            estadoRecepcion: "tache"
          }
        : item
    )));
    setAjusteActivoId((actual) => (actual === seleccionado.detalleId ? null : actual));
  };

  const cerrarAjuste = () => setAjusteActivoId(null);

  const cerrarEntrada = async () => {
    if (entradaCerrada) {
      setToastType("success");
      setToastMessage("La entrada ya esta recibida");
      return;
    }

    try {
      setGuardando(true);
      await actualizarCompra(id, {
        entregadoPor: entregadoPor.trim() || null,
        estado: "RECIBIDA",
        fechaRecepcion: fechaLocalISO()
      });

      setToastType("success");
      setToastMessage("Entrada cerrada correctamente");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo cerrar la entrada");
    } finally {
      setGuardando(false);
    }
  };

  const guardarRecepcion = async () => {
    const ajustesInvalidos = recepciones.find((item) => {
      if (item.estadoRecepcion !== "ajuste") return false;
      const cantidadRecibir = Number(item.cantidadRecibirAhora || 0);
      const cantidadPendiente = Number(item.cantidadPendiente || 0);
      return cantidadRecibir <= 0 || cantidadRecibir >= cantidadPendiente;
    });
    if (ajustesInvalidos) {
      setToastType("danger");
      setToastMessage(`Captura una cantidad parcial para ${ajustesInvalidos.nombre}`);
      return;
    }

    const conErrorMotivo = recepciones.find((item) =>
      item.estadoRecepcion === "ajuste"
      && !String(item.motivoNoRecepcion || "").trim()
    );
    if (conErrorMotivo) {
      setToastType("danger");
      setToastMessage(`Agrega el motivo de ajuste para ${conErrorMotivo.nombre}`);
      return;
    }

    const itemsARecibir = recepciones.filter((item) =>
      ["palomita", "ajuste"].includes(item.estadoRecepcion)
      && Number(item.cantidadRecibirAhora || 0) > 0
    );
    if (itemsARecibir.length === 0) {
      if (entradaCerrada) {
        setToastType("success");
        setToastMessage("La entrada ya esta recibida");
        return;
      }

      if (!hayPendientes) {
        await cerrarEntrada();
        return;
      }

      const hayTaches = recepciones.some((item) => item.estadoRecepcion === "tache");
      setToastType(hayTaches ? "warning" : "danger");
      setToastMessage(hayTaches
        ? "El tache no registra stock. Para guardar una recepcion, marca Palomita o captura un Ajuste."
        : "Selecciona Palomita, Ajuste o Tache para cada insumo pendiente");
      return;
    }

    try {
      setGuardando(true);
      for (const item of itemsARecibir) {
        await recepcionarDetalleCompra(item.detalleId, {
          cantidadRecibida: item.cantidadRecibirAhora,
          entregadoPor: entregadoPor.trim() || null,
          motivoNoRecepcion: item.motivoNoRecepcion?.trim() || null
        });
      }

      setToastType("success");
      setToastMessage("Recepcion registrada y stock actualizado");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setToastType("danger");
      setToastMessage(error.message || "No se pudo registrar la recepcion");
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

  const ajusteModalItem = recepciones.find((item) => item.detalleId === ajusteActivoId);

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
        <div>
          <div className="text-uppercase small fw-semibold text-primary mb-1">Almacen / Entradas</div>
          <h2 className="fw-bold mb-1">Recepcion de entrada</h2>
          <p className="text-muted mb-0">
            Compra {compra.folio} - {compra.proveedorRazonSocial}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-primary" onClick={() => navigate(`/compras/${id}`)}>
            Editar compra
          </button>
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
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Proveedor</div>
              <div className="fw-semibold fs-5">{compra.proveedorRazonSocial}</div>
              <div className="text-muted small">{compra.proveedorRfc}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Estado</div>
              <div className="fw-semibold fs-5">{compra.estado}</div>
              <div className="text-muted small">{formatoFecha(compra.fechaCompra)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Entregado por (opcional)</div>
              <input
                type="text"
                className="form-control"
                value={entregadoPor}
                onChange={(e) => setEntregadoPor(e.target.value)}
                placeholder="Nombre de quien entrega (opcional)"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-check2-square me-2"></i>Checklist de recepcion
            </h5>
            <small className="text-muted">
              Elige Palomita si llego todo, Ajuste para cantidad parcial o Tache si no llego el insumo.
            </small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <span className="badge text-bg-success-subtle text-success border border-success-subtle">
              {totalCompletos} completos
            </span>
            <span className="badge text-bg-warning-subtle text-warning border border-warning-subtle">
              {totalPendientes} pendientes
            </span>
          </div>
        </div>

        <div className="px-3 py-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="ms-body-sm fw-semibold">Avance de recepcion</span>
            <strong className="ms-body-sm">{porcentajeRecibido}%</strong>
          </div>
          <div className="ms-progress">
            <span style={{ width: `${porcentajeRecibido}%` }}></span>
          </div>
        </div>

        {!hayPendientes && (
          <div className="alert alert-success rounded-0 mb-0 border-0 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="fw-semibold mb-1">
                <i className="bi bi-patch-check-fill me-2"></i>
                {entradaCerrada ? "Entrada recibida correctamente" : "Esta entrada ya no tiene cantidades pendientes"}
              </div>
              <div className="small">
                {entradaCerrada
                  ? "La compra ya quedo cerrada y el stock fue actualizado."
                  : "Puedes cerrar la recepcion para dejar la compra como recibida."}
              </div>
            </div>
            {entradaCerrada ? (
              <button className="btn btn-outline-success" onClick={() => navigate("/almacen/entradas")}>
                <i className="bi bi-arrow-left me-2"></i>Volver a entradas
              </button>
            ) : (
              <button className="btn btn-success" disabled={guardando} onClick={cerrarEntrada}>
                <i className="bi bi-check2-circle me-2"></i>
                {guardando ? "Cerrando..." : "Cerrar entrada"}
              </button>
            )}
          </div>
        )}

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: "32%" }}>Insumo</th>
                <th className="text-end">Comprado</th>
                <th className="text-end">Recibido antes</th>
                <th className="text-end">Pendiente</th>
                <th style={{ width: "12%" }} className="text-center">Recepcion</th>
                <th style={{ width: "14%" }} className="text-end">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recepciones.map((item) => {
                const completo = Number(item.cantidadPendiente || 0) <= 0;
                const estadoSeleccionado = completo ? "palomita" : item.estadoRecepcion || "";
                const cantidadRecibir = Number(item.cantidadRecibirAhora || 0);
                const esPalomita = estadoSeleccionado === "palomita";
                const esAjuste = estadoSeleccionado === "ajuste";
                const esTache = estadoSeleccionado === "tache";
                const esParcial = esAjuste
                  && cantidadRecibir > 0
                  && cantidadRecibir < Number(item.cantidadPendiente || 0);
                const filaClase = completo
                  ? "table-success-subtle"
                  : esTache
                    ? "table-danger-subtle"
                    : esAjuste
                      ? "table-warning-subtle"
                      : "";

                return (
                  <tr key={item.detalleId} className={filaClase}>
                      <td>
                        <div>
                          <div className="fw-semibold">{item.nombre}</div>
                          <div className="small text-muted">
                            {completo
                              ? "Ya quedo recibido."
                              : esPalomita
                                ? "Se recibira completo."
                                : esAjuste && cantidadRecibir > 0
                                  ? `Recibir ahora: ${cantidadRecibir.toFixed(2)}`
                                  : esTache
                                    ? "Marcado como no recibido."
                                    : "Sin seleccion."}
                          </div>
                        </div>
                      </td>
                      <td className="text-end">{Number(item.cantidadComprada).toFixed(2)}</td>
                      <td className="text-end">{Number(item.cantidadRecibidaAnterior).toFixed(2)}</td>
                      <td className="text-end">
                        <span className={`badge ${completo ? "text-bg-success" : "text-bg-warning"}`}>
                          {Number(item.cantidadPendiente).toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-inline-flex flex-wrap justify-content-center gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm p-0 d-inline-flex align-items-center justify-content-center rounded-2 shadow-sm ${esPalomita ? "btn-success" : "btn-outline-success"}`}
                            style={RECEPCION_ACTION_BUTTON_STYLE}
                            disabled={completo}
                            onClick={() => seleccionarPalomita(item)}
                            aria-pressed={esPalomita}
                            aria-label={`Marcar ${item.nombre} como recibido completo`}
                            title="Recibido completo"
                          >
                            <i className="bi bi-check2-circle"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm p-0 d-inline-flex align-items-center justify-content-center rounded-2 shadow-sm ${esAjuste ? "btn-warning" : "btn-outline-warning"}`}
                            style={RECEPCION_ACTION_BUTTON_STYLE}
                            disabled={completo}
                            onClick={() => abrirAjuste(item)}
                            aria-pressed={esAjuste}
                            aria-label={`Capturar ajuste para ${item.nombre}`}
                            title="Ajuste parcial"
                          >
                            <i className="bi bi-sliders"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm p-0 d-inline-flex align-items-center justify-content-center rounded-2 shadow-sm ${esTache ? "btn-danger" : "btn-outline-danger"}`}
                            style={RECEPCION_ACTION_BUTTON_STYLE}
                            disabled={completo}
                            onClick={() => marcarNoLlego(item)}
                            aria-pressed={esTache}
                            aria-label={`Marcar ${item.nombre} como no recibido`}
                            title="No llego"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </td>
                      <td className="text-end">
                        {completo || esPalomita ? (
                          <span className="badge text-bg-success">
                            <i className="bi bi-check-lg me-1"></i>{completo ? "Recibido" : "Completo"}
                          </span>
                        ) : esAjuste ? (
                          <span className="badge text-bg-warning">
                            <i className="bi bi-sliders me-1"></i>{esParcial ? "Parcial" : "Ajuste"}
                          </span>
                        ) : esTache ? (
                          <span className="badge text-bg-danger">
                            <i className="bi bi-x-lg me-1"></i>No llego
                          </span>
                        ) : (
                          <span className="badge text-bg-light border">Pendiente</span>
                        )}
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card-body border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="text-muted">
            Pendiente total: <strong>{totalPendiente.toFixed(2)}</strong> | Seleccionado ahora: <strong>{totalSeleccionado.toFixed(2)}</strong>
          </div>
          <button
            className={`btn px-4 ${entradaCerrada ? "btn-outline-secondary" : "btn-primary"}`}
            disabled={guardando}
            onClick={entradaCerrada ? () => navigate("/almacen/entradas") : guardarRecepcion}
          >
            <i className="bi bi-check2-circle me-2"></i>
            <span>
              {guardando ? "Registrando..." : entradaCerrada ? "Volver a entradas" : (hayPendientes ? "Confirmar recepcion" : "Cerrar entrada")}
            </span>
          </button>
        </div>
      </div>

      {ajusteModalItem && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-sliders me-2"></i>Ajuste de recepcion
                </h5>
                <button type="button" className="btn-close" onClick={cerrarAjuste}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="text-muted small">Insumo</div>
                  <div className="fw-semibold">{ajusteModalItem.nombre}</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Recibir ahora</label>
                    <input
                      type="number"
                      min="0.01"
                      max={Number(ajusteModalItem.cantidadPendiente || 0)}
                      step="0.01"
                      className="form-control"
                      value={ajusteModalItem.cantidadRecibirAhora}
                      onChange={(e) => manejarCambioRecepcion(ajusteModalItem.detalleId, "cantidadRecibirAhora", e.target.value)}
                      placeholder="0.00"
                    />
                    <small className="text-muted">
                      Pendiente: {Number(ajusteModalItem.cantidadPendiente || 0).toFixed(2)}
                    </small>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-semibold small">Motivo del ajuste</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ajusteModalItem.motivoNoRecepcion}
                      onChange={(e) => manejarCambioRecepcion(ajusteModalItem.detalleId, "motivoNoRecepcion", e.target.value)}
                      placeholder="Ej. faltante, defectos, cantidad parcial"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={cerrarAjuste}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-warning" onClick={cerrarAjuste}>
                  <i className="bi bi-check2 me-1"></i>Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <input
                      className="form-control"
                      value={nuevoInsumo.nombre}
                      onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Unidad de medida *</label>
                    <select
                      className="form-select"
                      value={nuevoInsumo.unidadMedidaId}
                      onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, unidadMedidaId: e.target.value }))}
                    >
                      <option value="">Selecciona...</option>
                      {unidades.map((unidad) => (
                        <option key={unidad.id} value={unidad.id}>
                          {unidad.nombre} ({unidad.simbolo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Stock minimo</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={nuevoInsumo.stockMinimo}
                      onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, stockMinimo: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={nuevoInsumo.descripcion}
                      onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setMostrarPopupInsumo(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creandoInsumo}>
                    {creandoInsumo ? "Creando..." : "Crear insumo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
