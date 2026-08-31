import { useCallback, useEffect, useMemo, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser } from "../../auth/services/authService.js";
import { actualizarCostoCotizacion, obtenerCostosInsumos } from "../services/insumos.js";
import { puedeGestionarCostosInsumos } from "../utils/costosPermisos.js";
import "./InsumosPage.css";

const PAGE_SIZE = 10;
const FILTROS_DEFAULT = {
  busqueda: "",
  sortField: "nombre",
  sortDirection: "asc"
};

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) paginas.push("...");
  for (let page = inicio; page <= fin; page += 1) paginas.push(page);
  if (fin < totalPages - 2) paginas.push("...");

  paginas.push(totalPages - 1);
  return paginas;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderHeaderLabel(label) {
  return (
    <span className="insumos-header-label">
      {String(label)
        .split(" ")
        .map((parte) => (
          <span key={parte}>{parte}</span>
        ))}
    </span>
  );
}

export default function InsumosCostosPage() {
  const navigate = useNavigate();
  const puedeGestionarCostos = puedeGestionarCostosInsumos(getUser());
  const [costos, setCostos] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: PAGE_SIZE
  });
  const [page, setPage] = useState(() => getInitialPaginationPage("insumos-costos"));
  usePersistedPagination("insumos-costos", page);
  const [filtros, setFiltros] = usePersistedState("insumos-costos:filtros", FILTROS_DEFAULT);
  const { busqueda: busquedaInput, sortField, sortDirection } = filtros;
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const cargarCostos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await obtenerCostosInsumos({
        page,
        size: PAGE_SIZE,
        sortBy: sortField,
        direction: sortDirection,
        busqueda
      });

      setCostos(Array.isArray(response?.content) ? response.content : []);
      setPageInfo({
        totalElements: Number(response?.totalElements || 0),
        totalPages: Number(response?.totalPages || 0),
        page: Number(response?.page || page),
        size: Number(response?.size || PAGE_SIZE)
      });
    } catch (err) {
      setCostos([]);
      setError(err.message || "No fue posible cargar los costos de insumos");
    } finally {
      setLoading(false);
    }
  }, [busqueda, page, sortDirection, sortField]);

  useEffect(() => {
    cargarCostos();
  }, [cargarCostos]);

  const paginaActual = pageInfo.totalPages > 0 ? Math.min(page, pageInfo.totalPages - 1) : 0;
  const paginasVisibles = useMemo(
    () => construirRangoPaginas(pageInfo.totalPages, paginaActual),
    [pageInfo.totalPages, paginaActual]
  );
  const desde = pageInfo.totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = pageInfo.totalElements > 0 ? page * PAGE_SIZE + costos.length : 0;

  useEffect(() => {
    if (!loading && pageInfo.totalPages > 0 && page >= pageInfo.totalPages) {
      setPage(pageInfo.totalPages - 1);
    }
  }, [loading, page, pageInfo.totalPages]);

  const iniciarEdicion = (item) => {
    if (!puedeGestionarCostos) return;
    setEditingId(item.id);
    setDraftValue(item.costoCotizacion ? String(item.costoCotizacion) : "");
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setDraftValue("");
  };

  const guardarCosto = async (item) => {
    if (!puedeGestionarCostos) {
      setToastType("danger");
      setToastMessage("No tienes permisos para modificar costos de cotizacion");
      return;
    }

    const valor = Number(draftValue);
    if (!Number.isFinite(valor) || valor <= 0) {
      setToastType("danger");
      setToastMessage("El costo de cotizacion debe ser mayor a 0");
      return;
    }

    try {
      setSavingId(item.id);
      const actualizado = await actualizarCostoCotizacion(item.id, valor);
      setCostos((prev) => prev.map((actual) => (actual.id === item.id ? actualizado : actual)));
      setToastType("success");
      setToastMessage("Costo de cotizacion actualizado");
      cancelarEdicion();
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message || "No se pudo actualizar el costo");
    } finally {
      setSavingId(null);
    }
  };

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 0) return;
    if (pageInfo.totalPages > 0 && nuevaPagina >= pageInfo.totalPages) return;
    setPage(nuevaPagina);
  };

  const cambiarOrden = (campo) => {
    setFiltros((actuales) => ({
      ...actuales,
      sortField: campo,
      sortDirection: actuales.sortField === campo && actuales.sortDirection === "asc" ? "desc" : "asc"
    }));
    setPage(0);
  };

  const cambiarBusqueda = (event) => {
    setFiltros((actuales) => ({ ...actuales, busqueda: event.target.value }));
    setPage(0);
  };

  const limpiarBusqueda = () => {
    setFiltros((actuales) => ({ ...actuales, busqueda: "" }));
    setPage(0);
  };

  const sortIcon = (campo) => {
    if (sortField !== campo) return "bi bi-arrow-down-up text-secondary";
    return sortDirection === "asc" ? "bi bi-sort-down-alt text-primary" : "bi bi-sort-up text-primary";
  };

  const renderSortableHeader = (campo, label, className = "") => (
    <th className={className}>
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none insumos-sort-button"
        onClick={() => cambiarOrden(campo)}
      >
        {renderHeaderLabel(label)}
        <i className={`${sortIcon(campo)} ms-2`}></i>
      </button>
    </th>
  );

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Costos de insumos"
        subtitle="Ultima compra, promedio y cotizacion por insumo"
        actions={
          <div className="insumos-header-actions">
            <button className="btn btn-outline-secondary me-2" onClick={() => navigate("/insumos")}>
              <i className="bi bi-arrow-left me-1"></i>
              Insumos
            </button>
            <button className="btn insumos-brand-primary" onClick={cargarCostos} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Actualizar
            </button>
          </div>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {!puedeGestionarCostos && (
        <div className="alert alert-info">
          Puedes consultar los costos, pero solo Dev/Admin y Subdireccion administrativa pueden modificarlos.
        </div>
      )}

      <div className="insumos-page-shell">
        <div className="card insumos-filters-card mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold" htmlFor="busquedaCostosInsumos">
                  Buscar en costos
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    id="busquedaCostosInsumos"
                    type="search"
                    className="form-control"
                    placeholder="Nombre, codigo o unidad..."
                    value={busquedaInput}
                    onChange={cambiarBusqueda}
                  />
                  {busquedaInput && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={limpiarBusqueda}
                      title="Limpiar busqueda"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 insumos-table-card">
          <div className="table-responsive insumos-table-scroll">
            <table className="table table-hover align-middle mb-0 insumos-costos-table">
              <thead className="table-light insumos-table-head">
                <tr>
                  <th>{renderHeaderLabel("Codigo")}</th>
                  {renderSortableHeader("nombre", "Insumo")}
                  <th>{renderHeaderLabel("Unidad")}</th>
                  <th className="text-end">{renderHeaderLabel("Ultimo costo compra")}</th>
                  <th className="text-end">{renderHeaderLabel("Costo promedio")}</th>
                  {renderSortableHeader("costoCotizacion", "Costo cotizacion", "text-end")}
                  <th>{renderHeaderLabel("Estado")}</th>
                  <th className="text-end">{renderHeaderLabel("Actualizado")}</th>
                  <th className="text-end">{renderHeaderLabel("Acciones")}</th>
                </tr>
              </thead>
              <tbody>
                {costos.length > 0 ? (
                  costos.map((item) => {
                    const estaEditando = editingId === item.id;
                    const cotizacionPendiente = !item.costoCotizacion || Number(item.costoCotizacion) <= 0;

                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="badge text-bg-light border insumos-code-badge">
                            {item.codigoBarras || item.codigo || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold">{item.nombre}</div>
                        </td>
                        <td>
                          <span className="badge text-bg-light border insumos-unit-badge">
                            {item.unidadMedidaSimbolo || item.unidadMedidaNombre || "-"}
                          </span>
                        </td>
                        <td className="text-end">{formatCurrency(item.ultimoCostoCompra)}</td>
                        <td className="text-end">{formatCurrency(item.costoPromedio)}</td>
                        <td className="text-end insumos-cost-edit-cell">
                          {estaEditando ? (
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="form-control form-control-sm text-end"
                              value={draftValue}
                              onChange={(event) => setDraftValue(event.target.value)}
                              autoFocus
                            />
                          ) : (
                            <span className={cotizacionPendiente ? "text-danger fw-bold" : "text-success fw-bold"}>
                              {formatCurrency(item.costoCotizacion)}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span
                              className={
                                item.activo
                                  ? "badge bg-success-subtle text-success border border-success-subtle"
                                  : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                              }
                            >
                              {item.activo ? "Activo" : "Inactivo"}
                            </span>
                            {cotizacionPendiente && (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                Sin cotizacion
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-end text-muted small">{formatDate(item.fechaActualizacion)}</td>
                        <td className="text-end insumos-actions">
                          {estaEditando ? (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn insumos-brand-outline"
                                onClick={() => guardarCosto(item)}
                                disabled={savingId === item.id}
                                title="Guardar"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button
                                className="btn btn-outline-secondary"
                                onClick={cancelarEdicion}
                                disabled={savingId === item.id}
                                title="Cancelar"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          ) : (
                            puedeGestionarCostos ? (
                              <button
                                className="btn btn-sm insumos-brand-outline"
                                onClick={() => iniciarEdicion(item)}
                                title="Editar costo"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            ) : (
                              <span className="text-muted small">Solo lectura</span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-5">
                      <i className="bi bi-cash-coin fs-1 d-block mb-3 text-secondary"></i>
                      <span className="fs-5 d-block">No hay costos registrados</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pageInfo.totalElements > 0 && (
          <div className="insumos-pagination-panel">
            <div className="insumos-pagination-summary">
              Mostrando {desde} a {hasta} de {pageInfo.totalElements} insumos
            </div>

            <nav aria-label="Paginacion de costos de insumos">
              <ul className="pagination mb-0 flex-wrap">
                <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => irAPagina(0)} disabled={page <= 0}>
                    Primera
                  </button>
                </li>

                <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => irAPagina(page - 1)} disabled={page <= 0}>
                    Anterior
                  </button>
                </li>

                {paginasVisibles.map((pagina, index) =>
                  pagina === "..." ? (
                    <li key={`dots-${index}`} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  ) : (
                    <li key={`page-${pagina}`} className={`page-item ${page === pagina ? "active" : ""}`}>
                      <button className="page-link" onClick={() => irAPagina(pagina)}>
                        {pagina + 1}
                      </button>
                    </li>
                  )
                )}

                <li className={`page-item ${page >= pageInfo.totalPages - 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => irAPagina(page + 1)}
                    disabled={page >= pageInfo.totalPages - 1}
                  >
                    Siguiente
                  </button>
                </li>

                <li className={`page-item ${page >= pageInfo.totalPages - 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => irAPagina(pageInfo.totalPages - 1)}
                    disabled={page >= pageInfo.totalPages - 1}
                  >
                    Ultima
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
