import "./VariantesTable.css";

const API_BASE_URL = "http://localhost:8081";

const getVarianteId = (variante) =>
  variante?.id || variante?.varianteId || variante?.id_variante || null;

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

const getModeloNombre = (variante) =>
  getEtiquetaEntidad([
    variante?.productoBaseNombre,
    variante?.modeloNombre,
    variante?.productoBase?.nombre,
    variante?.modelo?.nombre,
    variante?.productoBase,
    variante?.modelo
  ]);

const getCategoriaNombre = (variante) =>
  getEtiquetaEntidad([
    variante?.nivelNombre,
    variante?.categoriaNombre,
    variante?.nivel?.nombre,
    variante?.categoria?.nombre,
    variante?.nivel,
    variante?.categoria
  ]);

const getColorNombre = (variante) =>
  getEtiquetaEntidad([
    variante?.colorNombre,
    variante?.color?.nombre,
    variante?.color
  ]);

const getImagenActiva = (imagen) =>
  imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenRepresentativa = (variante) => {
  const directa =
    variante?.imagenPrincipal ||
    variante?.imagen ||
    variante?.foto ||
    null;

  if (directa?.url) return directa;

  const urlDirecta =
    variante?.imagenPrincipalUrl ||
    variante?.imagenUrl ||
    variante?.urlImagen ||
    variante?.fotoUrl ||
    "";

  if (urlDirecta) return { url: urlDirecta, altTexto: variante?.nombre || variante?.sku };

  const imagenes = Array.isArray(variante?.imagenes) ? variante.imagenes : [];
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
              <th>Descripcion</th>
              <th>Modelo</th>
              <th>Nivel</th>
              <th>Color</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((variante) => {
                const varianteId = getVarianteId(variante);
                const imagen = getImagenRepresentativa(variante);
                const imagenUrl = toPreviewUrl(imagen?.url);

                return (
                  <tr
                    key={varianteId || variante?.sku}
                    style={{ cursor: onEditar ? "pointer" : "default" }}
                    onClick={() => onEditar?.(variante)}
                  >
                    <td>
                      {imagenUrl ? (
                        <img
                          className="variantes-table-image"
                          src={imagenUrl}
                          alt={imagen?.altTexto || variante?.nombre || variante?.sku || "Variante"}
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
                      <span className="badge bg-secondary variantes-table-sku">{variante?.sku || "-"}</span>
                    </td>
                    <td>
                      <div className="fw-semibold variantes-table-title">{variante?.nombre || "-"}</div>
                      {variante?.descripcion && (
                        <small className="text-muted variantes-table-description">
                          {variante.descripcion.length > 70
                            ? `${variante.descripcion.substring(0, 70)}...`
                            : variante.descripcion}
                        </small>
                      )}
                    </td>
                    <td>{getModeloNombre(variante)}</td>
                    <td>{getCategoriaNombre(variante)}</td>
                    <td>{getColorNombre(variante)}</td>
                    <td>
                      <span
                        className={
                          variante?.activo
                            ? "badge bg-success-subtle text-success border border-success-subtle"
                            : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                        }
                      >
                        {variante?.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>{formatFecha(variante?.createdAt || variante?.fechaCreacion)}</td>
                    <td>
                      <div className="variantes-table-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditar?.(variante);
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
                            onEliminar?.(varianteId);
                          }}
                          disabled={!onEliminar || !varianteId}
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
                  <i className="bi bi-tags fs-1 d-block mb-3 text-secondary"></i>
                  <span className="fs-5">No hay variantes registradas</span>
                  <p className="text-secondary mt-2">Crea un producto para generar sus variantes</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
