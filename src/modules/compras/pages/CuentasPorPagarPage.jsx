import { useEffect, useMemo, useState } from "react";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { exportarCuentasPorPagarExcel, obtenerCuentasPorPagar } from "../services/compras.js";
import "./CuentasPorPagarPage.css";

const PAGE_SIZE = 10;

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function getEstadoBadge(estado) {
  switch (estado) {
    case "PAGADA": return "success";
    case "PARCIAL": return "info";
    case "CANCELADA": return "secondary";
    default: return "warning";
  }
}

function getMonthStart(value) {
  return value ? `${value}-01` : "";
}

function getMonthEnd(value) {
  if (!value) return "";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

function getMonthLabel(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));
}

function descargarBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function CuentasPorPagarPage() {
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [mesInicio, setMesInicio] = useState("");
  const [mesFin, setMesFin] = useState("");
  const [page, setPage] = useState(() => getInitialPaginationPage("cuentas-por-pagar"));
  usePersistedPagination("cuentas-por-pagar", page);
  const [cuentasReporte, setCuentasReporte] = useState([]);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await obtenerCuentasPorPagar({
          estado,
          busqueda,
          fechaInicio: getMonthStart(mesInicio),
          fechaFin: getMonthEnd(mesFin),
          page,
          size: PAGE_SIZE
        });
        setCuentas(data?.content || (Array.isArray(data) ? data : []));
        setPageInfo({
          page: Number(data?.number ?? data?.page ?? page),
          size: Number(data?.size ?? PAGE_SIZE),
          totalElements: Number(data?.totalElements ?? (Array.isArray(data) ? data.length : 0)),
          totalPages: Number(data?.totalPages ?? (Array.isArray(data) && data.length > 0 ? 1 : 0))
        });
      } catch (err) {
        setError(err.message || "No se pudieron cargar las cuentas por pagar");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [busqueda, estado, mesInicio, mesFin, page]);

  useEffect(() => {
    const cargarReporte = async () => {
      try {
        const data = await obtenerCuentasPorPagar({
          estado,
          busqueda,
          fechaInicio: getMonthStart(mesInicio),
          fechaFin: getMonthEnd(mesFin)
        });
        setCuentasReporte(Array.isArray(data) ? data : []);
      } catch {
        setCuentasReporte([]);
      }
    };
    cargarReporte();
  }, [busqueda, estado, mesInicio, mesFin]);

  useEffect(() => {
    setPage(0);
  }, [busqueda, estado, mesInicio, mesFin]);

  const totalPages = Math.max(pageInfo.totalPages || 0, 1);
  const safePage = Math.min(page, totalPages - 1);

  const resumen = useMemo(() => {
    const base = cuentasReporte.length ? cuentasReporte : cuentas;
    const totalAdeudo = base.reduce((sum, cuenta) => sum + Number(cuenta.saldoPendiente || 0), 0);
    const totalCompras = base.reduce((sum, cuenta) => sum + Number(cuenta.montoTotal || 0), 0);
    const totalPagado = base.reduce((sum, cuenta) => sum + Number(cuenta.montoPagado || 0), 0);
    const proveedores = new Set(base.map((cuenta) => cuenta.proveedorId).filter(Boolean)).size;
    return { totalAdeudo, totalCompras, totalPagado, proveedores };
  }, [cuentas, cuentasReporte]);

  const resumenMensual = useMemo(() => {
    const mapa = new Map();
    cuentasReporte.forEach((cuenta) => {
      const fecha = cuenta.fechaCuenta || cuenta.fechaCompra;
      const key = fecha ? fecha.slice(0, 7) : "sin-fecha";
      const actual = mapa.get(key) || {
        mes: key,
        total: 0,
        pagado: 0,
        pendiente: 0,
        cuentas: 0,
        pagadas: 0,
        pendientes: 0
      };
      actual.total += Number(cuenta.montoTotal || 0);
      actual.pagado += Number(cuenta.montoPagado || 0);
      actual.pendiente += Number(cuenta.saldoPendiente || 0);
      actual.cuentas += 1;
      if (cuenta.estado === "PAGADA") actual.pagadas += 1;
      if (cuenta.estado !== "PAGADA" && cuenta.estado !== "CANCELADA") actual.pendientes += 1;
      mapa.set(key, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [cuentasReporte]);

  const maxMensual = Math.max(...resumenMensual.map((item) => Math.max(item.pagado, item.pendiente)), 1);

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);
      const blob = await exportarCuentasPorPagarExcel({
        estado,
        busqueda,
        fechaInicio: getMonthStart(mesInicio),
        fechaFin: getMonthEnd(mesFin)
      });
      descargarBlob(blob, "cuentas-por-pagar.xlsx");
      setToastType("success");
      setToastMessage("Reporte de Excel generado correctamente");
    } catch (err) {
      setToastType("danger");
      setToastMessage(err?.message || "No se pudo generar el reporte de Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <PageHeader
        title="Cuentas por pagar"
        subtitle="Control de adeudos a proveedores generados por compras a credito."
        actions={
          <div className="cuentas-header-actions">
            <button className="btn btn-outline-success" onClick={exportarExcel} disabled={exportandoExcel}>
              <i className="bi bi-file-earmark-excel me-2"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
              <i className="bi bi-arrow-left me-2"></i>
              Volver a compras
            </button>
          </div>
        }
      />

      {loading && <div className="alert alert-info">Cargando cuentas por pagar...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Saldo pendiente</div>
              <div className="fs-4 fw-bold text-danger">{formatCurrency(resumen.totalAdeudo)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total compras credito</div>
              <div className="fs-5 fw-bold">{formatCurrency(resumen.totalCompras)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total pagado</div>
              <div className="fs-5 fw-bold text-success">{formatCurrency(resumen.totalPagado)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Proveedores</div>
              <div className="fs-4 fw-bold">{resumen.proveedores}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por proveedor, folio, RFC o estado"
              />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Parcial</option>
                <option value="PAGADA">Pagada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="month"
                className="form-control"
                value={mesInicio}
                onChange={(event) => setMesInicio(event.target.value)}
                aria-label="Mes inicial"
              />
            </div>
            <div className="col-md-3">
              <input
                type="month"
                className="form-control"
                value={mesFin}
                onChange={(event) => setMesFin(event.target.value)}
                aria-label="Mes final"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="cuentas-chart-panel">
        <div className="cuentas-chart-header">
          <div>
            <h2>Pagado vs pendiente por mes</h2>
            <span>{cuentasReporte.length} documentos dentro de los filtros</span>
          </div>
          <div className="cuentas-chart-legend">
            <span><i className="legend-paid"></i>Pagado</span>
            <span><i className="legend-pending"></i>Pendiente</span>
          </div>
        </div>
        {resumenMensual.length ? (
          <div className="cuentas-month-bars">
            {resumenMensual.map((item) => (
              <div className="cuentas-month-row" key={item.mes}>
                <div className="cuentas-month-label">
                  <strong>{getMonthLabel(item.mes)}</strong>
                  <span>{item.cuentas} docs</span>
                </div>
                <div className="cuentas-bars">
                  <div className="cuentas-bar-line">
                    <span style={{ width: `${Math.max((item.pagado / maxMensual) * 100, item.pagado ? 4 : 0)}%` }} className="bar-paid"></span>
                    <em>{formatCurrency(item.pagado)}</em>
                  </div>
                  <div className="cuentas-bar-line">
                    <span style={{ width: `${Math.max((item.pendiente / maxMensual) * 100, item.pendiente ? 4 : 0)}%` }} className="bar-pending"></span>
                    <em>{formatCurrency(item.pendiente)}</em>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted py-3">No hay datos para graficar con los filtros actuales.</div>
        )}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Compra</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-end">Total</th>
                <th className="text-end">Pagado</th>
                <th className="text-end">Saldo</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.length > 0 ? (
                cuentas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td className="fw-semibold">{cuenta.compraFolio || `Compra #${cuenta.compraId}`}</td>
                    <td>
                      <div className="fw-semibold">{cuenta.proveedorRazonSocial || "-"}</div>
                      <small className="text-muted">{cuenta.proveedorRfc || "-"}</small>
                    </td>
                    <td>{formatDate(cuenta.fechaCuenta || cuenta.fechaCompra)}</td>
                    <td>
                      <span className={`badge bg-${getEstadoBadge(cuenta.estado)}-subtle text-${getEstadoBadge(cuenta.estado)} border border-${getEstadoBadge(cuenta.estado)}-subtle`}>
                        {cuenta.estado}
                      </span>
                    </td>
                    <td className="text-end">{formatCurrency(cuenta.montoTotal)}</td>
                    <td className="text-end text-success">{formatCurrency(cuenta.montoPagado)}</td>
                    <td className="text-end fw-bold text-danger">{formatCurrency(cuenta.saldoPendiente)}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/compras/cuentas-por-pagar/${cuenta.id}`)}
                      >
                        Ver / pagar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No hay cuentas por pagar que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CatalogPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalElements={pageInfo.totalElements || 0}
        pageSize={PAGE_SIZE}
        currentCount={cuentas.length}
        itemLabel="cuentas"
        ariaLabel="Paginacion de cuentas por pagar"
        onPageChange={setPage}
        className="mt-3"
      />
    </>
  );
}
