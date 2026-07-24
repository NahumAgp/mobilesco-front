import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aplicarCantidadesInsumosMismoNivel,
  aplicarCantidadesOperacionesMismoNivel,
  actualizarInsumoDeProducto,
  actualizarOperacionDeProducto,
  obtenerEstructuraCostos,
} from "../../services/productos.js";
import Card from "../../../../components/ui/Card.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatMonthYear(anio, mes) {
  if (!anio || !mes) return "Sin periodo asignado";
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(fecha);
}

function CostCard({ title, value, description, icon, tone = "primary" }) {
  const palette = {
    primary: {
      bg: "linear-gradient(135deg, rgba(13,110,253,.12), rgba(13,110,253,.04))",
      border: "rgba(13,110,253,.18)",
      iconBg: "rgba(13,110,253,.14)",
      iconColor: "#0d6efd",
    },
    success: {
      bg: "linear-gradient(135deg, rgba(25,135,84,.12), rgba(25,135,84,.04))",
      border: "rgba(25,135,84,.18)",
      iconBg: "rgba(25,135,84,.14)",
      iconColor: "#198754",
    },
    warning: {
      bg: "linear-gradient(135deg, rgba(255,193,7,.16), rgba(255,193,7,.05))",
      border: "rgba(255,193,7,.22)",
      iconBg: "rgba(255,193,7,.18)",
      iconColor: "#b58100",
    },
    dark: {
      bg: "linear-gradient(135deg, rgba(33,37,41,.12), rgba(33,37,41,.04))",
      border: "rgba(33,37,41,.16)",
      iconBg: "rgba(33,37,41,.12)",
      iconColor: "#212529",
    },
    info: {
      bg: "linear-gradient(135deg, rgba(13,202,240,.12), rgba(13,202,240,.04))",
      border: "rgba(13,202,240,.18)",
      iconBg: "rgba(13,202,240,.14)",
      iconColor: "#0dcaf0",
    },
  };
  const style = palette[tone] || palette.primary;

  return (
    <div className="producto-cost-card border h-100" style={{ background: style.bg, borderColor: style.border }}>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="text-uppercase text-muted small fw-semibold">{title}</div>
          <div className="producto-cost-card-value text-dark mt-1">{value}</div>
          {description && <div className="text-muted small mt-1">{description}</div>}
        </div>
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-3"
          style={{ width: 38, height: 38, background: style.iconBg, color: style.iconColor }}
        >
          <i className={`bi ${icon} fs-5`} />
        </div>
      </div>
    </div>
  );
}

