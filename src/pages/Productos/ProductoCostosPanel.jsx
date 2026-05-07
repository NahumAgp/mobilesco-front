import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerEstructuraCostos } from "../../services/productos.js";
import Card from "../../components/ui/Card.jsx";

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

export default function ProductoCostosPanel({ productoId, embedded = false, summaryOnly = false, detailsOnly = false }) {
  const navigate = useNavigate();
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productoId) {
      setEstructura(null);
      return;
    }

    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        setEstructura(await obtenerEstructuraCostos(productoId));
      } catch (e) {
        console.error("Error cargando estructura de costos:", e);
        setError("No fue posible cargar la estructura de costos del producto.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [productoId]);

  if (!productoId) return null;

  const estadoContenido = loading ? (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando estructura de costos...</span>
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
          <CostCard title="CIF / SIF" value={formatCurrency(estructura.costoCif)} description="Costos indirectos asignados" icon="bi-diagram-3" tone="warning" />
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
        {estructura.insumos?.length ? (
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
                    <td className="text-end">{Number(item.cantidad || 0).toFixed(2)}</td>
                    <td>{item.insumoUnidad}</td>
                    <td className="text-end">{Number(item.desperdicioPorcentaje || 0).toFixed(2)}%</td>
                    <td className="text-end">{formatCurrency(item.costoUnitario)}</td>
                    <td className="text-end fw-semibold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="5" className="text-end fw-bold">TOTAL INSUMOS:</td>
                  <td className="text-end fw-bold text-success">{formatCurrency(estructura.costoInsumosConDesperdicio)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
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
        {estructura.operaciones?.length ? (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Operacion</th>
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
                    <td>{item.centroTrabajoNombre || "-"}</td>
                    <td className="text-end">{Number(item.tiempoTotal || 0).toFixed(2)} min</td>
                    <td className="text-end">{formatCurrency(item.costoMinutoOperacion)}</td>
                    <td className="text-end fw-semibold">{formatCurrency(item.importeActividad)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan="5" className="text-end fw-bold">TOTAL OPERACIONES:</td>
                  <td className="text-end fw-bold text-success">{formatCurrency(estructura.costoOperaciones)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-muted">No hay operaciones registradas.</div>
        )}
      </CostAccordionItem>

      <CostAccordionItem id={`cif-${productoId}`} title="CIF" icon="bi bi-diagram-3">
        <CostSectionActions>
          <button type="button" className="btn producto-form-primary" disabled title="No hay pantalla de asignacion CIF disponible aun">
            <i className="bi bi-plus-circle me-2"></i>
            Agregar CIF
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
