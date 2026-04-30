// ============================================
// RUTA: src/pages/Variantes/VarianteForm.jsx
// ============================================
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { obtenerProductoPorId, crearProducto, actualizarProducto } from "../../services/variantes";
import { obtenerModelos } from "../../services/modelos.js";
import { obtenerCategorias } from "../../services/categorias.js";
import { obtenerColores } from "../../services/color.js";
import {
  obtenerImagenesPorProducto,
  obtenerImagenPrincipalPorProducto,
  subirImagenArchivo,
  actualizarImagen,
  eliminarImagen
} from "../../services/imagenes.js";

const API_BASE_URL = "http://localhost:8081";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return respuesta?.content || respuesta?.data || respuesta?.items || [];
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const getImagenActiva = (imagen) =>
  imagen?.activo ?? imagen?.active ?? imagen?.habilitada ?? true;

const getImagenRepresentativa = (imagenes = []) => {
  if (!Array.isArray(imagenes) || imagenes.length === 0) return null;

  const principalActiva = imagenes.find(
    (img) => Boolean(img?.esPrincipal || img?.principal) && getImagenActiva(img) && img?.url
  );
  if (principalActiva) return principalActiva;

  const primeraActiva = imagenes.find((img) => getImagenActiva(img) && img?.url);
  if (primeraActiva) return primeraActiva;

  const principal = imagenes.find((img) => Boolean(img?.esPrincipal || img?.principal) && img?.url);
  if (principal) return principal;

  return imagenes.find((img) => img?.url) || null;
};

const getImagenDesdeRespuesta = (respuesta) => {
  if (!respuesta) return null;
  if (Array.isArray(respuesta)) return getImagenRepresentativa(respuesta);

  if (typeof respuesta === "object") {
    const url =
      respuesta?.url ||
      respuesta?.imagenUrl ||
      respuesta?.urlImagen ||
      respuesta?.fotoUrl ||
      respuesta?.imagenPrincipalUrl ||
      respuesta?.imagen?.url ||
      respuesta?.imagenPrincipal?.url ||
      "";

    if (!url) return null;

    return {
      ...respuesta,
      url
    };
  }

  return null;
};

const getImagenesNormalizadas = (respuesta) => {
  const lista = getLista(respuesta);
  if (!Array.isArray(lista)) return [];
  return lista.filter(Boolean);
};

