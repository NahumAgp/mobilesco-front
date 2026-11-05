import React, { useEffect, useRef, useState } from "react";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import usePersistedState from "../../../hooks/usePersistedState.js";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useInsumos } from "../hooks/useInsumos";
import { exportarInsumosExcel, obtenerInsumosActivos } from "../services/insumos.js";
import { obtenerTiposInsumo as obtenerCatalogoTipos } from "../services/tiposInsumo.js";
import { obtenerUnidadesMedida } from "../../unidades-medida/services/unidadMedidas.js";
import { getUser, hasPermission } from "../../auth/services/authService.js";
import {
  puedeAjustarStockManual,
  puedeGestionarCatalogoInsumos,
  puedeGestionarCostosInsumos
} from "../utils/costosPermisos.js";
import InsumosTable from "./InsumosTable.jsx";
import ConjuntosDialog from "../components/ConjuntosDialog.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./InsumosPage.css";

const PAGE_SIZE = 10;
const FILTROS_DEFAULT = {
  busquedaInput: "",
  filtroEstatus: "TODOS",
  soloActivos: false,
  filtroStockBajo: false,
  tipoInsumo: "",
  unidadMedidaId: "",
  ubicacion: "",
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

function FiltroDropdown({ icono, etiqueta, valor, opciones, alCambiar, placeholder }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef(null);
  const busquedaRef = useRef(null);
  const opcionActiva = opciones.find((opcion) => String(opcion.valor) === String(valor));
  const opcionesVisibles = opciones.filter((opcion) =>
    opcion.etiqueta.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase())
  );

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarAlHacerClickAfuera = (event) => {
      if (!contenedorRef.current?.contains(event.target)) setAbierto(false);
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };

    document.addEventListener("pointerdown", cerrarAlHacerClickAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    busquedaRef.current?.focus();

    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClickAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const seleccionar = (opcion) => {
    alCambiar(opcion.valor);
    setBusqueda("");
    setAbierto(false);
  };

  return (
    <div className="insumos-filter-field">
      <span className="insumos-filter-field-label"><i className={`bi ${icono}`} aria-hidden="true" /> {etiqueta}</span>
      <div className={`insumos-filter-dropdown ${abierto ? "is-open" : ""}`} ref={contenedorRef}>
        <button
          type="button"
          className={`insumos-filter-dropdown-trigger ${opcionActiva && String(opcionActiva.valor) !== "" ? "has-value" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          onClick={() => setAbierto((actual) => !actual)}
        >
          <span>{opcionActiva?.etiqueta || placeholder}</span>
          <i className={`bi bi-chevron-${abierto ? "up" : "down"}`} aria-hidden="true" />
        </button>
        {abierto && (
          <div className="insumos-filter-dropdown-menu">
            <label className="insumos-filter-dropdown-search">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                ref={busquedaRef}
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder={`Buscar ${etiqueta.toLocaleLowerCase()}...`}
                aria-label={`Buscar ${etiqueta.toLocaleLowerCase()}`}
              />
              {busqueda && (
                <button type="button" aria-label="Limpiar búsqueda" onClick={() => setBusqueda("")}>
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              )}
            </label>
            <div className="insumos-filter-dropdown-options" role="listbox" aria-label={etiqueta}>
              {opcionesVisibles.map((opcion) => {
                const seleccionada = String(opcion.valor) === String(valor);
                return (
                  <button
                    type="button"
                    key={opcion.valor || "todos"}
                    className={`insumos-filter-dropdown-option ${seleccionada ? "is-selected" : ""}`}
                    role="option"
                    aria-selected={seleccionada}
                    onClick={() => seleccionar(opcion)}
                  >
                    <span>{opcion.etiqueta}</span>
                    {seleccionada && <i className="bi bi-check2" aria-hidden="true" />}
                  </button>
                );
              })}
              {opcionesVisibles.length === 0 && <span className="insumos-filter-dropdown-empty">Sin coincidencias</span>}
            </div>
            <div className="insumos-filter-dropdown-hint">{opcionesVisibles.length} opciones disponibles</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InsumosPage() {
  const [mostrarConjuntos, setMostrarConjuntos] = useState(false);
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getUser();
  const puedeGestionarInsumos = puedeGestionarCatalogoInsumos(user);
  const puedeGestionarCostos = puedeGestionarCostosInsumos(user);
  const puedeAjustarStock = puedeAjustarStockManual(user);
  const puedeVerConjuntos = hasPermission(user, "VIEW_INPUT_SETS");
  const puedeCrearConjuntos = hasPermission(user, "ACTION_INPUT_SETS_CREATE");
  const puedeEditarConjuntos = hasPermission(user, "ACTION_INPUT_SETS_EDIT");

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [page, setPage] = useState(() => getInitialPaginationPage("insumos"));
  usePersistedPagination("insumos", page);
  const stockBajoDesdeUrl = searchParams.get("stockBajo") === "true";
  const [filtros, setFiltros] = usePersistedState("insumos:filtros", {
    ...FILTROS_DEFAULT,
    filtroStockBajo: stockBajoDesdeUrl
  });
  const {
    busquedaInput,
    filtroEstatus,
    soloActivos,
    filtroStockBajo,
    tipoInsumo,
    unidadMedidaId,
    ubicacion,
    sortField,
    sortDirection
  } = filtros;
  const busqueda = useDebouncedValue(busquedaInput, 350);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [generandoCatalogoPdf, setGenerandoCatalogoPdf] = useState(false);
  const [ajusteStock, setAjusteStock] = useState(null);
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  useEffect(() => {
    if (stockBajoDesdeUrl) {
      setFiltros((actuales) => ({ ...actuales, filtroStockBajo: true }));
    }
  }, [setFiltros, stockBajoDesdeUrl]);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([
      obtenerCatalogoTipos({ soloActivos: true, size: 100 }),
      obtenerUnidadesMedida()
    ]).then(([tiposResult, unidadesResult]) => {
      if (!activo) return;
      if (tiposResult.status === "fulfilled") {
        const data = tiposResult.value;
        const tipos = Array.isArray(data) ? data : data?.content || [];
        setTiposDisponibles(tipos.filter((tipo) => tipo?.codigo && tipo?.nombre));
      }
      if (unidadesResult.status === "fulfilled") {
        const data = unidadesResult.value;
        const unidades = Array.isArray(data) ? data : data?.content || [];
        setUnidadesDisponibles(unidades.filter((unidad) => unidad?.id));
      }
    });
    return () => { activo = false; };
  }, []);

  // Derivar el filtro de estatus para el backend
  const activoBackend =
    filtroEstatus === "ACTIVO" || soloActivos
      ? true
      : filtroEstatus === "INACTIVO"
        ? false
        : undefined;
  const stockBajoBackend = filtroStockBajo ? true : undefined;
  const terminoBusqueda = busqueda.trim();

  const {
    insumos,
    pageInfo,
    loadingLista,
    error,
    actualizarEstadoInsumo,
    ajustarStock
  } = useInsumos({
    page,
    size: PAGE_SIZE,
    sortBy: sortField,
    direction: sortDirection,
    busqueda: terminoBusqueda || undefined,
    activo: activoBackend,
    stockBajo: stockBajoBackend,
    tipoInsumo: tipoInsumo || undefined,
    unidadMedidaId: unidadMedidaId || undefined,
    ubicacion: ubicacion.trim() || undefined
  });

  const totalElements = pageInfo.totalElements ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? page * PAGE_SIZE + insumos.length : 0;

  const hayFiltrosActivos =
    Boolean(terminoBusqueda) || filtroEstatus !== "TODOS" || soloActivos || filtroStockBajo
      || Boolean(tipoInsumo) || Boolean(unidadMedidaId) || Boolean(ubicacion.trim());
  const filtrosAdicionalesActivos = [tipoInsumo, unidadMedidaId, ubicacion.trim()].filter(Boolean).length;
  const totalFiltrosActivos = filtrosAdicionalesActivos
    + (filtroEstatus !== "TODOS" || soloActivos ? 1 : 0)
    + (filtroStockBajo ? 1 : 0)
    + (terminoBusqueda ? 1 : 0);
  const mostrarVacio = !loadingLista && !error && totalElements === 0 && !hayFiltrosActivos;
  const mostrarSinCoincidencias =
    !loadingLista && !error && totalElements === 0 && hayFiltrosActivos;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      const nextPage = totalPages - 1;
      const timer = window.setTimeout(() => setPage(nextPage), 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadingLista, page, totalPages]);

  const abrirEditar = (insumo) => {
    navigate(`/insumos/${insumo.id}`);
  };

  const abrirKardex = (insumo) => {
    navigate(`/kardex?insumoId=${insumo.id}`);
  };

  const manejarCambiarEstado = async (insumo) => {
    const siguienteEstado = !insumo.activo;
    const accion = siguienteEstado ? "activar" : "desactivar";
    const confirmacion = window.confirm(`Seguro que deseas ${accion} este insumo?`);
    if (!confirmacion) return;

    try {
      await actualizarEstadoInsumo(insumo.id, siguienteEstado);
      setToastType("success");
      setToastMessage(`Insumo ${siguienteEstado ? "activado" : "desactivado"} correctamente`);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message || `Error al ${accion} insumo`);
    }
  };

  const abrirAjusteStock = (insumo) => {
    setAjusteStock({
      insumo,
      tipo: "ENTRADA",
      cantidad: "",
      motivo: ""
    });
  };

  const cerrarAjusteStock = () => {
    if (!guardandoAjuste) setAjusteStock(null);
  };

  const confirmarAjusteStock = async (event) => {
    event.preventDefault();
    if (!ajusteStock?.insumo) return;

    const cantidad = Number(ajusteStock.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setToastType("danger");
      setToastMessage("La cantidad del ajuste debe ser mayor a cero.");
      return;
    }
    const motivo = ajusteStock.motivo.trim();
    if (!motivo) {
      setToastType("danger");
      setToastMessage("Escribe el motivo del ajuste.");
      return;
    }

    const accion = ajusteStock.tipo === "SALIDA" ? "descontar" : "agregar";
    const confirmado = window.confirm(
      `Se va a ${accion} ${cantidad.toFixed(2)} al stock de ${ajusteStock.insumo.nombre}. ¿Confirmas el ajuste manual?`
    );
    if (!confirmado) return;

    try {
      setGuardandoAjuste(true);
      await ajustarStock(
        ajusteStock.insumo.id,
        cantidad,
        ajusteStock.tipo,
        motivo
      );
      setToastType("success");
      setToastMessage("Stock actualizado correctamente.");
      setAjusteStock(null);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err.message || "No se pudo actualizar el stock.");
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarInsumosExcel({
        activo: activoBackend,
        stockBajo: stockBajoBackend,
        busqueda: terminoBusqueda || undefined,
      tipoInsumo: tipoInsumo || undefined,
      unidadMedidaId: unidadMedidaId || undefined,
      ubicacion: ubicacion.trim() || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "insumos.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastType("success");
      setToastMessage("Reporte de Excel generado correctamente");
    } catch {
      setToastType("danger");
      setToastMessage("No se pudo generar el reporte de Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  const descargarCatalogoPdf = async () => {
    try {
      setGenerandoCatalogoPdf(true);
      const insumosActivos = await obtenerInsumosActivos();
      const { crearCatalogoInsumosPdf } = await import("../utils/catalogoInsumosPdf.js");
      const resultado = await crearCatalogoInsumosPdf(insumosActivos, tiposDisponibles);
      resultado.pdf.save("catalogo-insumos-codigos-barras.pdf");
      setToastType("success");
      setToastMessage(`Catálogo generado: ${resultado.totalInsumos} insumos en ${resultado.totalSecciones} secciones.`);
    } catch (err) {
      setToastType("danger");
      setToastMessage(err?.message || "No se pudo generar el catálogo PDF.");
    } finally {
      setGenerandoCatalogoPdf(false);
    }
  };

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 0) return;
    if (totalPages > 0 && nuevaPagina >= totalPages) return;
    setPage(nuevaPagina);
  };

  const manejarOrden = (campo) => {
    setFiltros((actuales) => ({
      ...actuales,
      sortField: campo,
      sortDirection: actuales.sortField === campo && actuales.sortDirection === "asc" ? "desc" : "asc"
    }));
    setPage(0);
  };

  const cambiarBusqueda = (e) => {
    setFiltros((actuales) => ({ ...actuales, busquedaInput: e.target.value }));
    setPage(0);
  };

  const aplicarEstadoRapido = (estado) => {
    setFiltros((actuales) => ({ ...actuales, filtroEstatus: estado, soloActivos: false }));
    setPage(0);
  };

  const alternarStockBajo = () => {
    setFiltros((actuales) => ({ ...actuales, filtroStockBajo: !actuales.filtroStockBajo }));
    setPage(0);
  };

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    setPage(0);
  };

  const limpiarFiltros = () => {
    setFiltros((actuales) => ({
      ...actuales,
      busquedaInput: "",
      filtroEstatus: "TODOS",
      soloActivos: false,
      filtroStockBajo: false,
      tipoInsumo: "",
      unidadMedidaId: "",
      ubicacion: ""
    }));
    setPage(0);
  };

  const nombreTipoActivo = tiposDisponibles.find((tipo) => tipo.codigo === tipoInsumo)?.nombre || tipoInsumo;
  const nombreUnidadActiva = unidadesDisponibles.find((unidad) => String(unidad.id) === String(unidadMedidaId));

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      {mostrarConjuntos && (
        <ConjuntosDialog
          onClose={() => setMostrarConjuntos(false)}
          puedeCrear={puedeCrearConjuntos}
          puedeEditar={puedeEditarConjuntos}
        />
      )}
      <PageHeader
        title="Insumos"
        subtitle="Catalogo paginado de insumos y materia prima"
        actions={
          <div className="insumos-header-actions">
            {puedeVerConjuntos && <button type="button" className="btn btn-outline-primary" onClick={() => setMostrarConjuntos(true)}>
              <i className="bi bi-collection me-2" aria-hidden="true" />Conjuntos de insumos
            </button>}
            {puedeGestionarCostos && (
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => navigate("/insumos/costos")}
              >
                <i className="bi bi-cash-coin me-1"></i>
                Costos
              </button>
            )}
            <button
              className="btn btn-outline-success me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary me-2"
              onClick={descargarCatalogoPdf}
              disabled={generandoCatalogoPdf}
              title="Descargar todos los insumos activos, agrupados por tipo"
            >
              <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>
              {generandoCatalogoPdf ? "Generando PDF..." : "Catálogo PDF con códigos de barras"}
            </button>
            {puedeGestionarInsumos && (
              <button
                className="btn insumos-brand-primary"
                onClick={() => navigate("/insumos/nuevo")}
              >
                Nuevo insumo
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <section className="insumos-filter-card" aria-label="Filtros de insumos">
        <div className="insumos-filter-toolbar">
          <label className="insumos-filter-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar insumos por nombre, código o ubicación..."
              value={busquedaInput}
              onChange={cambiarBusqueda}
              aria-label="Buscar insumos"
            />
            {busquedaInput && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => cambiarBusqueda({ target: { value: "" } })}>
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="insumos-filter-views" role="group" aria-label="Vistas rápidas">
            <button
              type="button"
              className={filtroEstatus === "TODOS" && !soloActivos ? "is-active" : ""}
              onClick={() => aplicarEstadoRapido("TODOS")}
            >Todos</button>
            <button
              type="button"
              className={filtroEstatus === "ACTIVO" || soloActivos ? "is-active" : ""}
              onClick={() => aplicarEstadoRapido("ACTIVO")}
            ><i className="bi bi-check-circle" aria-hidden="true" /> Activos</button>
            <button
              type="button"
              className={filtroEstatus === "INACTIVO" ? "is-active" : ""}
              onClick={() => aplicarEstadoRapido("INACTIVO")}
            >Inactivos</button>
          </div>

          <div className="insumos-filter-actions">
            <details
              className="insumos-filter-builder"
              open={mostrarPanelFiltros}
              onToggle={(event) => setMostrarPanelFiltros(event.currentTarget.open)}
            >
              <summary className={filtrosAdicionalesActivos ? "has-filters" : ""}>
                <i className="bi bi-sliders2" aria-hidden="true" />
                <span>Filtros</span>
                {filtrosAdicionalesActivos > 0 && <b>{filtrosAdicionalesActivos}</b>}
                <i className="bi bi-chevron-down filter-chevron" aria-hidden="true" />
              </summary>
              <div className="insumos-filter-popover">
                <div className="insumos-filter-popover-heading">
                  <div>
                    <strong>Filtrar insumos</strong>
                    <span>Combina criterios para afinar resultados</span>
                  </div>
                  <i className="bi bi-sliders2-vertical" aria-hidden="true" />
                </div>
                <FiltroDropdown
                  icono="bi-tag"
                  etiqueta="Tipo de insumo"
                  valor={tipoInsumo}
                  placeholder="Cualquier tipo"
                  opciones={[
                    { valor: "", etiqueta: "Cualquier tipo" },
                    ...tiposDisponibles.map((tipo) => ({ valor: tipo.codigo, etiqueta: tipo.nombre }))
                  ]}
                  alCambiar={(valor) => actualizarFiltro("tipoInsumo", valor)}
                />
                <FiltroDropdown
                  icono="bi-rulers"
                  etiqueta="Unidad de medida"
                  valor={unidadMedidaId}
                  placeholder="Cualquier unidad"
                  opciones={[
                    { valor: "", etiqueta: "Cualquier unidad" },
                    ...unidadesDisponibles.map((unidad) => ({
                      valor: unidad.id,
                      etiqueta: `${unidad.nombre}${unidad.simbolo ? ` (${unidad.simbolo})` : ""}`
                    }))
                  ]}
                  alCambiar={(valor) => actualizarFiltro("unidadMedidaId", valor)}
                />
                <label className="insumos-filter-field">
                  <span><i className="bi bi-geo-alt" aria-hidden="true" /> Ubicación</span>
                  <input
                    type="text"
                    placeholder="Ej. Almacén A, estante 2..."
                    value={ubicacion}
                    onChange={(event) => actualizarFiltro("ubicacion", event.target.value)}
                  />
                </label>
                <div className="insumos-filter-popover-footer">
                  <span>Los filtros se aplican al instante</span>
                  <button type="button" onClick={() => setMostrarPanelFiltros(false)}>Listo</button>
                </div>
              </div>
            </details>

            <button
              type="button"
              className={`insumos-filter-stock ${filtroStockBajo ? "is-active" : ""}`}
              onClick={alternarStockBajo}
              aria-pressed={filtroStockBajo}
            >
              <i className="bi bi-exclamation-triangle" aria-hidden="true" /> Stock bajo
            </button>
          </div>
        </div>

        {(hayFiltrosActivos || totalFiltrosActivos > 0) && (
          <div className="insumos-active-filters">
            <span className="insumos-active-label"><i className="bi bi-funnel" aria-hidden="true" /> Aplicados</span>
            {terminoBusqueda && <span className="insumos-filter-chip"><b>Búsqueda</b> {terminoBusqueda}</span>}
            {(filtroEstatus !== "TODOS" || soloActivos) && (
              <button type="button" className="insumos-filter-chip" onClick={() => aplicarEstadoRapido("TODOS")}>
                <b>Estado</b> {soloActivos || filtroEstatus === "ACTIVO" ? "Activo" : "Inactivo"}<i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
            {nombreTipoActivo && (
              <button type="button" className="insumos-filter-chip" onClick={() => actualizarFiltro("tipoInsumo", "")}>
                <b>Tipo</b> {nombreTipoActivo}<i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
            {nombreUnidadActiva && (
              <button type="button" className="insumos-filter-chip" onClick={() => actualizarFiltro("unidadMedidaId", "")}>
                <b>Unidad</b> {nombreUnidadActiva.simbolo || nombreUnidadActiva.nombre}<i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
            {ubicacion.trim() && (
              <button type="button" className="insumos-filter-chip" onClick={() => actualizarFiltro("ubicacion", "")}>
                <b>Ubicación</b> {ubicacion.trim()}<i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
            {filtroStockBajo && (
              <button type="button" className="insumos-filter-chip" onClick={alternarStockBajo}>
                <b>Inventario</b> Stock bajo<i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
            <button type="button" className="insumos-clear-filters" onClick={limpiarFiltros}>Limpiar todo</button>
          </div>
        )}
      </section>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 insumos-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-boxes fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay insumos registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Crea el primer insumo para alimentar compras y estructuras de costos
            </p>
          </div>
        </div>
      ) : (
        <div className="insumos-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 insumos-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver insumos en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <InsumosTable
              data={insumos}
              onEditar={abrirEditar}
              onVerKardex={abrirKardex}
              onCambiarEstado={manejarCambiarEstado}
              onAjustarStock={abrirAjusteStock}
              puedeGestionar={puedeGestionarInsumos}
              puedeAjustarStock={puedeAjustarStock}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="insumos-pagination-panel">
              <div className="insumos-pagination-summary">
                {`Mostrando ${desde} a ${hasta} de ${totalElements} insumos`}
              </div>

              <nav aria-label="Paginacion de insumos">
                <ul className="pagination mb-0 flex-wrap">
                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(0)}
                      disabled={page <= 0}
                    >
                      Primera
                    </button>
                  </li>

                  <li className={`page-item ${page <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(page - 1)}
                      disabled={page <= 0}
                    >
                      Anterior
                    </button>
                  </li>

                  {paginasVisibles.map((pagina, index) => (
                    pagina === "..." ? (
                      <li key={`dots-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li
                        key={`page-${pagina}`}
                        className={`page-item ${page === pagina ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => irAPagina(pagina)}
                        >
                          {pagina + 1}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Siguiente
                    </button>
                  </li>

                  <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Ultima
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}

      {ajusteStock && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content border-0 shadow-lg" onSubmit={confirmarAjusteStock}>
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Ajuste manual de stock</h5>
                    <small className="text-muted">{ajusteStock.insumo.nombre}</small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    disabled={guardandoAjuste}
                    onClick={cerrarAjusteStock}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    Stock actual: <strong>{Number(ajusteStock.insumo.stockActual || 0).toFixed(2)}</strong>.
                    Esta acción quedará registrada en Kardex.
                  </div>
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Tipo de ajuste</label>
                      <select
                        className="form-select"
                        value={ajusteStock.tipo}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, tipo: event.target.value }))}
                      >
                        <option value="ENTRADA">Entrada</option>
                        <option value="SALIDA">Salida</option>
                      </select>
                    </div>
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="form-control"
                        value={ajusteStock.cantidad}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, cantidad: event.target.value }))}
                        placeholder="0.00"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Motivo *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        maxLength="500"
                        value={ajusteStock.motivo}
                        onChange={(event) => setAjusteStock((actual) => ({ ...actual, motivo: event.target.value }))}
                        placeholder="Describe por qué se realiza el ajuste"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={cerrarAjusteStock} disabled={guardandoAjuste}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={guardandoAjuste}>
                    {guardandoAjuste ? "Actualizando..." : "Confirmar ajuste"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
