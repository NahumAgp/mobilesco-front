import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import { obtenerCuentasPorPagar } from "../services/compras.js";

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

export default function CuentasPorPagarPage() {
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [page, setPage] = useState(0);
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
  }, [busqueda, estado, page]);

  useEffect(() => {
    setPage(0);
  }, [busqueda, estado]);

  const totalPages = Math.max(pageInfo.totalPages || 0, 1);
  const safePage = Math.min(page, totalPages - 1);

  const resumen = useMemo(() => {
    const totalAdeudo = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldoPendiente || 0), 0);
    const totalCompras = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.montoTotal || 0), 0);
    const totalPagado = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.montoPagado || 0), 0);
    const proveedores = new Set(cuentas.map((cuenta) => cuenta.proveedorId).filter(Boolean)).size;
    return { totalAdeudo, totalCompras, totalPagado, proveedores };
  }, [cuentas]);

  return (
    <>
      <PageHeader
        title="Cuentas por pagar"
        subtitle="Control de adeudos a proveedores generados por compras a credito."
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver a compras
          </button>
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
            <div className="col-md-8">
              <input
                className="form-control"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por proveedor, folio, RFC o estado"
              />
            </div>
            <div className="col-md-4">
              <select className="form-select" value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Parcial</option>
                <option value="PAGADA">Pagada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
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
