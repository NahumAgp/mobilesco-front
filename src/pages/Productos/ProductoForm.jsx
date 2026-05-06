import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { obtenerProductoPorId, crearProducto, actualizarProducto } from "../../services/productos.js";
import { obtenerModelos } from "../../services/modelos.js";
import { obtenerNiveles } from "../../services/niveles.js";
import { obtenerColores } from "../../services/color.js";
import {
  obtenerImagenesPorProducto,
  obtenerImagenPrincipalPorProducto,
  subirImagenArchivo,
  actualizarImagen,
  eliminarImagen
} from "../../services/imagenes.js";
import Toast from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import { API_BASE_URL } from "../../config/apiConfig.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  return respuesta?.content || respuesta?.data || respuesta?.items || [];
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
};

const getArchivoNombre = (url) => {
  if (!url) return "Imagen";
  const partes = url.split("/");
  return decodeURIComponent(partes[partes.length - 1] || "Imagen");
};

export default function ProductoForm({
  productoId,
  producto,
  onSave,
  onCancel,
  errores: erroresExternos = {}
}) {
  const navigate = useNavigate();
  const esModal = Boolean(onSave);
  const esEdicion = Boolean(productoId) || Boolean(producto);
  const idProducto = producto?.id || productoId;

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [loading, setLoading] = useState(false);
  const [cargandoImagenes, setCargandoImagenes] = useState(false);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [modelos, setModelos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [colores, setColores] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [errorImagenes, setErrorImagenes] = useState("");

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    modeloId: "",
    nivelId: "",
    colorId: "",
    activo: true
  });

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [modelosData, nivelesData, coloresData] = await Promise.all([
          obtenerModelos(),
          obtenerNiveles(),
          obtenerColores()
        ]);

        setModelos(getLista(modelosData));
        setNiveles(getLista(nivelesData));
        setColores(getLista(coloresData));
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };

    cargarCatalogos();
  }, []);

  const recargarImagenes = async (productoActualId = idProducto, dataBase = null) => {
    if (!productoActualId) return;

    setCargandoImagenes(true);
    try {
      const respuestaLista = await obtenerImagenesPorProducto(productoActualId);
      const lista = getLista(respuestaLista);
      const principal =
        lista.find((img) => Boolean(img?.esPrincipal || img?.principal)) ||
        dataBase?.imagenPrincipal ||
        dataBase?.imagen ||
        null ||
        (await obtenerImagenPrincipalPorProducto(productoActualId).catch(() => null));

      setImagenes(lista);
      setImagenPrincipal(principal);
      setErrorImagenes("");
    } catch (error) {
      console.error("Error cargando imagenes:", error);
      setImagenes([]);
      setImagenPrincipal(null);
      setErrorImagenes("No se pudieron cargar las imagenes del producto.");
    } finally {
      setCargandoImagenes(false);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      if (esModal && producto) {
        setFormData({
          sku: producto.sku || "",
          nombre: producto.nombre || "",
          descripcion: producto.descripcion || "",
          modeloId: producto.id_modelo || producto.modeloId || "",
          nivelId: producto.id_nivel || producto.nivelId || "",
          colorId: producto.id_color || producto.colorId || "",
          activo: producto.activo ?? true
        });
        return;
      }

      if (!esModal && productoId) {
        try {
          setLoading(true);
          const data = await obtenerProductoPorId(productoId);
          setFormData({
            sku: data.sku || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            modeloId: data.id_modelo || data.modeloId || data.id_producto_base || data.productoBaseId || "",
            nivelId: data.id_nivel || data.nivelId || "",
            colorId: data.id_color || data.colorId || "",
            activo: data.activo ?? true
          });
          await recargarImagenes(productoId, data);
        } catch (error) {
          console.error("Error cargando producto:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    cargar();
  }, [productoId, producto, esModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (erroresBackend[name]) {
      setErroresBackend((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  };

  const validarImagenes = (files) => {
    const validas = files.filter((file) => file.type.startsWith("image/"));
    if (validas.length !== files.length) {
      setErrorImagenes("Se omitieron archivos que no son imagen.");
    } else {
      setErrorImagenes("");
    }
    return validas;
  };

  const subirImagenes = async (files) => {
    if (!idProducto || !files.length) return;

    try {
      setSubiendoImagenes(true);
      const tienePrincipal = imagenes.some((img) => Boolean(img?.esPrincipal || img?.principal));

      for (let index = 0; index < files.length; index += 1) {
        await subirImagenArchivo({
          archivo: files[index],
          productoId: Number(idProducto),
          esPrincipal: !tienePrincipal && index === 0,
          altTexto: formData.nombre || formData.sku || "Imagen del producto"
        });
      }

      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error subiendo imagenes:", error);
      setErrorImagenes(error.message || "No se pudieron subir las imagenes.");
    } finally {
      setSubiendoImagenes(false);
    }
  };

  const handleFileChange = async (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    const validas = validarImagenes(archivos);
    await subirImagenes(validas);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const validas = validarImagenes(Array.from(e.dataTransfer.files || []));
    await subirImagenes(validas);
  };

  const marcarPrincipal = async (imagenId) => {
    if (!idProducto || !imagenId) return;
    const imagenActual = imagenes.find((img) => Number(img.id) === Number(imagenId));
    if (!imagenActual) return;

    try {
      await actualizarImagen(imagenActual.id, {
        esPrincipal: true,
        altTexto: imagenActual.altTexto || imagenActual.nombre || "Imagen principal"
      });
      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error estableciendo principal:", error);
      setErrorImagenes(error.message || "No se pudo cambiar la imagen principal.");
    }
  };

  const borrarImagen = async (imagenId) => {
    if (!idProducto || !imagenId) return;
    if (!window.confirm("¿Eliminar esta imagen del producto?")) return;

    try {
      await eliminarImagen(imagenId);
      await recargarImagenes(idProducto);
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      setErrorImagenes(error.message || "No se pudo eliminar la imagen.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sku || !formData.nombre || !formData.modeloId || !formData.nivelId || !formData.colorId) {
      alert("Completa los campos obligatorios: SKU, Nombre, Producto Base, Nivel y Color");
      return;
    }

    const dataToSend = {
      sku: formData.sku.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim() || null,
      id_modelo: Number(formData.modeloId),
      id_nivel: Number(formData.nivelId),
      id_color: Number(formData.colorId),
      activo: formData.activo
    };

    try {
      setErroresBackend({});

      const respuesta = esEdicion
        ? await actualizarProducto(idProducto, dataToSend)
        : await crearProducto(dataToSend);

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "¡Producto actualizado con éxito!" : "¡Producto registrado con éxito!");
        setTimeout(() => navigate("/productos"), 1200);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  };

  const inputClass = (field) => `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) => `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/productos");
    }
  };

  const productoPrincipal = useMemo(() => imagenPrincipal || imagenes.find((img) => Boolean(img?.esPrincipal || img?.principal)) || null, [imagenPrincipal, imagenes]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Producto" : "Nuevo Producto"}</h2>
          <span className={`badge ${formData.activo ? "bg-success" : "bg-secondary"}`}>
            {formData.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          <div className="col-lg-8">
            <Card title="Información básica" icon="bi-info-circle" className="mb-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">SKU <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="sku"
                    className={inputClass("sku")}
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ej: ESF-01-CX"
                  />
                  <small className="text-muted">Código único del producto</small>
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Nombre <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    className={inputClass("nombre")}
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Formaica Prescolar Cafe"
                  />
                  <small className="text-muted">Descripción comercial del producto</small>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    name="descripcion"
                    className={inputClass("descripcion")}
                    rows="3"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Silla en Formaica color cafe ..."
                  />
                </div>
              </div>
            </Card>

            <Card title="Clasificación" icon="bi-tags" className="mb-4">
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-semibold">Producto Base <span className="text-danger">*</span></label>
                  <select
                    name="modeloId"
                    className={selectClass("modeloId")}
                    value={formData.modeloId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar producto base...</option>
                    {modelos.map((modelo) => (
                      <option key={modelo.id} value={modelo.id}>
                        [{modelo.codigo}] {modelo.nombre}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Producto base al que pertenece este producto</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nivel <span className="text-danger">*</span></label>
                  <select
                    name="nivelId"
                    className={selectClass("nivelId")}
                    value={formData.nivelId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar nivel...</option>
                    {niveles.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>
                        [{nivel.codigo}] {nivel.nombre}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Ej: Preescolar, Primaria, Secundaria</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Color <span className="text-danger">*</span></label>
                  <select
                    name="colorId"
                    className={selectClass("colorId")}
                    value={formData.colorId}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar color...</option>
                    {colores.map((color) => (
                      <option key={color.id} value={color.id}>
                        [{color.codigo}] {color.nombre}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Color del producto si aplica</small>
                </div>
              </div>
            </Card>

            <Card title="Imagenes por producto base y color" icon="bi-images" className="mb-4">
              {esEdicion ? (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="text-muted">Estas imagenes se comparten con variantes del mismo producto base y color.</div>
                    <div className="d-flex gap-2">
                      <span className="badge text-bg-secondary">{imagenes.length}</span>
                      <span className={`badge ${productoPrincipal ? "bg-success" : "bg-secondary"}`}>
                        {productoPrincipal ? "Con principal" : "Sin principal"}
                      </span>
                    </div>
                  </div>

                  {errorImagenes && <div className="alert alert-warning py-2">{errorImagenes}</div>}

                  {cargandoImagenes ? (
                    <div className="text-muted py-3">Cargando imágenes...</div>
                  ) : (
                    <>
                      <div
                        className={`border-2 border-dashed rounded p-4 text-center mb-3 ${dragActive ? "border-primary bg-primary bg-opacity-10" : "border-secondary"}`}
                        style={{ borderStyle: "dashed", cursor: "pointer" }}
                        onClick={() => document.getElementById("producto-images-input")?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          id="producto-images-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="d-none"
                          onChange={handleFileChange}
                        />
                        <i className="bi bi-cloud-upload fs-2 text-secondary"></i>
                        <p className="mt-2 mb-0">Arrastra imagenes aqui o haz clic para seleccionar</p>
                        <small className="text-muted">Se aplicaran a todas las variantes del mismo color.</small>
                        {subiendoImagenes && <div className="mt-2 text-primary fw-semibold">Subiendo...</div>}
                      </div>

                      <div className="row g-3">
                        {imagenes.length > 0 ? (
                          imagenes.map((imagen) => {
                            const esPrincipalImagen = Boolean(imagen?.esPrincipal || imagen?.principal);
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
                                      {esPrincipalImagen ? (
                                        <span className="badge bg-success">
                                          <i className="bi bi-star-fill me-1"></i>Principal
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-primary"
                                          onClick={() => marcarPrincipal(imagen.id)}
                                        >
                                          Principal
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => borrarImagen(imagen.id)}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>

                                    <small className="text-muted text-truncate" title={imagen?.altTexto || imagen?.nombre || ""}>
                                      {imagen?.altTexto || imagen?.nombre || getArchivoNombre(imagen?.url)}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-12 text-muted">Todavia no hay imagenes para este producto base y color.</div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-muted">Guarda el producto para comenzar a subir imagenes por color.</div>
              )}
            </Card>
          </div>

          <div className="col-lg-4">
            <Card title="Estado" icon="bi-toggle-on" className="mb-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  id="activoSwitch"
                  style={{ width: "40px", height: "20px", cursor: "pointer" }}
                />
                <label className="form-check-label fw-semibold ms-2" htmlFor="activoSwitch">
                  Producto {formData.activo ? "Activo" : "Inactivo"}
                </label>
              </div>
              <small className="text-muted d-block mt-2">
                {formData.activo ? "Solo los productos activos se muestran en el catálogo" : "Este producto está oculto del catálogo"}
              </small>
            </Card>

            {esEdicion && (
              <Card title="Acciones" icon="bi-gear" className="mb-4">
                <button
                  type="button"
                  className="btn btn-outline-info w-100 mb-2"
                  onClick={() => navigate(`/productos/${idProducto}/ver`)}
                >
                  <i className="bi bi-eye me-2"></i>
                  Ver detalle
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary w-100 mb-2"
                  onClick={() => navigate(`/productos/${idProducto}/bom/insumos`)}
                >
                  <i className="bi bi-box-seam me-2"></i>
                  BOM insumos
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success w-100"
                  onClick={() => navigate(`/productos/${idProducto}/bom/operaciones`)}
                >
                  <i className="bi bi-gear-wide-connected me-2"></i>
                  BOM operaciones
                </button>
              </Card>
            )}

          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 bg-white p-3 rounded shadow-sm mt-4">
          <button type="button" className="btn btn-light px-4" onClick={handleCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary px-5 fw-bold">
            {esEdicion ? "Guardar Cambios" : "Guardar Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
