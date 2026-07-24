import "./ProductosListadoTable.css";
import { API_BASE_URL } from "../../../../../config/apiConfig.js";
import CatalogRowActions from "../../../../../components/ui/CatalogRowActions.jsx";
import CatalogStatusBadge from "../../../../../components/ui/CatalogStatusBadge.jsx";

const COLUMNAS_ORDENABLES = {
  sku: "SKU",
  nombre: "Descripcion",
  lineaNombre: "Linea",
  familiaNombre: "Familia",
  subfamiliaNombre: "Subfamilia",
  modeloNombre: "Modelo",
  nivelNombre: "Nivel",
  materialNombre: "Material",
  colorNombre: "Color",
  activo: "Estado"
};

function obtenerIconoOrden(sortField, sortDirection, field) {
  if (sortField !== field) {
    return "bi bi-arrow-down-up text-secondary";
  }

  return sortDirection === "asc"
    ? "bi bi-sort-down-alt text-primary"
    : "bi bi-sort-up text-primary";
}

const getProductoId = (producto) =>
  producto?.id || producto?.productoId || producto?.id_producto || null;

const getEtiquetaEntidad = (fuentes = []) => {
  for (const fuente of fuentes) {
    if (!fuente) continue;

    if (typeof fuente === "string") {
      const texto = String(fuente).trim();
      if (texto && !/^\d+$/.test(texto)) return texto;
      continue;
    }

    if (typeof fuente === "number") {
      continue;
    }

    const nombre = fuente?.nombre || fuente?.name || "";

    if (nombre) return nombre;
  }

  return "-";
};

const getProductoBaseNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.nombre_modelo,
    producto?.productoBaseNombre,
    producto?.modeloNombre,
    producto?.productoBase?.nombre,
    producto?.modelo?.nombre,
    producto?.productoBase,
    producto?.modelo
  ]);

const getLineaNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.lineaNombre,
    producto?.linea?.nombre,
    producto?.modelo?.familia?.linea?.nombre,
    producto?.familia?.linea?.nombre,
    producto?.linea
  ]);

const getFamiliaNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.familiaNombre,
    producto?.familia?.nombre,
    producto?.modelo?.familia?.nombre,
    producto?.productoBase?.familia?.nombre,
    producto?.familia
  ]);

const getSubfamiliaNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.subfamiliaNombre,
    producto?.subfamilia?.nombre,
    producto?.modelo?.subfamilia?.nombre,
    producto?.productoBase?.subfamilia?.nombre,
    producto?.subfamilia
  ]);

const getNivelNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.nombre_nivel,
    producto?.nivelNombre,
    producto?.categoriaNombre,
    producto?.nivel?.nombre,
    producto?.categoria?.nombre,
    producto?.nivel,
    producto?.categoria
  ]);

const getColorNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.nombre_color,
    producto?.colorNombre,
    producto?.color?.nombre,
    producto?.color
  ]);

const getMaterialNombre = (producto) =>
  getEtiquetaEntidad([
    producto?.nombre_material,
    producto?.materialNombre,
    producto?.material?.nombre,
    producto?.material
  ]);

