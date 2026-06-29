import { useCallback, useRef, useState } from "react";

import CatalogRowActions from "../../../components/ui/CatalogRowActions.jsx";

const COLUMNAS_ORDENABLES = {
  id: "ID",
  nombre: "Nombre",
  ubicacion: "Ubicacion",
  stockActual: "Stock actual",
  stockMinimo: "Stock minimo",
  costoCotizacion: "Costo cotizacion",
  fechaRegistro: "Creado"
};

// Columnas (id estable) + ancho por defecto en px. El orden debe coincidir
// con el de las celdas del <tbody>.
const COLUMNAS = [
  { id: "estado", label: "Estado", defaultWidth: 52 },
  { id: "id", label: "ID", sortField: "id", defaultWidth: 60 },
  { id: "codigo", label: "Codigo", defaultWidth: 130 },
  { id: "nombre", label: "Nombre", sortField: "nombre", defaultWidth: 150 },
  { id: "descripcion", label: "Descripcion", defaultWidth: 130 },
  { id: "tipo", label: "Tipo", defaultWidth: 110 },
  { id: "ubicacion", label: "Ubicacion", sortField: "ubicacion", defaultWidth: 110 },
  { id: "unidad", label: "Unidad", defaultWidth: 80 },
  { id: "stockActual", label: "Stock actual", sortField: "stockActual", defaultWidth: 90 },
  { id: "stockMinimo", label: "Stock minimo", sortField: "stockMinimo", defaultWidth: 90 },
  { id: "ultimoCosto", label: "Ultimo costo", defaultWidth: 100 },
  { id: "costoPromedio", label: "Costo promedio", defaultWidth: 100 },
  { id: "costoCotizacion", label: "Costo cotizacion", sortField: "costoCotizacion", defaultWidth: 100 },
  { id: "acciones", label: "Acciones", defaultWidth: 180 }
];

const STORAGE_KEY = "insumos-columnas-ancho-v2";
const ANCHO_MINIMO = 60;

function anchosPorDefecto() {
  return COLUMNAS.reduce((acc, col) => {
    acc[col.id] = col.defaultWidth;
    return acc;
  }, {});
}

function cargarAnchos() {
  if (typeof window === "undefined") return anchosPorDefecto();

  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (!guardado) return anchosPorDefecto();

    const parseado = JSON.parse(guardado);
    return { ...anchosPorDefecto(), ...parseado };
  } catch {
    return anchosPorDefecto();
  }
}