export default function VarianteForm({ productoId, returnPath = "/productos" }) {
  const navigate = useNavigate();
  const esEdicion = Boolean(productoId);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    activo: true,
    id_producto_base: "",
    id_nivel: "",
    id_color: ""
  });

  const [productosBase, setProductosBase] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [colores, setColores] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [imagenesProducto, setImagenesProducto] = useState([]);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [errorImagenes, setErrorImagenes] = useState("");

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [modelos, categorias, coloresData] = await Promise.all([
          obtenerModelos(),
          obtenerCategorias(),
          obtenerColores()
        ]);

        setProductosBase(modelos.content || modelos || []);
        setNiveles(categorias.content || categorias || []);
        setColores(coloresData.content || coloresData || []);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoadingCatalogo(false);
      }
    };

    cargarCatalogos();
  }, []);

  // Cargar datos si es edición
  const recargarImagenesProducto = useCallback(
    async (idProducto = productoId, dataBase = null) => {
      if (!idProducto) return;

      setCargandoImagen(true);
      try {
        let lista = [];
        try {
          const respuestaLista = await obtenerImagenesPorProducto(idProducto);
          lista = getImagenesNormalizadas(respuestaLista);
        } catch {
          lista = [];
        }

        let principal = getImagenRepresentativa(lista);
        if (!principal) {
          principal = getImagenDesdeRespuesta(dataBase?.imagenPrincipal || dataBase?.imagen || dataBase?.foto);
        }

        if (!principal) {
          try {
            const respuestaPrincipal = await obtenerImagenPrincipalPorProducto(idProducto);
            principal = getImagenDesdeRespuesta(respuestaPrincipal);
          } catch {
            principal = null;
          }
        }

        setImagenesProducto(lista);
        setImagenPrincipal(principal);
        setErrorImagenes("");
      } catch (error) {
        console.error("Error cargando imagenes del producto:", error);
        setImagenesProducto([]);
        setImagenPrincipal(null);
        setErrorImagenes("No se pudieron cargar las imagenes del producto.");
      } finally {
        setCargandoImagen(false);
      }
    },
    [productoId]
  );

  useEffect(() => {
    const cargar = async () => {
      if (!productoId) return;

      try {
        const data = await obtenerProductoPorId(productoId);
        setFormData({
          sku: data.sku || "",
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          activo: data.activo ?? true,
          id_producto_base: data.id_modelo || data.producto_base_id || data.id_producto_base || data.productoBaseId || "",
          id_nivel: data.id_nivel || data.nivelId || "",
          id_color: data.id_color || data.colorId || ""
        });

        await recargarImagenesProducto(productoId, data);
      } catch (error) {
        console.error("Error cargando producto:", error);
      }
    };

    cargar();
  }, [productoId, recargarImagenesProducto]);

  const validarArchivos = (files) => {
    const validos = files.filter((file) => file.type.startsWith("image/") && file.size <= MAX_SIZE_BYTES);
    if (validos.length !== files.length) {
      setErrorImagenes("Algunos archivos se omitieron por formato invalido o tamano mayor a 5MB.");
    } else {
      setErrorImagenes("");
    }

    return validos;
  };

  const procesarImagenes = async (files) => {
    if (!productoId || files.length === 0) return;

    try {
      const tienePrincipal = imagenesProducto.some((imagen) => Boolean(imagen?.esPrincipal || imagen?.principal));

      for (let index = 0; index < files.length; index += 1) {
        const archivo = files[index];
        await subirImagenArchivo({
          archivo,
          productoId: Number(productoId),
          esPrincipal: !tienePrincipal && index === 0,
          altTexto: `Producto ${formData.nombre || formData.sku || ""}`.trim() || "Imagen del producto"
        });
      }

      await recargarImagenesProducto(productoId);
    } catch (error) {
      console.error("Error subiendo imagenes:", error);
      setErrorImagenes(error.message || "No se pudieron subir las imagenes.");
    }
  };

  const manejarCambioImagen = async (event) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = "";
    const validos = validarArchivos(archivos);
    await procesarImagenes(validos);
  };

  const manejarDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const manejarDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const archivos = Array.from(event.dataTransfer.files || []);
    const validos = validarArchivos(archivos);
    await procesarImagenes(validos);
  };

  const manejarEliminarImagen = async (imagenId) => {
    if (!productoId || !imagenId) return;

    try {
      const imagenSeleccionada = imagenesProducto.find((imagen) => Number(imagen.id) === Number(imagenId));
      const imagenPrincipalActual =
        imagenesProducto.find((imagen) => Boolean(imagen?.esPrincipal || imagen?.principal)) || imagenPrincipal;

      if (imagenPrincipalActual && Number(imagenPrincipalActual.id) === Number(imagenId)) {
        const alternativa = imagenesProducto.find((imagen) => Number(imagen.id) !== Number(imagenId));

        if (alternativa?.id) {
          await actualizarImagen(alternativa.id, {
            esPrincipal: true,
            orden: Number(alternativa.orden) || 1,
            altTexto: alternativa.altTexto || alternativa.nombre || "Imagen principal"
          });
        }
      }

      if (imagenSeleccionada?.id) {
        await eliminarImagen(imagenSeleccionada.id);
      }

      await recargarImagenesProducto(productoId);
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      setErrorImagenes(error.message || "No se pudo eliminar la imagen.");
    }
  };

  const establecerPrincipal = async (imagenId) => {
    if (!productoId || !imagenId) return;

    try {
      const imagenActual = imagenesProducto.find((imagen) => Number(imagen.id) === Number(imagenId));
      if (!imagenActual) return;

      await actualizarImagen(imagenActual.id, {
        esPrincipal: true,
        orden: Number(imagenActual.orden) || 1,
        altTexto: imagenActual.altTexto || imagenActual.nombre || "Imagen principal"
      });

      await recargarImagenesProducto(productoId);
    } catch (error) {
      console.error("Error estableciendo imagen principal:", error);
      setErrorImagenes(error.message || "No se pudo cambiar la imagen principal.");
    }
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validar SKU
    if (!formData.sku || formData.sku.trim() === "") {
      alert("El SKU es obligatorio");
      return;
    }

      // Validar Producto Base
      if (!formData.id_producto_base) {
        alert("El Producto Base es obligatorio");
        return;
      }

      try {
      const payload = {
        sku: formData.sku?.trim().toUpperCase() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        activo: Boolean(formData.activo),
        id_modelo: Number(formData.id_producto_base),
        id_nivel: formData.id_nivel ? Number(formData.id_nivel) : null,
        id_color: formData.id_color ? Number(formData.id_color) : null
      };

      console.log("Enviando payload:", payload);

      if (esEdicion) {
        await actualizarProducto(productoId, payload);
      } else {
        await crearProducto(payload);
      }

      navigate(returnPath);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert(error.message || "Error al guardar producto");
    }
  }

  if (loadingCatalogo) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        {/* SKU */}
        <div className="col-md-4">
          <label className="form-label">
            SKU <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="sku"
            className="form-control"
            value={formData.sku}
            onChange={handleChange}
            required
            placeholder="Ej: PROD-001"
          />
          <small className="text-muted">Código único del producto</small>
        </div>

        {/* Nombre */}
        <div className="col-md-8">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            className="form-control"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Silla Preescolar Formica"
          />
          <small className="text-muted">Descripción comercial del producto</small>
        </div>

        {/* Descripción */}
        <div className="col-md-12">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows="2"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción adicional del producto"
          />
        </div>

        {/* Producto Base */}
        <div className="col-md-12">
          <label className="form-label">
            Producto Base <span className="text-danger">*</span>
          </label>
          <select
            name="id_producto_base"
            className="form-select"
            value={formData.id_producto_base}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un producto base...</option>
            {productosBase.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Producto base al que pertenece este producto</small>
        </div>

        {/* Nivel */}
        <div className="col-md-6">
          <label className="form-label">Nivel</label>
          <select
            name="id_nivel"
            className="form-select"
            value={formData.id_nivel}
            onChange={handleChange}
          >
            <option value="">Sin nivel...</option>
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.codigo ? `[${nivel.codigo}] ` : ""}{nivel.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Ej: Preescolar, Primaria, Secundaria</small>
        </div>

        {/* Color */}
        <div className="col-md-6">
          <label className="form-label">Color</label>
          <select
            name="id_color"
            className="form-select"
            value={formData.id_color}
            onChange={handleChange}
          >
            <option value="">Sin color...</option>
            {colores.map((color) => (
              <option key={color.id} value={color.id}>
                {color.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Color del producto si aplica</small>
        </div>

        {/* Activo */}
        <div className="col-md-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              id="activoSwitch"
              checked={formData.activo}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="activoSwitch">
              Activo
            </label>
          </div>
          <small className="text-muted">Solo los productos activos se muestran en el catálogo</small>
        </div>

        {esEdicion && (
          <div className="col-md-12">
            <div className="border rounded-3 p-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-0">Imagenes del producto</h5>
                  <small className="text-muted">Sube varias imagenes, marca una principal o elimina las que no sirvan.</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary">{imagenesProducto.length}</span>
                  <span className={`badge ${imagenPrincipal ? "bg-success" : "bg-secondary"}`}>
                    {imagenPrincipal ? "Con principal" : "Sin principal"}
                  </span>
                </div>
              </div>

              {errorImagenes && <div className="alert alert-warning py-2">{errorImagenes}</div>}

              {cargandoImagen ? (
                <div className="text-muted">Cargando imagenes...</div>
              ) : (
                <>
                  <div
                    className={`border-2 border-dashed rounded p-4 text-center mb-3 ${
                      dragActive ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
                    }`}
                    style={{ borderStyle: "dashed", cursor: "pointer" }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={manejarDrag}
                    onDragLeave={manejarDrag}
                    onDragOver={manejarDrag}
                    onDrop={manejarDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="d-none"
                      onChange={manejarCambioImagen}
                    />
                    <i className="bi bi-cloud-upload fs-2 text-secondary"></i>
                    <p className="mt-2 mb-0">Arrastra imagenes aqui o haz clic para seleccionar</p>
                    <small className="text-muted">Puedes subir varias imagenes al mismo tiempo.</small>
                  </div>

                  <div className="row g-3">
                    {imagenesProducto.length > 0 ? (
                      imagenesProducto.map((imagen) => {
                        const esPrincipal = Boolean(imagen?.esPrincipal || imagen?.principal);
                        const imagenUrl = toPreviewUrl(imagen?.url);

                        return (
                          <div className="col-6 col-md-4 col-xl-3" key={imagen.id}>
                            <div className="card h-100 shadow-sm">
                              <img
                                src={imagenUrl}
                                alt={imagen?.altTexto || imagen?.nombre || formData.nombre || "Producto"}
                                className="card-img-top"
                                style={{ height: "180px", objectFit: "cover" }}
                              />
                              <div className="card-body p-2 d-flex flex-column gap-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  {esPrincipal ? (
                                    <span className="badge bg-success">
                                      <i className="bi bi-star-fill me-1"></i>Principal
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => establecerPrincipal(imagen.id)}
                                    >
                                      Principal
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => manejarEliminarImagen(imagen.id)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>

                                <small className="text-muted text-truncate" title={imagen?.altTexto || imagen?.nombre || ""}>
                                  {imagen?.altTexto || imagen?.nombre || "Imagen sin nombre"}
                                </small>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-12">
                        <div className="text-muted">Todavia no hay imagenes para este producto.</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="col-md-12">
          <hr />
          <button type="submit" className="btn btn-primary me-2">
            <i className="bi bi-check-lg me-1"></i>
            Guardar
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(returnPath)}
          >
            <i className="bi bi-x-lg me-1"></i>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
