// pages/TiposProducto/TipoProductoFormPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModelosForm from "./ModelosForm.jsx";
import { obtenerProductos } from "../../services/productos.js";
import ProductoRapidoDrawer from "./ProductoRapidoDrawer.jsx";
import "./ModelosPage.css";

const API_BASE_URL = "http://localhost:8081";

const extraerListaProductos = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return (
    respuesta?.content ||
    respuesta?.productos ||
    respuesta?.data ||
    respuesta?.items ||
    []
  );
};

const obtenerModeloRelacionadoId = (producto) =>
  producto?.modeloId ||
  producto?.id_modelo ||
  producto?.modelo_id ||
  producto?.producto_base_id ||
  producto?.productoBaseId ||
  producto?.modelo?.id ||
  producto?.productoBase?.id ||
  null;

const getEtiquetaTexto = (fuentes = []) => {
  for (const fuente of fuentes) {
    if (!fuente) continue;

    if (typeof fuente === "string") {
      const texto = fuente.trim();
      if (texto) return texto;
      continue;
    }

    if (typeof fuente === "object") {
      const nombre = fuente?.nombre || fuente?.name || fuente?.descripcion || "";
      if (typeof nombre === "string" && nombre.trim()) return nombre.trim();
    }
  }

  return "-";
};

const getCategoriaProducto = (producto) =>
  getEtiquetaTexto([
    producto?.nombre_nivel,
    producto?.nivelNombre,
    producto?.categoriaNombre,
    producto?.nivel?.nombre,
    producto?.categoria?.nombre,
    producto?.nivel,
    producto?.categoria
  ]);

const getColorProducto = (producto) =>
  getEtiquetaTexto([
    producto?.nombre_color,
    producto?.colorNombre,
    producto?.color?.nombre,
    producto?.color
  ]);

const getProductoImagen = (producto) => {
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

  if (urlDirecta) {
    return {
      url: urlDirecta,
      altTexto: producto?.nombre || producto?.sku || "Producto"
    };
  }

  const imagenes = Array.isArray(producto?.imagenes) ? producto.imagenes : [];
  const principal = imagenes.find((imagen) => Boolean(imagen?.esPrincipal || imagen?.principal) && imagen?.url);

  if (principal) return principal;

  return imagenes.find((imagen) => imagen?.url) || null;
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

export default function ModelosFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState("");
  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);

  const cargarProductosDelModelo = useCallback(
    async (debeContinuar = () => true) => {
      if (!esEdicion || !id) {
        if (debeContinuar()) {
          setProductos([]);
          setErrorProductos("");
        }
        return;
      }

      try {
        if (debeContinuar()) {
          setLoadingProductos(true);
          setErrorProductos("");
        }

        const respuesta = await obtenerProductos();
        const lista = extraerListaProductos(respuesta);
        const filtrados = lista.filter(
          (producto) => String(obtenerModeloRelacionadoId(producto) ?? "") === String(id)
        );

        if (debeContinuar()) {
          setProductos(filtrados);
        }
      } catch (error) {
        if (debeContinuar()) {
          setErrorProductos("No se pudieron cargar los productos de este modelo");
          setProductos([]);
          console.error("Error cargando productos del modelo:", error);
        }
      } finally {
        if (debeContinuar()) {
          setLoadingProductos(false);
        }
      }
    },
    [id, esEdicion]
  );

  useEffect(() => {
    let cancelado = false;
    cargarProductosDelModelo(() => !cancelado);

    return () => {
      cancelado = true;
    };
  }, [cargarProductosDelModelo]);

  const totalProductos = useMemo(() => productos.length, [productos]);

  return (
    <div className="container mt-4 modelos-page-shell">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Modelo" : "Nuevo Modelo"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/modelos")}>
          Volver
        </button>
      </div>

      <div className="card mb-4 modelos-table-card">
        <div className="card-body">
          <ModelosForm modeloId={id} />
        </div>
      </div>

      {esEdicion && (
        <div className="card modelos-table-card">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <h5 className="mb-0">Productos de este modelo</h5>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary">{totalProductos}</span>
                <button
                  type="button"
                  className="btn btn-sm modelos-brand-primary px-3"
                  onClick={() => setMostrarNuevoProducto(true)}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Nuevo producto
                </button>
              </div>
            </div>

            {loadingProductos ? (
              <div className="text-muted">Cargando productos...</div>
            ) : errorProductos ? (
              <div className="alert alert-danger mb-0">{errorProductos}</div>
            ) : productos.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>SKU</th>
                      <th>Nombre</th>
                      <th>Nivel/Categoría</th>
                      <th>Color</th>
                      <th>Imagen</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr
                        key={producto.id}
                        role="button"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/productos/${producto.id}`)}
                      >
                        <td>
                          <span className="badge bg-secondary">{producto.sku || "-"}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{producto.nombre || "-"}</div>
                          <small className="text-muted">{producto.descripcion || ""}</small>
                        </td>
                        <td>{getCategoriaProducto(producto)}</td>
                        <td>{getColorProducto(producto)}</td>
                        <td>
                          {(() => {
                            const imagen = getProductoImagen(producto);
                            const imagenUrl = toPreviewUrl(imagen?.url);

                            return imagenUrl ? (
                              <img
                                src={imagenUrl}
                                alt={imagen?.altTexto || producto.nombre || producto.sku || "Producto"}
                                style={{
                                  width: "52px",
                                  height: "52px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #dee2e6"
                                }}
                              />
                            ) : (
                              <div
                                className="d-inline-flex align-items-center justify-content-center bg-light text-muted border rounded"
                                style={{ width: "52px", height: "52px", fontSize: "11px" }}
                                title="Sin imagen"
                              >
                                N/A
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              producto.activo
                                ? "bg-success-subtle text-success border border-success-subtle"
                                : "bg-secondary-subtle text-secondary border border-secondary-subtle"
                            }`}
                          >
                            {producto.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className="btn btn-outline-info"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/productos/${producto.id}`);
                              }}
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">
                Este modelo todavía no tiene productos asociados.
              </div>
            )}
          </div>
        </div>
      )}

      <ProductoRapidoDrawer
        show={mostrarNuevoProducto}
        modeloId={id}
        onClose={() => setMostrarNuevoProducto(false)}
        onSaved={async () => {
          setMostrarNuevoProducto(false);
          await cargarProductosDelModelo();
        }}
      />
    </div>
  );
}
