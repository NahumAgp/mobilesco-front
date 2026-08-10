import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import CatalogPagination from "../../../components/ui/CatalogPagination.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import CifConfiguracionWarning from "../components/CifConfiguracionWarning.jsx";
import { getUser, hasPermission } from "../../auth/services/authService";
import {
  actualizarConfiguracionCif,
  cambiarEstadoConceptoCif,
  obtenerConceptosCif,
  obtenerConfiguracionCif,
  obtenerResumenCif,
} from "../services/cif";
import "../../productos/pages/Productos/ProductoForm.css";

const PAGE_SIZE = 10;
const PAGE_INFO_DEFAULT = {
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0
};

function isConfiguracionCifError(error) {
  const message = `${error?.message || ""} ${error?.data?.message || ""}`.toLowerCase();

  return (
    message.includes("cif_configuracion") ||
    message.includes("connection is read-only") ||
    message.includes("read-only") ||
    message.includes("insert into cif_configuracion")
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function CifPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const puedeGestionar = ["ACTION_CIF_CREATE", "ACTION_CIF_EDIT", "ACTION_CIF_STATUS"].some((code) => hasPermission(user, code));
  const [conceptos, setConceptos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [configuracion, setConfiguracion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const configuracionCardRef = useRef(null);
  const diasRef = useRef(null);
  const horasRef = useRef(null);
  const turnosRef = useRef(null);
  const [resaltarConfiguracion, setResaltarConfiguracion] = useState(false);
  const resaltarTimeoutRef = useRef(null);

  const enfocarConfiguracion = () => {
    configuracionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    diasRef.current?.focus({ preventScroll: true });
    setResaltarConfiguracion(true);

    if (resaltarTimeoutRef.current) {
      window.clearTimeout(resaltarTimeoutRef.current);
    }

    resaltarTimeoutRef.current = window.setTimeout(() => {
      setResaltarConfiguracion(false);
      resaltarTimeoutRef.current = null;
    }, 2200);
  };

  const cargarDatos = useCallback(async (pagina = page) => {
    try {
      setLoading(true);
      const activo = filtroEstado === "TODOS" ? undefined : filtroEstado === "ACTIVO";
      const [conceptosResp, configResp, resumenResp] = await Promise.all([
        obtenerConceptosCif({
          page: pagina,
          size: PAGE_SIZE,
          busqueda,
          activo
        }),
        obtenerConfiguracionCif(),
        obtenerResumenCif(),
      ]);
      setConceptos(Array.isArray(conceptosResp?.content) ? conceptosResp.content : Array.isArray(conceptosResp) ? conceptosResp : []);
      setPageInfo(conceptosResp?.content ? {
        page: conceptosResp.page ?? pagina,
        size: conceptosResp.size ?? PAGE_SIZE,
        totalElements: conceptosResp.totalElements ?? 0,
        totalPages: conceptosResp.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
      setConfiguracion(configResp);
      setResumen(resumenResp);
    } catch (error) {
      if (isConfiguracionCifError(error)) {
        setToast({
          message: "La configuracion CIF aun no esta guardada. Completa los datos para continuar.",
          type: "warning",
        });
      } else {
        setToast({ message: error.message || "No fue posible cargar CIF.", type: "danger" });
      }
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroEstado, page]);

  useEffect(() => {
    cargarDatos(page);
  }, [cargarDatos, page]);

  useEffect(() => {
    if (!location.state?.enfocarConfiguracion) return;

    const timer = window.setTimeout(() => {
      enfocarConfiguracion();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (resaltarTimeoutRef.current) {
        window.clearTimeout(resaltarTimeoutRef.current);
      }
    };
  }, []);

  const totalElements = pageInfo.totalElements || 0;
  const totalPages = pageInfo.totalPages || 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const configuracionPendiente = !loading && configuracion && configuracion.id == null;

  const guardarConfiguracion = async () => {
    if (!puedeGestionar || !configuracion) return;
    try {
      setGuardando(true);
      await actualizarConfiguracionCif({
        diasLaborablesMes: Number(configuracion.diasLaborablesMes),
        horasPorDia: Number(configuracion.horasPorDia),
        turnos: Number(configuracion.turnos),
      });
      setToast({ message: "Configuracion CIF actualizada.", type: "success" });
      await cargarDatos(page);
    } catch (error) {
      setToast({ message: error.message || "No fue posible actualizar la configuracion.", type: "danger" });
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (concepto) => {
    if (!puedeGestionar) return;
    try {
      await cambiarEstadoConceptoCif(concepto.id, !concepto.activo);
      setToast({ message: concepto.activo ? "Concepto desactivado." : "Concepto activado.", type: "success" });
      await cargarDatos(page);
    } catch (error) {
      setToast({ message: error.message || "No fue posible cambiar el estado.", type: "danger" });
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: "" })} />

      <PageHeader
        title="CIF"
        subtitle="Costos indirectos de fabricacion por minuto productivo"
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => cargarDatos(page)} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-2" />
              Actualizar
            </button>
            {puedeGestionar && (
              <button className="btn btn-success" onClick={() => navigate("/cif/nuevo")}>
                <i className="bi bi-plus-circle me-2" />
                Nuevo CIF
              </button>
            )}
          </div>
        }
      />

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold">CIF mensual activo</div>
              <div className="fs-4 fw-bold">{formatCurrency(resumen?.totalMensual)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold">Minutos productivos</div>
              <div className="fs-4 fw-bold">{formatNumber(resumen?.minutosProductivosMes, 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold">Costo CIF/min</div>
              <div className="fs-4 fw-bold text-success">{formatCurrency(resumen?.costoMinuto)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold">Conceptos activos</div>
              <div className="fs-4 fw-bold">{Number(resumen?.conceptosActivos || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {configuracionPendiente && (
        <CifConfiguracionWarning
          className="mb-3"
          title="Aun no has guardado la configuracion CIF"
          message="Estos valores estan usando la configuracion inicial. Revisa los dias laborables por mes, horas por dia y turnos, y guarda los cambios para activar el calculo correcto."
          actionLabel="Enfocar configuracion"
          onAction={puedeGestionar ? enfocarConfiguracion : undefined}
        />
      )}

      <div
        ref={configuracionCardRef}
        className={`card mb-3 ${resaltarConfiguracion ? "cif-config-focus" : ""}`}
      >
        <div className="card-header bg-white fw-semibold">Configuracion productiva</div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Dias/mes</label>
              <input
                ref={diasRef}
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${resaltarConfiguracion ? "cif-config-focus-input" : ""}`}
                value={configuracion?.diasLaborablesMes ?? ""}
                disabled={!puedeGestionar}
                onChange={(e) => setConfiguracion((prev) => ({ ...prev, diasLaborablesMes: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Horas/dia</label>
              <input
                ref={horasRef}
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${resaltarConfiguracion ? "cif-config-focus-input" : ""}`}
                value={configuracion?.horasPorDia ?? ""}
                disabled={!puedeGestionar}
                onChange={(e) => setConfiguracion((prev) => ({ ...prev, horasPorDia: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Turnos</label>
              <input
                ref={turnosRef}
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${resaltarConfiguracion ? "cif-config-focus-input" : ""}`}
                value={configuracion?.turnos ?? ""}
                disabled={!puedeGestionar}
                onChange={(e) => setConfiguracion((prev) => ({ ...prev, turnos: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-md-end">
              <button className="btn btn-primary w-100 w-md-auto" onClick={guardarConfiguracion} disabled={!puedeGestionar || guardando}>
                <i className="bi bi-save me-2" />
                Guardar configuracion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row g-2 align-items-center mb-3">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="Buscar por nombre o descripcion..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPage(0);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="alert alert-info mb-0">Cargando CIF...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="text-center">
                    <th>Concepto</th>
                    <th>Tipo</th>
                    <th>Periodo</th>
                    <th>Monto</th>
                    <th>Mensual</th>
                    <th>Costo/min</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {conceptos.map((concepto) => (
                    <tr key={concepto.id}>
                      <td className="text-start">
                        <div className="fw-semibold">{concepto.nombre}</div>
                        {concepto.descripcion && <div className="text-muted small">{concepto.descripcion}</div>}
                      </td>
                      <td>{concepto.tipo === "VARIABLE" ? "Variable" : "Fijo"}</td>
                      <td>{concepto.periodicidad || "MENSUAL"}</td>
                      <td className="fw-semibold">{formatCurrency(concepto.monto ?? concepto.montoMensual)}</td>
                      <td>{formatCurrency(concepto.montoMensualEquivalente)}</td>
                      <td className="fw-bold text-success">{formatCurrency(concepto.costoMinuto)}</td>
                      <td>
                        <span className={`badge ${concepto.activo ? "text-bg-success" : "text-bg-secondary"}`}>
                          {concepto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn btn-outline-primary btn-sm" disabled={!puedeGestionar} onClick={() => navigate(`/cif/${concepto.id}`)}>
                            <i className="bi bi-pencil me-1" />
                            Editar
                          </button>
                          <button className={`btn btn-sm ${concepto.activo ? "btn-outline-danger" : "btn-outline-success"}`} disabled={!puedeGestionar} onClick={() => alternarEstado(concepto)}>
                            <i className={`bi ${concepto.activo ? "bi-toggle-off" : "bi-toggle-on"} me-1`} />
                            {concepto.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!conceptos.length && (
                    <tr>
                      <td colSpan="8" className="text-muted py-4">No hay conceptos CIF para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {totalElements > 0 && (
            <CatalogPagination
              currentPage={paginaActual}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={conceptos.length}
              itemLabel="conceptos CIF"
              ariaLabel="Paginacion de conceptos CIF"
              onPageChange={setPage}
              className="mt-3"
            />
          )}
        </div>
      </div>
    </>
  );
}