const getImagenActiva = (imagen) =>
  imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenRepresentativa = (producto) => {
  const directa = producto?.imagenPrincipal || null;

  if (directa?.url) return directa;

  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes : [];
  const principalActiva = imagenes.find(
    (imagen) => Boolean(imagen?.esPrincipal || imagen?.principal) && getImagenActiva(imagen) && imagen?.url
  );

  if (principalActiva) return principalActiva;

  const imagenPorColor = imagenes.find((imagen) => getImagenActiva(imagen) && imagen?.url);
  if (imagenPorColor) return imagenPorColor;

  const urlDirecta =
    producto?.imagenPrincipalUrl ||
    producto?.imagenUrl ||
    producto?.urlImagen ||
    producto?.fotoUrl ||
    "";

  if (urlDirecta) return { url: urlDirecta, altTexto: producto?.nombre || producto?.sku };

  const directaLegacy =
    producto?.imagen ||
    producto?.foto ||
    null;

  if (directaLegacy?.url) return directaLegacy;

  return null;
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

export default function ProductosListadoTable({
  data,
  onEditar,
  onCambiarEstado,
  sortField = "sku",
  sortDirection = "asc",
  onSort
}) {
  const renderHeader = (field, label) => {
    const esOrdenable = Boolean(onSort) && Object.prototype.hasOwnProperty.call(COLUMNAS_ORDENABLES, field);
    const ariaSort =
      sortField === field
        ? sortDirection === "asc"
          ? "ascending"
          : "descending"
        : "none";

    return (
      <th aria-sort={ariaSort}>
        {esOrdenable ? (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none catalog-sort-button productos-sort-button"
            onClick={() => onSort(field)}
          >
            <span>{label}</span>
            <i className={`${obtenerIconoOrden(sortField, sortDirection, field)} ms-2`}></i>
          </button>
        ) : (
          label
        )}
      </th>
    );
  };

  return (
    <div className="card shadow-sm border-0 catalog-table-card variantes-table-card productos-table-card">
      <div className="table-responsive catalog-table-scroll variantes-table-wrap productos-table-scroll">
        <table className="table table-hover align-middle mb-0 variantes-table">
          <colgroup>
            <col className="variantes-col-imagen" />
            <col className="variantes-col-sku" />
            <col className="variantes-col-descripcion" />
            <col className="variantes-col-linea" />
            <col className="variantes-col-familia" />
            <col className="variantes-col-subfamilia" />
            <col className="variantes-col-modelo" />
            <col className="variantes-col-nivel" />
            <col className="variantes-col-material" />
            <col className="variantes-col-color" />
            <col className="variantes-col-estado" />
            <col className="variantes-col-acciones" />
          </colgroup>
          <thead className="table-light catalog-table-head productos-table-head">
            <tr>
              <th>Imagen</th>
              {renderHeader("sku", "SKU")}
              {renderHeader("nombre", "Descripcion")}
              {renderHeader("lineaNombre", "Linea")}
              {renderHeader("familiaNombre", "Familia")}
              {renderHeader("subfamiliaNombre", "Subfamilia")}
              {renderHeader("modeloNombre", "Modelo")}
              {renderHeader("nivelNombre", "Nivel")}
              {renderHeader("materialNombre", "Material")}
              {renderHeader("colorNombre", "Color")}
              {renderHeader("activo", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((producto) => {
                const productoId = getProductoId(producto);
                const imagen = getImagenRepresentativa(producto);
                const imagenUrl = toPreviewUrl(imagen?.url);
                const estaActivo = Boolean(producto?.activo);

                return (
                  <tr
                    key={productoId || producto?.sku}
                    className="catalog-table-row productos-table-row"
                    style={{ cursor: onEditar ? "pointer" : "default" }}
                    onClick={() => onEditar?.(producto)}
                  >
                    <td>
                      {imagenUrl ? (
                        <img
                          className="variantes-table-image"
                          src={imagenUrl}
                          alt={imagen?.altTexto || producto?.nombre || producto?.sku || "Producto"}
                        />
                      ) : (
                        <div
                          className="variantes-table-image-placeholder"
                          title="Sin imagen"
                        >
                          N/A
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary variantes-table-sku">{producto?.sku || "-"}</span>
                    </td>
                    <td>
                      <div className="fw-semibold variantes-table-title">{producto?.nombre || "-"}</div>
                      {producto?.descripcion && (
                        <small className="text-muted variantes-table-description">
                          {producto.descripcion.length > 70
                            ? `${producto.descripcion.substring(0, 70)}...`
                            : producto.descripcion}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getLineaNombre(producto)}>
                        {getLineaNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getFamiliaNombre(producto)}>
                        {getFamiliaNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getSubfamiliaNombre(producto)}>
                        {getSubfamiliaNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getProductoBaseNombre(producto)}>
                        {getProductoBaseNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getNivelNombre(producto)}>
                        {getNivelNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getMaterialNombre(producto)}>
                        {getMaterialNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <span className="variantes-table-chip-text" title={getColorNombre(producto)}>
                        {getColorNombre(producto)}
                      </span>
                    </td>
                    <td>
                      <CatalogStatusBadge active={producto?.activo} />
                    </td>
                    <td className="catalog-actions productos-actions">
                      <CatalogRowActions
                        item={producto}
                        active={estaActivo}
                        onEdit={onEditar}
                        onToggle={onCambiarEstado}
                        editDisabled={!onEditar}
                        toggleDisabled={!onCambiarEstado || !productoId}
                        className="variantes-table-actions"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="12" className="text-center text-muted py-5">
                  <i className="bi bi-box fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay productos registrados</span>
                  <p className="text-secondary mt-2">Crea un producto para comenzar</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
