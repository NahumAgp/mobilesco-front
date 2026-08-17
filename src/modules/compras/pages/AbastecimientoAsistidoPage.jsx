import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import ConfirmationDialog from "../../../components/ui/ConfirmationDialog.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser, hasPermission } from "../../auth/services/authService.js";
import {
  generarComprasBorrador,
  obtenerSugerenciasAbastecimiento,
} from "../services/abastecimiento.js";
import "./AbastecimientoAsistidoPage.css";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePriority(value) {
  return String(value || "MEDIA")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function priorityLabel(value) {
  const priority = normalizePriority(value);
  if (priority === "ALTA" || priority === "URGENTE") return "Alta";
  if (priority === "BAJA") return "Baja";
  return "Media";
}

function priorityTone(value) {
  const priority = normalizePriority(value);
  if (priority === "ALTA" || priority === "URGENTE") return "alta";
  if (priority === "BAJA") return "baja";
  return "media";
}

function providerName(provider) {
  return provider?.nombre || provider?.razonSocial || "Proveedor sin nombre";
}

function uniqueProviders(suggestion) {
  const providers = [suggestion?.proveedorSugerido, ...(suggestion?.proveedores || [])]
    .filter((provider) => provider?.id !== null && provider?.id !== undefined);
  const byId = new Map();
  providers.forEach((provider) => byId.set(String(provider.id), provider));
  return [...byId.values()];
}

function initialEdition(suggestion) {
  const providers = uniqueProviders(suggestion);
  const suggestedId = suggestion?.proveedorSugerido?.id ?? providers[0]?.id ?? "";
  const quantity = asNumber(suggestion?.cantidadSugerida);
  return {
    selected: quantity > 0 && suggestedId !== "",
    quantity: quantity > 0 ? String(quantity) : "",
    providerId: suggestedId === "" ? "" : String(suggestedId),
  };
}

function buildEditions(suggestions) {
  return Object.fromEntries(
    suggestions.map((suggestion) => [String(suggestion.insumoId), initialEdition(suggestion)]),
  );
}

function findSelectedProvider(suggestion, providerId) {
  return uniqueProviders(suggestion).find(
    (provider) => String(provider.id) === String(providerId),
  );
}

export default function AbastecimientoAsistidoPage() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const canCreatePurchases = hasPermission(currentUser, "ACTION_PURCHASES_CREATE");

  const [suggestions, setSuggestions] = useState([]);
  const [editions, setEditions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [search, setSearch] = useState("");
  const [abcFilter, setAbcFilter] = useState("TODAS");
  const [priorityFilter, setPriorityFilter] = useState("TODAS");

  const loadSuggestions = useCallback(async ({ preserveResult = false } = {}) => {
    try {
      setLoading(true);
      setLoadError("");
      setRefreshWarning("");
      setSubmitError("");
      if (!preserveResult) setResult(null);
      const data = await obtenerSugerenciasAbastecimiento();
      const list = Array.isArray(data) ? data : [];
      setSuggestions(list);
      setEditions(buildEditions(list));
    } catch (error) {
      const message = error.message || "No fue posible calcular las sugerencias de compra.";
      if (preserveResult) {
        setRefreshWarning(message);
      } else {
        setLoadError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const filteredSuggestions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return suggestions.filter((suggestion) => {
      const matchesSearch = !term || [suggestion.codigo, suggestion.nombre, suggestion.explicacion]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(term));
      const abc = String(suggestion.clasificacionAbc || "-").toUpperCase();
      const matchesAbc = abcFilter === "TODAS" || abc === abcFilter;
      const priority = normalizePriority(suggestion.prioridad);
      const matchesPriority = priorityFilter === "TODAS" || priority === priorityFilter;
      return matchesSearch && matchesAbc && matchesPriority;
    });
  }, [abcFilter, priorityFilter, search, suggestions]);

  const selectedSuggestions = useMemo(
    () => suggestions.filter((suggestion) => editions[String(suggestion.insumoId)]?.selected),
    [editions, suggestions],
  );

  const selectedProviderCount = useMemo(
    () => new Set(
      selectedSuggestions
        .map((suggestion) => editions[String(suggestion.insumoId)]?.providerId)
        .filter(Boolean),
    ).size,
    [editions, selectedSuggestions],
  );

  const highPriorityCount = suggestions.filter((suggestion) => {
    const priority = normalizePriority(suggestion.prioridad);
    return priority === "ALTA" || priority === "URGENTE";
  }).length;

  const selectedTotalQuantity = selectedSuggestions.reduce(
    (total, suggestion) => total + asNumber(editions[String(suggestion.insumoId)]?.quantity),
    0,
  );

  const selectableVisibleSuggestions = filteredSuggestions.filter((suggestion) => {
    const edition = editions[String(suggestion.insumoId)] || initialEdition(suggestion);
    return uniqueProviders(suggestion).length > 0 && asNumber(edition.quantity) > 0;
  });

  const allVisibleSelected = selectableVisibleSuggestions.length > 0 && selectableVisibleSuggestions.every(
    (suggestion) => editions[String(suggestion.insumoId)]?.selected,
  );

  const updateEdition = (insumoId, changes) => {
    setSubmitError("");
    setResult(null);
    setEditions((current) => ({
      ...current,
      [String(insumoId)]: {
        ...current[String(insumoId)],
        ...changes,
      },
    }));
  };

  const toggleAllVisible = () => {
    const nextSelected = !allVisibleSelected;
    setEditions((current) => {
      const next = { ...current };
      filteredSuggestions.forEach((suggestion) => {
        const id = String(suggestion.insumoId);
        const currentEdition = next[id] || initialEdition(suggestion);
        const hasProvider = uniqueProviders(suggestion).length > 0;
        const hasQuantity = asNumber(currentEdition.quantity) > 0;
        next[id] = {
          ...currentEdition,
          selected: nextSelected && hasProvider && hasQuantity,
        };
      });
      return next;
    });
  };

  const validateSelection = () => {
    if (selectedSuggestions.length === 0) {
      return "Selecciona al menos una sugerencia para generar compras.";
    }

    const invalidQuantity = selectedSuggestions.find(
      (suggestion) => asNumber(editions[String(suggestion.insumoId)]?.quantity) <= 0,
    );
    if (invalidQuantity) {
      return `Indica una cantidad mayor a cero para ${invalidQuantity.codigo || invalidQuantity.nombre}.`;
    }

    const missingProvider = selectedSuggestions.find(
      (suggestion) => !editions[String(suggestion.insumoId)]?.providerId,
    );
    if (missingProvider) {
      return `Selecciona un proveedor para ${missingProvider.codigo || missingProvider.nombre}.`;
    }

    return "";
  };

  const requestConfirmation = () => {
    const validationError = validateSelection();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setConfirmationOpen(true);
  };

  const generateDrafts = async () => {
    const validationError = validateSelection();
    if (validationError) {
      setSubmitError(validationError);
      setConfirmationOpen(false);
      return;
    }

    const payload = selectedSuggestions.map((suggestion) => {
      const edition = editions[String(suggestion.insumoId)];
      return {
        insumoId: suggestion.insumoId,
        cantidad: asNumber(edition.quantity),
        proveedorId: Number(edition.providerId),
      };
    });

    try {
      setSubmitting(true);
      setSubmitError("");
      setResult(null);
      const response = await generarComprasBorrador(payload);
      setResult(response || { cantidadCompras: 0, cantidadPartidas: payload.length, compras: [] });
      setSuggestions([]);
      setEditions({});
      setToastMessage("Compras en borrador generadas correctamente.");
      setConfirmationOpen(false);
      await loadSuggestions({ preserveResult: true });
    } catch (error) {
      setSubmitError(error.message || "No fue posible generar las compras en borrador.");
      setConfirmationOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assisted-supply-page">
      <Toast
        message={toastMessage}
        type="success"
        onClose={() => setToastMessage("")}
      />
      <ConfirmationDialog
        open={confirmationOpen}
        title="Generar compras en borrador"
        message={`Se crearán ${selectedProviderCount} compra(s) en borrador, agrupadas por proveedor, con ${selectedSuggestions.length} partida(s). Podrás revisarlas antes de confirmarlas.`}
        confirmLabel="Generar borradores"
        variant="primary"
        loading={submitting}
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={generateDrafts}
      />

      <PageHeader
        eyebrow="Compras · Planeación"
        title="Abastecimiento asistido"
        subtitle="Prioriza insumos con base en su clasificación ABC, consumo, existencias y proveedores disponibles."
        actions={(
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/compras")}
            >
              <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>
              Ver compras
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={loadSuggestions}
              disabled={loading || submitting}
            >
              <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
              Recalcular
            </button>
          </div>
        )}
      />

      <section className="assisted-supply-kpis" aria-label="Resumen de abastecimiento">
        <article className="assisted-supply-kpi">
          <span className="assisted-supply-kpi__icon assisted-supply-kpi__icon--primary">
            <i className="bi bi-box-seam" aria-hidden="true"></i>
          </span>
          <div><strong>{suggestions.length}</strong><span>Insumos sugeridos</span></div>
        </article>
        <article className="assisted-supply-kpi">
          <span className="assisted-supply-kpi__icon assisted-supply-kpi__icon--danger">
            <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
          </span>
          <div><strong>{highPriorityCount}</strong><span>Prioridad alta</span></div>
        </article>
        <article className="assisted-supply-kpi">
          <span className="assisted-supply-kpi__icon assisted-supply-kpi__icon--success">
            <i className="bi bi-check2-square" aria-hidden="true"></i>
          </span>
          <div><strong>{selectedSuggestions.length}</strong><span>Partidas seleccionadas</span></div>
        </article>
        <article className="assisted-supply-kpi">
          <span className="assisted-supply-kpi__icon assisted-supply-kpi__icon--info">
            <i className="bi bi-truck" aria-hidden="true"></i>
          </span>
          <div><strong>{selectedProviderCount}</strong><span>Compras a generar</span></div>
        </article>
      </section>

      {!canCreatePurchases && (
        <div className="alert alert-info d-flex align-items-start gap-2" role="status">
          <i className="bi bi-eye mt-1" aria-hidden="true"></i>
          <div><strong>Vista de consulta.</strong> Puedes revisar las sugerencias, pero tu perfil no permite generar compras.</div>
        </div>
      )}

      {result && (
        <section className="assisted-supply-result" aria-live="polite">
          <div className="assisted-supply-result__heading">
            <span className="assisted-supply-result__icon"><i className="bi bi-check-lg" aria-hidden="true"></i></span>
            <div>
              <h2>Borradores generados</h2>
              <p>
                Se crearon {result.cantidadCompras ?? result.compras?.length ?? 0} compra(s) con {result.cantidadPartidas ?? 0} partida(s). Revísalas y confírmalas desde Compras.
              </p>
            </div>
          </div>
          {Array.isArray(result.compras) && result.compras.length > 0 && (
            <div className="assisted-supply-result__list">
              {result.compras.map((purchase) => (
                <Link
                  key={purchase.compraId ?? purchase.id}
                  to={`/compras/${purchase.compraId ?? purchase.id}/ver`}
                  className="assisted-supply-result__purchase"
                >
                  <span>
                    <strong>{purchase.folio || `Compra #${purchase.compraId ?? purchase.id}`}</strong>
                    <small>{purchase.proveedorNombre || "Proveedor"} · {purchase.partidas ?? 0} partida(s)</small>
                  </span>
                  <span>{currencyFormatter.format(asNumber(purchase.subtotalEstimado))}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {refreshWarning && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <div>
            <strong>Los borradores sí fueron generados.</strong>{" "}
            No pudimos actualizar las sugerencias: {refreshWarning}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={() => loadSuggestions({ preserveResult: true })}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Actualizar sugerencias
          </button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-circle mt-1" aria-hidden="true"></i>
          <div>{submitError}</div>
        </div>
      )}

      <section className="assisted-supply-filters card" aria-label="Filtros de sugerencias">
        <div className="row g-3 align-items-end">
          <div className="col-lg-6">
            <label className="form-label" htmlFor="supply-search">Buscar insumo</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
              <input
                id="supply-search"
                type="search"
                className="form-control"
                placeholder="Código, nombre o motivo de compra"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <label className="form-label" htmlFor="supply-abc">Clasificación ABC</label>
            <select id="supply-abc" className="form-select" value={abcFilter} onChange={(event) => setAbcFilter(event.target.value)}>
              <option value="TODAS">Todas</option>
              <option value="A">Clase A</option>
              <option value="B">Clase B</option>
              <option value="C">Clase C</option>
            </select>
          </div>
          <div className="col-sm-6 col-lg-3">
            <label className="form-label" htmlFor="supply-priority">Prioridad</label>
            <select id="supply-priority" className="form-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="TODAS">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>
      </section>

      {loading && (
        <div className="assisted-supply-state card" role="status" aria-live="polite">
          <span className="spinner-border text-primary" aria-hidden="true"></span>
          <strong>Calculando sugerencias…</strong>
          <span>Estamos cruzando consumo, existencias, clasificación ABC y proveedores.</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="assisted-supply-state card" role="alert">
          <span className="assisted-supply-state__icon assisted-supply-state__icon--danger"><i className="bi bi-cloud-slash" aria-hidden="true"></i></span>
          <strong>No pudimos cargar las sugerencias</strong>
          <span>{loadError}</span>
          <button type="button" className="btn btn-outline-primary" onClick={loadSuggestions}>Intentar de nuevo</button>
        </div>
      )}

      {!loading && !loadError && !refreshWarning && suggestions.length === 0 && (
        <div className="assisted-supply-state card" role="status">
          <span className="assisted-supply-state__icon"><i className="bi bi-check2-circle" aria-hidden="true"></i></span>
          <strong>El inventario está cubierto</strong>
          <span>No hay insumos que requieran una compra con los datos actuales.</span>
        </div>
      )}

      {!loading && !loadError && suggestions.length > 0 && (
        <>
          <section className="assisted-supply-selection-bar" aria-live="polite">
            <div>
              <strong>{selectedSuggestions.length} de {suggestions.length} partidas seleccionadas</strong>
              <span>{numberFormatter.format(selectedTotalQuantity)} unidades de consumo en total</span>
            </div>
            {canCreatePurchases && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={requestConfirmation}
                disabled={submitting || selectedSuggestions.length === 0}
              >
                <i className="bi bi-stars me-2" aria-hidden="true"></i>
                Generar borradores ({selectedProviderCount})
              </button>
            )}
          </section>

          {filteredSuggestions.length === 0 ? (
            <div className="assisted-supply-state card" role="status">
              <span className="assisted-supply-state__icon"><i className="bi bi-funnel" aria-hidden="true"></i></span>
              <strong>No hay coincidencias</strong>
              <span>Cambia o limpia los filtros para ver otras sugerencias.</span>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => { setSearch(""); setAbcFilter("TODAS"); setPriorityFilter("TODAS"); }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="assisted-supply-table-card card">
              <div className="table-responsive">
                <table className="table align-middle mb-0 assisted-supply-table">
                  <thead>
                    <tr>
                      <th className="assisted-supply-select-column">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                          disabled={!canCreatePurchases || selectableVisibleSuggestions.length === 0}
                          aria-label="Seleccionar todas las sugerencias visibles"
                        />
                      </th>
                      <th>Insumo</th>
                      <th>ABC</th>
                      <th>Consumo mensual</th>
                      <th>Existencias</th>
                      <th>Cantidad a comprar</th>
                      <th>Prioridad</th>
                      <th>Proveedor</th>
                      <th>Explicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuggestions.map((suggestion) => {
                      const id = String(suggestion.insumoId);
                      const edition = editions[id] || initialEdition(suggestion);
                      const providers = uniqueProviders(suggestion);
                      const selectedProvider = findSelectedProvider(suggestion, edition.providerId);
                      const quantityInvalid = edition.selected && asNumber(edition.quantity) <= 0;
                      const providerInvalid = edition.selected && !edition.providerId;
                      const unit = suggestion.unidadMedidaSimbolo || "u";
                      return (
                        <tr key={id} className={edition.selected ? "is-selected" : ""}>
                          <td data-label="Seleccionar" className="assisted-supply-select-column">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={Boolean(edition.selected)}
                              onChange={(event) => updateEdition(id, { selected: event.target.checked })}
                              disabled={!canCreatePurchases || providers.length === 0}
                              aria-label={`Seleccionar ${suggestion.codigo || suggestion.nombre}`}
                            />
                          </td>
                          <td data-label="Insumo">
                            <div className="assisted-supply-item">
                              <strong>{suggestion.nombre || "Insumo sin nombre"}</strong>
                              <span>{suggestion.codigo || `#${suggestion.insumoId}`} · {unit}</span>
                            </div>
                          </td>
                          <td data-label="ABC">
                            <span className={`assisted-supply-abc assisted-supply-abc--${String(suggestion.clasificacionAbc || "c").toLowerCase()}`}>
                              {suggestion.clasificacionAbc || "-"}
                            </span>
                          </td>
                          <td data-label="Consumo mensual">
                            <strong className="assisted-supply-number">{numberFormatter.format(asNumber(suggestion.consumoMensual))}</strong>
                            <small>{unit} / mes</small>
                          </td>
                          <td data-label="Existencias">
                            <div className="assisted-supply-stock">
                              <strong>{numberFormatter.format(asNumber(suggestion.stockDisponible))} {unit}</strong>
                              <span>Mín. {numberFormatter.format(asNumber(suggestion.stockMinimo))} · Reorden {numberFormatter.format(asNumber(suggestion.puntoReorden))}</span>
                            </div>
                          </td>
                          <td data-label="Cantidad a comprar">
                            <label className="visually-hidden" htmlFor={`supply-quantity-${id}`}>Cantidad para {suggestion.codigo || suggestion.nombre}</label>
                            <div className="input-group input-group-sm assisted-supply-quantity">
                              <input
                                id={`supply-quantity-${id}`}
                                type="number"
                                className={`form-control text-end ${quantityInvalid ? "is-invalid" : ""}`}
                                min="0.01"
                                step="0.01"
                                value={edition.quantity}
                                onChange={(event) => updateEdition(id, { quantity: event.target.value })}
                                disabled={!canCreatePurchases}
                                aria-invalid={quantityInvalid}
                              />
                              <span className="input-group-text">{unit}</span>
                            </div>
                            <small>Sugerido: {numberFormatter.format(asNumber(suggestion.cantidadSugerida))} {unit}</small>
                          </td>
                          <td data-label="Prioridad">
                            <span className={`assisted-supply-priority assisted-supply-priority--${priorityTone(suggestion.prioridad)}`}>
                              <i className="bi bi-circle-fill" aria-hidden="true"></i>
                              {priorityLabel(suggestion.prioridad)}
                            </span>
                          </td>
                          <td data-label="Proveedor">
                            {providers.length > 0 ? (
                              <>
                                <label className="visually-hidden" htmlFor={`supply-provider-${id}`}>Proveedor para {suggestion.codigo || suggestion.nombre}</label>
                                <select
                                  id={`supply-provider-${id}`}
                                  className={`form-select form-select-sm ${providerInvalid ? "is-invalid" : ""}`}
                                  value={edition.providerId}
                                  onChange={(event) => updateEdition(id, { providerId: event.target.value })}
                                  disabled={!canCreatePurchases}
                                  aria-invalid={providerInvalid}
                                >
                                  <option value="">Seleccionar proveedor</option>
                                  {providers.map((provider) => (
                                    <option key={provider.id} value={provider.id}>
                                      {providerName(provider)}{String(provider.id) === String(suggestion.proveedorSugerido?.id) ? " · sugerido" : ""}
                                    </option>
                                  ))}
                                </select>
                                {selectedProvider && (
                                  <small>
                                    {selectedProvider.costoUnitario != null ? `${currencyFormatter.format(asNumber(selectedProvider.costoUnitario))} / ${selectedProvider.unidadCompraSimbolo || unit}` : "Sin costo reciente"}
                                    {selectedProvider.calificacion != null ? ` · ${numberFormatter.format(asNumber(selectedProvider.calificacion))}/100` : ""}
                                  </small>
                                )}
                              </>
                            ) : (
                              <span className="assisted-supply-no-provider"><i className="bi bi-exclamation-circle" aria-hidden="true"></i> Sin proveedor disponible</span>
                            )}
                          </td>
                          <td data-label="Explicación">
                            <p className="assisted-supply-reason">{suggestion.explicacion || "La existencia proyectada está por debajo del nivel recomendado."}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