function obtenerIconoOrden(sortField, sortDirection, field) {
  if (sortField !== field) {
    return "bi bi-arrow-down-up text-secondary";
  }

  return sortDirection === "asc"
    ? "bi bi-sort-down-alt text-primary"
    : "bi bi-sort-up text-primary";
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

export default function InsumosTable({
  data,
  onEditar,
  onVerKardex,
  onCambiarEstado,
  puedeGestionar = false,
  sortField = "nombre",
  sortDirection = "asc",
  onSort
}) {
  const [anchos, setAnchos] = useState(cargarAnchos);
  const dragRef = useRef(null);

  const persistir = useCallback((valores) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
    } catch {
      // localStorage no disponible: ignorar
    }
  }, []);

  const restablecerColumnas = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorar
    }
    setAnchos(anchosPorDefecto());
  }, []);

  const iniciarResize = useCallback(
    (e, columnaId) => {
      e.preventDefault();
      e.stopPropagation();

      const xInicial = e.clientX;
      const anchoInicial = anchos[columnaId] ?? ANCHO_MINIMO;

      const onMouseMove = (moveEvent) => {
        const delta = moveEvent.clientX - xInicial;
        const nuevoAncho = Math.max(ANCHO_MINIMO, anchoInicial + delta);
        setAnchos((prev) => {
          const siguiente = { ...prev, [columnaId]: nuevoAncho };
          dragRef.current = siguiente;
          return siguiente;
        });
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        if (dragRef.current) {
          persistir(dragRef.current);
          dragRef.current = null;
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [anchos, persistir]
  );

  const getStockStatus = (insumo) => {
    if (insumo.stockActual <= 0) return "agotado";
    if (insumo.stockMinimo && insumo.stockActual <= insumo.stockMinimo) return "bajo";
    return "normal";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatTipoInsumo = (value) => {
    if (!value) return "-";
    return String(value).replace(/_/g, " ");
  };

  const getEstadoDot = (insumo, stockStatus) => {
    if (!insumo.activo) {
      return { modificador: "inactivo", etiqueta: "Inactivo" };
    }
    if (stockStatus === "agotado") {
      return { modificador: "agotado", etiqueta: "Agotado" };
    }
    if (stockStatus === "bajo") {
      return { modificador: "bajo", etiqueta: "Stock bajo" };
    }
    return { modificador: "activo", etiqueta: "Activo" };
  };

  const renderHeaderColumna = (columna) => {
    const { id, label, sortField: field } = columna;
    const esOrdenable =
      Boolean(onSort) &&
      Boolean(field) &&
      Object.prototype.hasOwnProperty.call(COLUMNAS_ORDENABLES, field);
    const ariaSort =
      field && sortField === field
        ? sortDirection === "asc"
          ? "ascending"
          : "descending"
        : "none";

    return (
      <th key={id} aria-sort={ariaSort}>
        {esOrdenable ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none insumos-sort-button"
            onClick={() => onSort(field)}
          >
            {renderHeaderLabel(label)}
            <i className={`${obtenerIconoOrden(sortField, sortDirection, field)} ms-2`}></i>
          </button>
        ) : (
          renderHeaderLabel(label)
        )}
        <span
          className="insumos-col-resizer"
          role="separator"
          aria-orientation="vertical"
          onMouseDown={(e) => iniciarResize(e, id)}
          onClick={(e) => e.stopPropagation()}
        />
      </th>
    );
  };

  return (
    <>
      <div className="card shadow-sm border-0 insumos-table-card">
        <div className="insumos-table-toolbar">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none insumos-reset-columnas"
            onClick={restablecerColumnas}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i>
            Restablecer columnas
          </button>
        </div>
        <div className="table-responsive insumos-table-scroll">
          <table className="table table-hover align-middle mb-0 insumos-main-table">
            <colgroup>
              {COLUMNAS.map((columna) => (
                <col
                  key={columna.id}
                  style={{ width: `${anchos[columna.id] ?? columna.defaultWidth}px` }}
                />
              ))}
            </colgroup>
            <thead className="table-light insumos-table-head">
              <tr>{COLUMNAS.map((columna) => renderHeaderColumna(columna))}</tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((insumo) => {
                  const stockStatus = getStockStatus(insumo);
                  const estadoDot = getEstadoDot(insumo, stockStatus);
                  return (
                    <tr
                      key={insumo.id}
                      onClick={() => onVerKardex?.(insumo)}
                      className={`insumos-table-row insumos-row-${stockStatus}`}
                      role="button"
                    >
                      <td className="insumos-estado-cell">
                        <span
                          className={`insumos-estado-dot insumos-estado-dot--${estadoDot.modificador}`}
                          title={estadoDot.etiqueta}
                          aria-label={estadoDot.etiqueta}
                          role="img"
                        />
                      </td>
                      <td className="text-muted">#{insumo.id}</td>
                      <td>
                        <span className="insumos-code-badge">
                          <i className="bi bi-upc-scan me-1"></i>
                          {insumo.codigoBarras || "-"}
                        </span>
                      </td>
                      <td>
                        <span>{insumo.nombre}</span>
                      </td>
                      <td className="insumos-description">
                        {insumo.descripcion || "-"}
                      </td>
                      <td>
                        <span className="badge text-bg-light border insumos-unit-badge">
                          {formatTipoInsumo(insumo.tipoInsumo)}
                        </span>
                      </td>
                      <td>
                        {insumo.ubicacion || "-"}
                        {insumo.fila && insumo.columna ? ` (${insumo.fila}-${insumo.columna})` : ""}
                      </td>
                      <td>
                        <span className="badge text-bg-light border insumos-unit-badge">
                          {insumo.unidadMedida?.simbolo || insumo.unidadMedida?.nombre || "-"}
                        </span>
                      </td>
                      <td className={`text-end insumos-stock-${stockStatus}`}>
                        {Number(insumo.stockActual || 0).toFixed(2)}
                      </td>
                      <td className="text-end">
                        {insumo.stockMinimo !== null && insumo.stockMinimo !== undefined
                          ? Number(insumo.stockMinimo).toFixed(2)
                          : "-"}
                      </td>
                      <td className="text-end">
                        <span className="text-secondary">
                          {formatCurrency(insumo.ultimoCostoCompra)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="text-primary">
                          {formatCurrency(insumo.costoPromedio)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className={Number(insumo.costoCotizacion || 0) > 0 ? "text-success" : "text-danger"}>
                          {formatCurrency(insumo.costoCotizacion)}
                        </span>
                      </td>
                      <td className="insumos-actions">
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          {puedeGestionar && (
                            <CatalogRowActions
                              item={insumo}
                              active={insumo.activo}
                              onEdit={onEditar}
                              onToggle={onCambiarEstado}
                              className="insumos-row-actions"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
                ) : (
                <tr>
                  <td colSpan="14" className="text-center text-muted py-5">
                    <i className="bi bi-boxes fs-1 d-block mb-3 text-secondary"></i>
                    <span className="fs-5 d-block">No hay insumos registrados</span>
                    <p className="text-secondary mt-2 mb-0">Comienza creando un nuevo insumo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  );
}
