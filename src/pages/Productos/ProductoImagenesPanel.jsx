import { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import {
  actualizarImagen,
  construirUrlImagen,
  eliminarImagen,
  obtenerImagenesPorProducto,
  subirImagenProducto,
} from "../../services/imagenes.js";

function nombreArchivo(url) {
  if (!url) return "Imagen";
  const partes = url.split("/");
  return decodeURIComponent(partes[partes.length - 1] || "Imagen");
}

export default function ProductoImagenesPanel({ productoId }) {
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState([]);
  const [altTexto, setAltTexto] = useState("");

  const cargarImagenes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await obtenerImagenesPorProducto(productoId);
      setImagenes(Array.isArray(data) ? data : data?.content || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las imágenes del producto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productoId) return;
    cargarImagenes();
  }, [productoId]);

  const handleSeleccion = (e) => {
    setArchivoSeleccionado(Array.from(e.target.files || []));
  };

  const subirArchivos = async () => {
    if (!archivoSeleccionado.length) return;

    try {
      setSubiendo(true);
      setMensaje("");

      for (let index = 0; index < archivoSeleccionado.length; index += 1) {
        const archivo = archivoSeleccionado[index];
        await subirImagenProducto(productoId, archivo, {
          esPrincipal: imagenes.length === 0 && index === 0,
          orden: imagenes.length + index,
          altTexto,
        });
      }

      setMensaje("Imagen(es) subida(s) correctamente.");
      setArchivoSeleccionado([]);
      setAltTexto("");
      await cargarImagenes();
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  };

  const marcarPrincipal = async (id) => {
    try {
      setMensaje("");
      await actualizarImagen(id, { esPrincipal: true });
      await cargarImagenes();
      setMensaje("Imagen principal actualizada.");
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo marcar como principal.");
    }
  };

  const borrarImagen = async (id) => {
    if (!window.confirm("¿Eliminar esta imagen del producto?")) return;

    try {
      setMensaje("");
      await eliminarImagen(id);
      await cargarImagenes();
      setMensaje("Imagen eliminada.");
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo eliminar la imagen.");
    }
  };

  return (
    <Card
      title="Imagenes por producto base y color"
      icon="bi-images"
      className="mb-4"
    >
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando imágenes...</span>
          </div>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-warning">{error}</div>}
          {mensaje && <div className="alert alert-success">{mensaje}</div>}

          <div className="border rounded-4 p-3 mb-4 bg-light">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-5">
                <label className="form-label fw-semibold">Subir imagenes compartidas</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleSeleccion}
                />
                <small className="text-muted d-block mt-1">
                  Se aplicaran a todas las variantes del mismo producto base y color.
                </small>
              </div>
              <div className="col-12 col-lg-5">
                <label className="form-label fw-semibold">Texto alternativo</label>
                <input
                  type="text"
                  className="form-control"
                  value={altTexto}
                  onChange={(e) => setAltTexto(e.target.value)}
                  placeholder="Ej: vista frontal del producto"
                />
              </div>
              <div className="col-12 col-lg-2">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={subirArchivos}
                  disabled={!archivoSeleccionado.length || subiendo}
                >
                  {subiendo ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </div>
            {!!archivoSeleccionado.length && (
              <div className="mt-3">
                <span className="badge text-bg-secondary me-2">{archivoSeleccionado.length}</span>
                <span className="text-muted">archivos seleccionados</span>
              </div>
            )}
          </div>

          {imagenes.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-image fs-1 d-block mb-2"></i>
              Aun no hay imagenes cargadas para este producto base y color.
            </div>
          ) : (
            <div className="row g-3">
              {imagenes.map((imagen) => (
                <div className="col-12 col-md-6 col-xl-4" key={imagen.id}>
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="ratio ratio-4x3 bg-light">
                      <img
                        src={construirUrlImagen(imagen.url)}
                        alt={imagen.altTexto || nombreArchivo(imagen.url)}
                        className="w-100 h-100 object-fit-cover rounded-top-4"
                      />
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="fw-semibold text-truncate">{nombreArchivo(imagen.url)}</div>
                          {imagen.altTexto && (
                            <div className="text-muted small">{imagen.altTexto}</div>
                          )}
                        </div>
                        {imagen.esPrincipal && (
                          <span className="badge text-bg-success">Principal</span>
                        )}
                      </div>
                    </div>
                    <div className="card-footer bg-white border-0 pt-0 pb-3 d-flex gap-2 flex-wrap">
                      {!imagen.esPrincipal && (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => marcarPrincipal(imagen.id)}
                        >
                          Marcar principal
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => borrarImagen(imagen.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
