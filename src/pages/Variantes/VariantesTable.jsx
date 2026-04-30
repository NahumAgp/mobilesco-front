import "./VariantesTable.css";

const API_BASE_URL = "http://localhost:8081";

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

const getImagenActiva = (imagen) =>
  imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenRepresentativa = (producto) => {
  const directa =
    producto?.imagenPrincipal ||
    producto?.imagen ||
    producto?.foto ||
    null;

  if (directa?.url) return directa;

  const urlDirecta =
    producto?.imagenPrincipalUrl ||
    producto?.imagenUrl ||
    producto?.urlImagen ||
    producto?.fotoUrl ||
    "";

  if (urlDirecta) return { url: urlDirecta, altTexto: producto?.nombre || producto?.sku };

  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes : [];
  const principalActiva = imagenes.find(
    (imagen) => Boolean(imagen?.esPrincipal || imagen?.principal) && getImagenActiva(imagen) && imagen?.url
  );

  if (principalActiva) return principalActiva;

  return imagenes.find((imagen) => getImagenActiva(imagen) && imagen?.url) || null;
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const formatFecha = (valor) => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "-";

  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

export default function VariantesTable({ data, onEditar, onEliminar }) {
  return (
    <div className="card variantes-table-card">
      <div
        className="table-responsive variantes-table-wrap"
      >
        <table className="table table-hover align-middle mb-0 variantes-table">
          <colgroup>
            <col className="variantes-col-imagen" />
            <col className="variantes-col-sku" />
            <col className="variantes-col-descripcion" />
            <col className="variantes-col-modelo" />
            <col className="variantes-col-nivel" />
            <col className="variantes-col-color" />
            <col className="variantes-col-estado" />
            <col className="variantes-col-fecha" />
            <col className="variantes-col-acciones" />
          </colgroup>
          <thead
            className="table-light"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2
            }}
          >
            <tr>
              <th>Imagen</th>
              <th>SKU</th>
              <th>Descripción</th>
              <th>Producto Base</th>
              <th>Nivel</th>
              <th>Color</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((producto) => {
                const productoId = getProductoId(producto);
                const imagen = getImagenRepresentativa(producto);
                const imagenUrl = toPreviewUrl(imagen?.url);

                return (
                  <tr
                    key={productoId || producto?.sku}
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
                    <td>{getProductoBaseNombre(producto)}</td>
                    <td>{getNivelNombre(producto)}</td>
                    <td>{getColorNombre(producto)}</td>
                    <td>
                      <span
                        className={
                          producto?.activo
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {producto?.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>{formatFecha(producto?.createdAt || producto?.updatedAt || producto?.fechaCreacion)}</td>
                    <td>
                      <div className="variantes-table-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditar?.(producto);
                          }}
                          disabled={!onEditar}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEliminar?.(productoId);
                          }}
                          disabled={!onEliminar || !productoId}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted py-5">
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