function CostAccordionItem({ id, title, icon, children }) {
  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id={`${id}-heading`}>
        <button
          className="accordion-button collapsed producto-form-accordion-button"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${id}-collapse`}
          aria-expanded="false"
          aria-controls={`${id}-collapse`}
        >
          {icon && <i className={`${icon} me-2`}></i>}
          {title}
        </button>
      </h2>
      <div id={`${id}-collapse`} className="accordion-collapse collapse" aria-labelledby={`${id}-heading`}>
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
}

function CostSectionActions({ children }) {
  return (
    <div className="producto-cost-section-actions">
      {children}
    </div>
  );
}

function isConfiguracionCifError(error) {
  const message = `${error?.message || ""} ${error?.data?.message || ""}`.toLowerCase();

  return (
    message.includes("cif_configuracion") ||
    message.includes("connection is read-only") ||
    message.includes("read-only") ||
    message.includes("insert into cif_configuracion")
  );
}

export default function ProductoCostosPanel({ productoId, embedded = false, summaryOnly = false, detailsOnly = false }) {
  const navigate = useNavigate();
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cantidades, setCantidades] = useState({});
  const [guardandoCantidades, setGuardandoCantidades] = useState(false);
  const [aplicandoNivel, setAplicandoNivel] = useState(false);
  const [mensajeCantidades, setMensajeCantidades] = useState("");
  const [errorInsumos, setErrorInsumos] = useState("");
  const [cantidadesOperaciones, setCantidadesOperaciones] = useState({});
  const [guardandoOperaciones, setGuardandoOperaciones] = useState(false);
  const [aplicandoOperacionesNivel, setAplicandoOperacionesNivel] = useState(false);
  const [mensajeOperaciones, setMensajeOperaciones] = useState("");
  const [errorOperaciones, setErrorOperaciones] = useState("");

  const cargar = useCallback(async () => {
    if (!productoId) {
      setEstructura(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await obtenerEstructuraCostos(productoId);
      setEstructura(data);
      setCantidades(Object.fromEntries(
        (data.insumos || []).map((item) => [item.insumoId, item.cantidad == null ? "" : String(item.cantidad)])
      ));
      setCantidadesOperaciones(Object.fromEntries(
        (data.operaciones || []).map((item) => [item.operacionId, item.cantidad == null ? "" : String(item.cantidad)])
      ));
    } catch (e) {
      console.error("Error cargando estructura de costos:", e);
      setError(e.message || "No fue posible cargar la estructura de costos del producto.");
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const actualizar = (event) => {
      if (String(event.detail?.productoId) === String(productoId)) cargar();
    };
    window.addEventListener("producto-costos-actualizados", actualizar);
    return () => window.removeEventListener("producto-costos-actualizados", actualizar);
  }, [cargar, productoId]);

  const insumosPayload = useMemo(() => (estructura?.insumos || []).map((item) => ({
    insumoId: item.insumoId,
    cantidad: Number(cantidades[item.insumoId]),
    desperdicioPorcentaje: Number(item.desperdicioPorcentaje || 0),
    observaciones: item.observaciones || null,
  })), [cantidades, estructura?.insumos]);

  const cantidadesValidas = insumosPayload.length > 0
    && insumosPayload.every((item) => Number.isFinite(item.cantidad) && item.cantidad > 0);

  const totalInsumosCapturado = useMemo(() => (estructura?.insumos || []).reduce((total, item) => {
    const cantidad = Number(cantidades[item.insumoId] || 0);
    const desperdicio = Number(item.desperdicioPorcentaje || 0);
    return total + cantidad * (1 + desperdicio / 100) * Number(item.costoUnitario || 0);
  }, 0), [cantidades, estructura?.insumos]);

  const operacionesPayload = useMemo(() => (estructura?.operaciones || []).map((item, index) => ({
    operacionId: item.operacionId,
    cantidad: Number(cantidadesOperaciones[item.operacionId]),
    orden: item.orden || index + 1,
    observaciones: item.observaciones || null,
  })), [cantidadesOperaciones, estructura?.operaciones]);

  const cantidadesOperacionesValidas = operacionesPayload.length > 0
    && operacionesPayload.every((item) => Number.isInteger(item.cantidad) && item.cantidad > 0);

  const totalOperacionesCapturado = useMemo(() => (estructura?.operaciones || []).reduce((total, item) => {
    const cantidad = Number(cantidadesOperaciones[item.operacionId] || 0);
    return total + cantidad * Number(item.tiempoOperacion || 0) * Number(item.costoMinutoOperacion || 0);
  }, 0), [cantidadesOperaciones, estructura?.operaciones]);

  const notificarActualizacion = () => {
    window.dispatchEvent(new CustomEvent("producto-costos-actualizados", { detail: { productoId } }));
  };

  const guardarCantidades = async () => {
    if (!cantidadesValidas) {
      setErrorInsumos("Captura una cantidad mayor a 0 para cada insumo.");
      return;
    }
    try {
      setGuardandoCantidades(true);
      setErrorInsumos("");
      setMensajeCantidades("");
      await Promise.all(insumosPayload.map((item) =>
        actualizarInsumoDeProducto(productoId, item.insumoId, item)
      ));
      setMensajeCantidades("Cantidades guardadas en este producto.");
      notificarActualizacion();
    } catch (e) {
      setErrorInsumos(e.message || "No fue posible guardar las cantidades.");
    } finally {
      setGuardandoCantidades(false);
    }
  };

  const aplicarMismoNivel = async () => {
    if (!cantidadesValidas) {
      setErrorInsumos("Captura una cantidad mayor a 0 para cada insumo.");
      return;
    }
    if (!window.confirm("Se copiarán estas cantidades a todas las variantes del mismo modelo y nivel, sin importar el color. ¿Deseas continuar?")) {
      return;
    }
    try {
      setAplicandoNivel(true);
      setErrorInsumos("");
      setMensajeCantidades("");
      const resultado = await aplicarCantidadesInsumosMismoNivel(productoId, insumosPayload);
      setMensajeCantidades(
        `Cantidades aplicadas a ${resultado.productosActualizados} producto${resultado.productosActualizados === 1 ? "" : "s"} del nivel ${resultado.nivelNombre}.`
      );
      notificarActualizacion();
    } catch (e) {
      setErrorInsumos(e.message || "No fue posible aplicar las cantidades al mismo nivel.");
    } finally {
      setAplicandoNivel(false);
    }
  };

  const guardarCantidadesOperaciones = async () => {
    if (!cantidadesOperacionesValidas) {
      setErrorOperaciones("Captura una cantidad entera mayor a 0 para cada operación.");
      return;
    }
    try {
      setGuardandoOperaciones(true);
      setErrorOperaciones("");
      setMensajeOperaciones("");
      await Promise.all(operacionesPayload.map((item) =>
        actualizarOperacionDeProducto(productoId, item.operacionId, item)
      ));
      setMensajeOperaciones("Cantidades de operaciones guardadas en este producto.");
      notificarActualizacion();
    } catch (e) {
      setErrorOperaciones(e.message || "No fue posible guardar las cantidades de operaciones.");
    } finally {
      setGuardandoOperaciones(false);
    }
  };

  const aplicarOperacionesMismoNivel = async () => {
    if (!cantidadesOperacionesValidas) {
      setErrorOperaciones("Captura una cantidad entera mayor a 0 para cada operación.");
      return;
    }
    if (!window.confirm("Se copiarán estas cantidades de operaciones a todas las variantes del mismo modelo y nivel, sin importar el color o material. ¿Deseas continuar?")) {
      return;
    }
    try {
      setAplicandoOperacionesNivel(true);
      setErrorOperaciones("");
      setMensajeOperaciones("");
      const resultado = await aplicarCantidadesOperacionesMismoNivel(productoId, operacionesPayload);
      setMensajeOperaciones(
        `Operaciones aplicadas a ${resultado.productosActualizados} producto${resultado.productosActualizados === 1 ? "" : "s"} del nivel ${resultado.nivelNombre}.`
      );
      notificarActualizacion();
    } catch (e) {
      setErrorOperaciones(e.message || "No fue posible aplicar las operaciones al mismo nivel.");
    } finally {
      setAplicandoOperacionesNivel(false);
    }
  };

  if (!productoId) return null;

  const estadoContenido = loading ? (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando estructura de costos...</span>
      </div>
    </div>
  ) : !loading && ((estructura && estructura.configuracionCifId == null) || isConfiguracionCifError({ message: error })) ? (
    <div className="producto-cif-warning">
      <div className="d-flex align-items-start gap-3">
        <div className="producto-cif-warning-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <div className="flex-grow-1">
          <div className="text-uppercase small fw-bold producto-cif-warning-kicker">Falta la configuración CIF</div>
          <h5 className="mb-2">Necesitamos completar los datos productivos para calcular el costo indirecto.</h5>
          <p className="mb-3">
            Ve a la pantalla de CIF y captura los valores de <strong>días laborables por mes</strong>, <strong>horas por día</strong> y <strong>turnos</strong>.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn producto-cif-warning-button"
              onClick={() => navigate("/cif", { state: { enfocarConfiguracion: true } })}
            >
              <i className="bi bi-sliders2 me-2" />
              Ir a configuración CIF
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : error ? (
    <div className="alert alert-warning mb-0">{error}</div>
  ) : !estructura ? (
    <div className="text-muted">No hay informacion de costos para mostrar.</div>
  ) : null;

  const resumen = estructura && (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Producto</div>
          <div className="fs-5 fw-bold">
            {estructura.productoNombre} <span className="text-muted">| {estructura.productoSku}</span>
          </div>
        </div>
        <div className="text-end">
          <div className="text-muted small text-uppercase fw-semibold">Periodo CIF / SIF</div>
          <div className="fw-semibold">{formatMonthYear(estructura.anioCif, estructura.mesCif)}</div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6 col-xl-4">
          <CostCard
            title="Costo de insumos"
            value={formatCurrency(estructura.costoInsumosConDesperdicio)}
            description={`Base: ${formatCurrency(estructura.costoInsumosBase)}`}
            icon="bi-box-seam"
            tone="primary"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <CostCard title="Mano de obra" value={formatCurrency(estructura.costoOperaciones)} description="Costo de operaciones" icon="bi-gear-wide-connected" tone="success" />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <CostCard title="Costo primo" value={formatCurrency(estructura.costoPrimo)} description="Insumos + operaciones" icon="bi-clipboard-data" tone="dark" />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <CostCard
            title="CIF / SIF"
            value={formatCurrency(estructura.costoCif)}
            description={`${Number(estructura.tiempoOperacionesMinutos || 0).toFixed(2)} min x ${formatCurrency(estructura.tasaCifMinuto)}/min`}
            icon="bi-diagram-3"
            tone="warning"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <CostCard title="Costo total" value={formatCurrency(estructura.costoTotal)} description="Costo final del producto" icon="bi-cash-coin" tone="info" />
        </div>
      </div>
    </>
  );

  const detalles = estructura && (
    <>
      <CostAccordionItem id={`insumos-${productoId}`} title="Insumos" icon="bi bi-box-seam">
        <CostSectionActions>
          <button type="button" className="btn producto-form-primary" onClick={() => navigate(`/productos/${productoId}/bom/insumos`)}>
            <i className="bi bi-plus-circle me-2"></i>
            Agregar insumo
          </button>
        </CostSectionActions>
        <div className="producto-insumo-capture-note">
          <i className="bi bi-rulers" />
          <div><strong>Cantidades por nivel</strong><span>Captura el consumo correspondiente al tamaño de este producto.</span></div>
        </div>
        {errorInsumos && <div className="alert alert-danger py-2 mb-3">{errorInsumos}</div>}
        {mensajeCantidades && <div className="alert alert-success py-2 mb-3">{mensajeCantidades}</div>}
        {estructura.insumos?.length ? (
          <>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Insumo</th>
                  <th className="text-end">Cantidad</th>
                  <th>Unidad</th>
                  <th className="text-end">Desperdicio</th>
                  <th className="text-end">Costo unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {estructura.insumos.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold">{item.insumoNombre}</div>
                      {item.observaciones && <div className="text-muted small">{item.observaciones}</div>}
                    </td>
                    <td className="text-end">
                      <input
                        className="form-control form-control-sm producto-insumo-cantidad"
                        type="number"
                        inputMode="decimal"
                        min="0.0001"
                        step="0.0001"
                        aria-label={`Cantidad de ${item.insumoNombre}`}
                        value={cantidades[item.insumoId] ?? ""}
                        placeholder="0.0000"
                        onChange={(event) => {
                          setMensajeCantidades("");
                          setErrorInsumos("");
                          setCantidades((actual) => ({ ...actual, [item.insumoId]: event.target.value }));
                        }}
                      />
                    </td>
                    <td>{item.insumoUnidad}</td>
                    <td className="text-end">{Number(item.desperdicioPorcentaje || 0).toFixed(2)}%</td>
                    <td className="text-end">{formatCurrency(item.costoUnitario)}</td>
                    <td className="text-end fw-semibold">{formatCurrency(
                      Number(cantidades[item.insumoId] || 0)
                      * (1 + Number(item.desperdicioPorcentaje || 0) / 100)
                      * Number(item.costoUnitario || 0)
                    )}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="5" className="text-end fw-bold">TOTAL INSUMOS:</td>
                  <td className="text-end fw-bold text-success">{formatCurrency(totalInsumosCapturado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="producto-insumo-savebar">
            <div><strong>¿Terminaste este tamaño?</strong><span>Guarda sólo este producto o replica las cantidades a todas sus variantes del mismo nivel.</span></div>
            <div className="producto-insumo-savebar-actions">
              <button type="button" className="btn btn-outline-secondary" disabled={!cantidadesValidas || guardandoCantidades || aplicandoNivel} onClick={guardarCantidades}>
                <i className="bi bi-floppy me-2" />{guardandoCantidades ? "Guardando..." : "Guardar cantidades"}
              </button>
              <button type="button" className="btn producto-form-primary" disabled={!cantidadesValidas || guardandoCantidades || aplicandoNivel} onClick={aplicarMismoNivel}>
                <i className="bi bi-copy me-2" />{aplicandoNivel ? "Aplicando..." : "Aplicar a todos los productos del mismo nivel"}
              </button>
            </div>
          </div>
          </>
        ) : (
          <div className="text-muted">No hay insumos registrados.</div>
        )}
      </CostAccordionItem>

      <CostAccordionItem id={`operaciones-${productoId}`} title="Operaciones" icon="bi bi-gear-wide-connected">
        <CostSectionActions>
          <button type="button" className="btn producto-form-primary" onClick={() => navigate(`/productos/${productoId}/bom/operaciones`)}>
            <i className="bi bi-plus-circle me-2"></i>
            Agregar operacion
          </button>
        </CostSectionActions>
        <div className="producto-insumo-capture-note producto-operacion-capture-note">
          <i className="bi bi-stopwatch" />
          <div><strong>Repeticiones por nivel</strong><span>Captura cuántas veces se realiza cada operación para este tamaño.</span></div>
        </div>
        {errorOperaciones && <div className="alert alert-danger py-2 mb-3">{errorOperaciones}</div>}
        {mensajeOperaciones && <div className="alert alert-success py-2 mb-3">{mensajeOperaciones}</div>}
        {estructura.operaciones?.length ? (
          <>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Operacion</th>
                  <th className="text-end">Cantidad</th>
                  <th>Centro de trabajo</th>
                  <th className="text-end">Tiempo total</th>
                  <th className="text-end">Costo/min</th>
                  <th className="text-end">Importe</th>
                </tr>
              </thead>
              <tbody>
                {estructura.operaciones.map((item, index) => (
                  <tr key={item.id}>
                    <td><span className="badge text-bg-secondary">{item.orden || index + 1}</span></td>
                    <td>
                      <div className="fw-semibold">{item.operacionNombre}</div>
                      <div className="text-muted small">{item.operacionCodigo}</div>
                    </td>
                    <td className="text-end">
                      <input
                        className="form-control form-control-sm producto-insumo-cantidad producto-operacion-cantidad"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        aria-label={`Cantidad de operación ${item.operacionNombre}`}
                        value={cantidadesOperaciones[item.operacionId] ?? ""}
                        placeholder="0"
                        onChange={(event) => {
                          setMensajeOperaciones("");
                          setErrorOperaciones("");
                          setCantidadesOperaciones((actual) => ({ ...actual, [item.operacionId]: event.target.value }));
                        }}
                      />
                    </td>
                    <td>{item.centroTrabajoNombre || "-"}</td>
                    <td className="text-end">{
                      (Number(cantidadesOperaciones[item.operacionId] || 0) * Number(item.tiempoOperacion || 0)).toFixed(2)
                    } min</td>
                    <td className="text-end">{formatCurrency(item.costoMinutoOperacion)}</td>
                    <td className="text-end fw-semibold">{formatCurrency(
                      Number(cantidadesOperaciones[item.operacionId] || 0)
                      * Number(item.tiempoOperacion || 0)
                      * Number(item.costoMinutoOperacion || 0)
                    )}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="6" className="text-end fw-bold">TOTAL OPERACIONES:</td>
                  <td className="text-end fw-bold text-success">{formatCurrency(totalOperacionesCapturado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="producto-insumo-savebar">
            <div><strong>¿Terminaste las operaciones de este tamaño?</strong><span>Guarda este producto o replica cantidades, orden y tiempos a todas sus variantes del mismo nivel.</span></div>
            <div className="producto-insumo-savebar-actions">
              <button type="button" className="btn btn-outline-secondary" disabled={!cantidadesOperacionesValidas || guardandoOperaciones || aplicandoOperacionesNivel} onClick={guardarCantidadesOperaciones}>
                <i className="bi bi-floppy me-2" />{guardandoOperaciones ? "Guardando..." : "Guardar cantidades"}
              </button>
              <button type="button" className="btn producto-form-primary" disabled={!cantidadesOperacionesValidas || guardandoOperaciones || aplicandoOperacionesNivel} onClick={aplicarOperacionesMismoNivel}>
                <i className="bi bi-copy me-2" />{aplicandoOperacionesNivel ? "Aplicando..." : "Aplicar a todos los productos del mismo nivel"}
              </button>
            </div>
          </div>
          </>
        ) : (
          <div className="text-muted">No hay operaciones registradas.</div>
        )}
      </CostAccordionItem>

      <CostAccordionItem id={`cif-${productoId}`} title="CIF" icon="bi bi-diagram-3">
        <CostSectionActions>
          <button type="button" className="btn producto-form-primary" onClick={() => navigate("/cif")}>
            <i className="bi bi-diagram-3 me-2"></i>
            Gestionar CIF
          </button>
        </CostSectionActions>
        {estructura.costosIndirectos?.length ? (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Costo indirecto</th>
                  <th className="text-end">Participacion</th>
                  <th className="text-end">Base</th>
                  <th className="text-end">Monto asignado</th>
                </tr>
              </thead>
              <tbody>
                {estructura.costosIndirectos.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold">{item.costoIndirectoNombre}</div>
                      <div className="text-muted small">{item.costoIndirectoCodigo}</div>
                    </td>
                    <td className="text-end">{Number(item.porcentajeParticipacion || 0).toFixed(2)}%</td>
                    <td className="text-end">{item.baseCalculo || "-"}</td>
                    <td className="text-end fw-semibold">{formatCurrency(item.montoAsignado)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="3" className="text-end fw-bold">TOTAL CIF / SIF:</td>
                  <td className="text-end fw-bold text-success">{formatCurrency(estructura.costoCif)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-muted">No hay costos indirectos asignados para el periodo actual.</div>
        )}
      </CostAccordionItem>
    </>
  );

  if (summaryOnly) {
    return <Card className="producto-costos-panel producto-cost-summary-card mb-4">{estadoContenido || resumen}</Card>;
  }

  if (detailsOnly) {
    return estadoContenido || detalles;
  }

  return (
    <Card
      title={embedded ? undefined : "Estructura de costos"}
      icon={embedded ? undefined : "bi-bar-chart-line"}
      className={embedded ? "producto-costos-panel mb-0 shadow-none" : "producto-costos-panel mb-4"}
      footer={
        <div className="d-flex flex-wrap justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary" onClick={() => navigate(`/productos/${productoId}/bom/insumos`)}>
            <i className="bi bi-box-seam me-2" />
            Ajustar insumos
          </button>
          <button type="button" className="btn btn-outline-success" onClick={() => navigate(`/productos/${productoId}/bom/operaciones`)}>
            <i className="bi bi-gear me-2" />
            Ajustar operaciones
          </button>
        </div>
      }
    >
      {estadoContenido || (
        <>
          {resumen}
          <div className="mt-4">{detalles}</div>
        </>
      )}
    </Card>
  );
}
