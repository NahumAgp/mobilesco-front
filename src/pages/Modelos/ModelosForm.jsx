import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerModeloPorId, crearModelo, actualizarModelo } from "../../services/modelos.js";
import { obtenerFamilias } from "../../services/familias.js";
import {
  obtenerVariantesPorProductoBase,
  crearVariante,
  actualizarVariante,
  eliminarVariante as eliminarVarianteService
} from "../../services/variantes.js";
import { obtenerCategorias } from "../../services/categorias.js";
import { obtenerColores } from "../../services/color.js";
import {
  obtenerImagenesPorVariante,
  subirImagenArchivo,
  actualizarImagen,
  eliminarImagen
} from "../../services/imagenes.js";
import Toast from "../../components/ui/Toast.jsx";

const API_BASE_URL = "http://localhost:8081";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getModeloId = (modelo) =>
  modelo?.id || modelo?.modeloId || modelo?.id_producto_base || modelo?.productoBaseId || null;

const getVarianteId = (variante) =>
  variante?.id || variante?.varianteId || variante?.id_variante || null;

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

const mapVarianteToForm = (variante = {}) => ({
  sku: variante?.sku || "",
  nombre: variante?.nombre || "",
  descripcion: variante?.descripcion || "",
  activo: variante?.activo ?? true,
  id_nivel:
    variante?.id_nivel ||
    variante?.nivelId ||
    variante?.categoriaId ||
    variante?.nivel?.id ||
    variante?.categoria?.id ||
    "",
  id_color:
    variante?.id_color ||
    variante?.colorId ||
    variante?.color?.id ||
    ""
});

const getCategoriaVariante = (variante, categoriasCatalogo = []) => {
  const nombre =
    variante?.nivelNombre ||
    variante?.categoriaNombre ||
    variante?.nivel?.nombre ||
    variante?.categoria?.nombre ||
    variante?.nombreNivel ||
    variante?.nombreCategoria;

  if (nombre) return nombre;

  const id =
    variante?.id_nivel ||
    variante?.nivelId ||
    variante?.categoriaId ||
    variante?.nivel?.id ||
    variante?.categoria?.id;

  if (id) {
    const categoria = categoriasCatalogo.find(
      (cat) => Number(cat?.id ?? cat?.categoriaId ?? cat?.id_nivel) === Number(id)
    );
    if (categoria?.nombre) return categoria.nombre;
  }

  return id ? `ID ${id}` : "-";
};

const getColorVariante = (variante, coloresCatalogo = []) => {
  const nombre =
    variante?.colorNombre ||
    variante?.color?.nombre ||
    variante?.nombreColor;

  if (nombre) return nombre;

  const id = variante?.id_color || variante?.colorId || variante?.color?.id;

  if (id) {
    const color = coloresCatalogo.find(
      (c) => Number(c?.id ?? c?.colorId ?? c?.id_color) === Number(id)
    );
    if (color?.nombre) return color.nombre;
  }

  return id ? `ID ${id}` : "-";
};

export default function ModeloForm({
  modeloId,
  modelo,
  onSave,
  onCancel,
  errores: erroresExternos = {}
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [familias, setFamilias] = useState([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [coloresCatalogo, setColoresCatalogo] = useState([]);
  const [variantesModelo, setVariantesModelo] = useState([]);
  const [imagenesPorVariante, setImagenesPorVariante] = useState({});
  const [imagenesVariantes, setImagenesVariantes] = useState({});
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [actualizandoImagenId, setActualizandoImagenId] = useState(null);
  const [varianteSeleccionadaId, setVarianteSeleccionadaId] = useState(null);
  const [modoNuevaVariante, setModoNuevaVariante] = useState(false);
  const [varianteForm, setVarianteForm] = useState(mapVarianteToForm());
  const [imagenesVarianteSeleccionada, setImagenesVarianteSeleccionada] = useState([]);
  const [guardandoVariante, setGuardandoVariante] = useState(false);
  const [eliminandoVariante, setEliminandoVariante] = useState(false);
  const [subiendoImagenVariante, setSubiendoImagenVariante] = useState(false);
  const [reemplazoImagenTarget, setReemplazoImagenTarget] = useState(null);

  const fileInputRef = useRef(null);
  const fileInputVarianteRef = useRef(null);
  const fileInputReemplazoRef = useRef(null);

  const navigate = useNavigate();

  const esModal = Boolean(onSave);
  const esEdicion = Boolean(modeloId) || Boolean(modelo);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    familiaId: "",
    activo: true
  });

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [familiasResp, categoriasResp, coloresResp] = await Promise.all([
          obtenerFamilias(),
          obtenerCategorias(),
          obtenerColores()
        ]);

        if (familiasResp.content) {
          setFamilias(familiasResp.content);
        } else if (Array.isArray(familiasResp)) {
          setFamilias(familiasResp);
        }

        if (categoriasResp.content) {
          setCategoriasCatalogo(categoriasResp.content);
        } else if (Array.isArray(categoriasResp)) {
          setCategoriasCatalogo(categoriasResp);
        }

        if (coloresResp.content) {
          setColoresCatalogo(coloresResp.content);
        } else if (Array.isArray(coloresResp)) {
          setColoresCatalogo(coloresResp);
        }
      } catch (e) {
        console.error("Error cargando catalogos:", e);
      }
    };

    cargarCatalogos();
  }, []);

  const cargarImagenPrincipalModelo = async (idModelo) => {
    if (!idModelo) {
      setVariantesModelo([]);
      setImagenesPorVariante({});
      setImagenesVariantes({});
      setImagenPrincipal(null);
      return;
    }

    setCargandoImagen(true);
    try {
      const variantesResp = await obtenerVariantesPorProductoBase(idModelo);
      const variantes = getLista(variantesResp);
      setVariantesModelo(variantes);

      const mapaListas = {};
      const mapaImagenes = {};
      await Promise.all(
        variantes.map(async (variante) => {
          const varianteId = getVarianteId(variante);
          if (!varianteId) return;

          try {
            const listaResp = await obtenerImagenesPorVariante(varianteId);
            const lista = getLista(listaResp);
            mapaListas[varianteId] = lista;

            const representativa = getImagenRepresentativa(lista);
            if (representativa?.url) {
              mapaImagenes[varianteId] = representativa;
            }
          } catch {
            // Sin imagenes en esta variante.
            mapaListas[varianteId] = [];
          }
        })
      );

      setImagenesPorVariante(mapaListas);
      setImagenesVariantes(mapaImagenes);

      let principal = null;
      const primeraConImagen = variantes.find((variante) => {
        const varianteId = getVarianteId(variante);
        return Boolean(varianteId && mapaImagenes[varianteId]?.url);
      });
      if (primeraConImagen) {
        const varianteId = getVarianteId(primeraConImagen);
        principal = {
          ...mapaImagenes[varianteId],
          varianteId
        };
      }

      setImagenPrincipal(principal);
    } catch (error) {
      console.error("Error cargando imagen principal del modelo:", error);
      setImagenesPorVariante({});
      setImagenesVariantes({});
      setImagenPrincipal(null);
      setVariantesModelo([]);
    } finally {
      setCargandoImagen(false);
    }
  };

  const cargarImagenesVarianteSeleccionada = async (varianteId) => {
    if (!varianteId) {
      setImagenesVarianteSeleccionada([]);
      return;
    }

    try {
      const listaResp = await obtenerImagenesPorVariante(varianteId);
      setImagenesVarianteSeleccionada(getLista(listaResp));
    } catch {
      setImagenesVarianteSeleccionada([]);
    }
  };

  const seleccionarVariante = async (variante) => {
    const varianteId = getVarianteId(variante);
    if (!varianteId) return;

    setModoNuevaVariante(false);
    setVarianteSeleccionadaId(varianteId);
    setVarianteForm(mapVarianteToForm(variante));
    await cargarImagenesVarianteSeleccionada(varianteId);
  };

  const iniciarNuevaVariante = () => {
    setModoNuevaVariante(true);
    setVarianteSeleccionadaId(null);
    setVarianteForm(mapVarianteToForm());
    setImagenesVarianteSeleccionada([]);
  };

  const obtenerModeloActualId = () => getModeloId(modelo) || modeloId;

  const guardarVarianteSeleccionada = async () => {
    const idModeloActual = obtenerModeloActualId();
    if (!idModeloActual) {
      setToastType("danger");
      setToastMessage("No se encontro el ID del modelo para guardar la variante.");
      return;
    }

    if (!varianteForm.sku?.trim()) {
      setToastType("warning");
      setToastMessage("El SKU es obligatorio.");
      return;
    }

    try {
      setGuardandoVariante(true);

      const payload = {
        sku: varianteForm.sku.trim().toUpperCase(),
        nombre: varianteForm.nombre?.trim() || "",
        descripcion: varianteForm.descripcion?.trim() || "",
        activo: Boolean(varianteForm.activo),
        id_producto_base: Number(idModeloActual),
        id_nivel: varianteForm.id_nivel ? Number(varianteForm.id_nivel) : null,
        id_color: varianteForm.id_color ? Number(varianteForm.id_color) : null
      };

      let respuesta = null;
      if (modoNuevaVariante) {
        respuesta = await crearVariante(payload);
      } else if (varianteSeleccionadaId) {
        respuesta = await actualizarVariante(varianteSeleccionadaId, payload);
      }

      setToastType("success");
      setToastMessage(modoNuevaVariante ? "Variante creada correctamente." : "Variante actualizada correctamente.");

      await cargarImagenPrincipalModelo(idModeloActual);

      const idRespuesta = getVarianteId(respuesta);
      if (idRespuesta) {
        const varianteRecargada = (variantesModelo || []).find(
          (v) => Number(getVarianteId(v)) === Number(idRespuesta)
        );
        if (varianteRecargada) {
          await seleccionarVariante(varianteRecargada);
        } else {
          setVarianteSeleccionadaId(idRespuesta);
          await cargarImagenesVarianteSeleccionada(idRespuesta);
        }
      } else if (modoNuevaVariante) {
        setModoNuevaVariante(false);
      }
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo guardar la variante.");
    } finally {
      setGuardandoVariante(false);
    }
  };

  const eliminarVarianteSeleccionada = async () => {
    if (!varianteSeleccionadaId) return;

    const confirmar = window.confirm("Seguro que deseas eliminar esta variante?");
    if (!confirmar) return;

    try {
      setEliminandoVariante(true);
      await eliminarVarianteService(varianteSeleccionadaId);

      setToastType("success");
      setToastMessage("Variante eliminada correctamente.");

      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) {
        await cargarImagenPrincipalModelo(idModeloActual);
      }

      setVarianteSeleccionadaId(null);
      setVarianteForm(mapVarianteToForm());
      setImagenesVarianteSeleccionada([]);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo eliminar la variante.");
    } finally {
      setEliminandoVariante(false);
    }
  };

  const subirImagenAVarianteSeleccionada = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo || !varianteSeleccionadaId) return;

    try {
      setSubiendoImagenVariante(true);
      await subirImagenArchivo({
        archivo,
        varianteId: Number(varianteSeleccionadaId),
        esPrincipal: imagenesVarianteSeleccionada.length === 0,
        altTexto: `Variante ${varianteForm.sku || ""}`.trim() || "Imagen variante"
      });

      setToastType("success");
      setToastMessage("Imagen agregada a la variante.");

      await cargarImagenesVarianteSeleccionada(varianteSeleccionadaId);
      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) await cargarImagenPrincipalModelo(idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo subir la imagen.");
    } finally {
      setSubiendoImagenVariante(false);
    }
  };

  const toggleEstadoImagenVariante = async (imagen) => {
    if (!imagen?.id) return;
    const nuevoEstado = !getImagenActiva(imagen);

    try {
      setActualizandoImagenId(imagen.id);
      await actualizarImagen(imagen.id, {
        activo: nuevoEstado,
        esPrincipal: Boolean(imagen?.esPrincipal || imagen?.principal),
        orden: Number(imagen?.orden) || 1,
        altTexto: imagen?.altTexto || imagen?.nombre || "Imagen variante"
      });

      setToastType("success");
      setToastMessage(`Imagen ${nuevoEstado ? "activada" : "desactivada"} correctamente.`);
      await cargarImagenesVarianteSeleccionada(varianteSeleccionadaId);
      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) await cargarImagenPrincipalModelo(idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo actualizar el estado de la imagen.");
    } finally {
      setActualizandoImagenId(null);
    }
  };

  const marcarImagenComoPrincipal = async (imagen) => {
    if (!imagen?.id) return;

    try {
      setActualizandoImagenId(imagen.id);
      await actualizarImagen(imagen.id, {
        activo: getImagenActiva(imagen),
        esPrincipal: true,
        orden: Number(imagen?.orden) || 1,
        altTexto: imagen?.altTexto || imagen?.nombre || "Imagen principal"
      });

      setToastType("success");
      setToastMessage("Imagen principal actualizada.");
      await cargarImagenesVarianteSeleccionada(varianteSeleccionadaId);
      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) await cargarImagenPrincipalModelo(idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo marcar como principal.");
    } finally {
      setActualizandoImagenId(null);
    }
  };

  const eliminarImagenVarianteSeleccionada = async (imagen) => {
    if (!imagen?.id) return;

    const confirmar = window.confirm("Eliminar esta imagen de la variante?");
    if (!confirmar) return;

    try {
      setActualizandoImagenId(imagen.id);
      await eliminarImagen(imagen.id);
      setToastType("success");
      setToastMessage("Imagen eliminada.");
      await cargarImagenesVarianteSeleccionada(varianteSeleccionadaId);
      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) await cargarImagenPrincipalModelo(idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo eliminar la imagen.");
    } finally {
      setActualizandoImagenId(null);
    }
  };

  const iniciarReemplazoImagen = (imagen) => {
    setReemplazoImagenTarget(imagen || null);
    fileInputReemplazoRef.current?.click();
  };

  const reemplazarImagenVariante = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    const imagen = reemplazoImagenTarget;
    setReemplazoImagenTarget(null);

    if (!archivo || !imagen || !varianteSeleccionadaId) return;

    try {
      setActualizandoImagenId(imagen.id);
      await subirImagenArchivo({
        archivo,
        varianteId: Number(varianteSeleccionadaId),
        esPrincipal: Boolean(imagen?.esPrincipal || imagen?.principal),
        orden: Number(imagen?.orden) || 1,
        altTexto: imagen?.altTexto || imagen?.nombre || "Imagen variante"
      });
      await eliminarImagen(imagen.id);

      setToastType("success");
      setToastMessage("Imagen reemplazada correctamente.");
      await cargarImagenesVarianteSeleccionada(varianteSeleccionadaId);
      const idModeloActual = obtenerModeloActualId();
      if (idModeloActual) await cargarImagenPrincipalModelo(idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error?.message || "No se pudo reemplazar la imagen.");
    } finally {
      setActualizandoImagenId(null);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      if (esModal && modelo) {
        setFormData({
          codigo: modelo.codigo || modelo.sku || "",
          nombre: modelo.nombre || "",
          descripcion: modelo.descripcion || "",
          familiaId: modelo.familiaId || modelo.familia_id || modelo.familia?.id || "",
          activo: modelo.activo ?? true
        });

        const idModelo = getModeloId(modelo);
        if (idModelo) {
          await cargarImagenPrincipalModelo(idModelo);
        }
        return;
      }

      if (!esModal && modeloId) {
        try {
          const data = await obtenerModeloPorId(modeloId);
          setFormData({
            codigo: data.codigo || data.sku || "",
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            familiaId: data.familiaId || data.familia_id || data.familia?.id || "",
            activo: data.activo ?? true
          });

          const idModelo = getModeloId(data) || modeloId;
          await cargarImagenPrincipalModelo(idModelo);
        } catch (e) {
          console.error("Error cargando:", e);
        }
      }
    };

    cargar();
  }, [modeloId, modelo, esModal]);

  function handleChange(e) {
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
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setErroresBackend({});
      const rawFamiliaId = formData.familiaId?.toString().trim();
      const familiaIdNormalizado = rawFamiliaId && /^\d+$/.test(rawFamiliaId) ? Number(rawFamiliaId) : null;

      if (!familiaIdNormalizado) {
        setErroresBackend((prev) => ({
          ...prev,
          familiaId: "La familia es obligatoria"
        }));
        return;
      }

      const dataToSend = {
        codigo: formData.codigo?.toString().trim() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        familia_id: familiaIdNormalizado,
        activo: Boolean(formData.activo)
      };

      let respuesta;
      if (esEdicion) {
        const id = modelo?.id || modeloId;
        respuesta = await actualizarModelo(id, dataToSend);
      } else {
        respuesta = await crearModelo(dataToSend);
      }

      if (esModal) {
        onSave(respuesta);
      } else {
        setToastType("success");
        setToastMessage(esEdicion ? "Modelo actualizado con exito" : "Modelo registrado con exito");
        setTimeout(() => navigate("/modelos"), 1500);
      }
    } catch (error) {
      if (error.errors) {
        setErroresBackend(error.errors);
      } else if (esModal) {
        console.error("Error en modal:", error);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "Error al guardar los datos");
      }
    }
  }

  const manejarCambioImagen = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    if (!esEdicion) {
      setToastType("warning");
      setToastMessage("Primero guarda el modelo para poder administrar su imagen.");
      return;
    }

    const varianteDestinoId =
      imagenPrincipal?.varianteId ||
      getVarianteId(variantesModelo[0]);

    if (!varianteDestinoId) {
      setToastType("danger");
      setToastMessage("Este modelo no tiene variantes. Crea una variante antes de subir imagen.");
      return;
    }

    try {
      await subirImagenArchivo({
        archivo,
        varianteId: Number(varianteDestinoId),
        esPrincipal: true,
        altTexto: `Modelo ${formData.nombre || formData.codigo || ""}`.trim() || "Imagen del modelo"
      });

      setToastType("success");
      setToastMessage("Imagen del modelo actualizada.");

      const idModeloActual = modeloId || getModeloId(modelo);
      if (idModeloActual) {
        await cargarImagenPrincipalModelo(idModeloActual);
      }
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo actualizar la imagen del modelo.");
    }
  };

  const manejarEliminarImagen = async () => {
    if (!imagenPrincipal?.id || !imagenPrincipal?.varianteId) {
      setToastType("warning");
      setToastMessage("No hay imagen principal para eliminar.");
      return;
    }

    try {
      const listaResp = await obtenerImagenesPorVariante(imagenPrincipal.varianteId);
      const imagenesVariante = getLista(listaResp);

      if (imagenesVariante.length <= 1) {
        setToastType("warning");
        setToastMessage("No se puede eliminar la unica imagen principal. Sube otra primero.");
        return;
      }

      const alternativa = imagenesVariante.find((img) => Number(img.id) !== Number(imagenPrincipal.id));
      if (alternativa?.id) {
        await actualizarImagen(alternativa.id, {
          esPrincipal: true,
          orden: Number(alternativa.orden) || 1,
          altTexto: alternativa.altTexto || alternativa.nombre || "Imagen principal"
        });
      }

      await eliminarImagen(imagenPrincipal.id);

      setToastType("success");
      setToastMessage("Imagen principal eliminada.");

      const idModeloActual = modeloId || getModeloId(modelo);
      if (idModeloActual) {
        await cargarImagenPrincipalModelo(idModeloActual);
      }
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar la imagen.");
    }
  };

  const inputClass = (field) =>
    `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;
  const selectClass = (field) =>
    `form-select ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/modelos");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4"}>
      {!esModal && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />}

      {!esModal && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">{esEdicion ? "Editar Modelo" : "Nuevo Modelo"}</h2>
          <span className={`badge ${formData.activo ? "bg-success" : "bg-secondary"}`}>
            {formData.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className={esEdicion ? "col-lg-8" : "col-12"}>
            <div className="card shadow-sm border-0 mb-4 h-100">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-tag me-2"></i>Informacion del Modelo
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">
                      Codigo <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      className={inputClass("codigo")}
                      value={formData.codigo}
                      onChange={handleChange}
                      placeholder="Ej: MOD-001"
                    />
                    <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">
                      Nombre del Modelo <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      className={inputClass("nombre")}
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ej: Silla, Con Paleta, Plegable"
                    />
                    <div className="invalid-feedback">{erroresBackend.nombre || erroresExternos.nombre}</div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">
                      Familia <span className="text-danger">*</span>
                    </label>
                    <select
                      name="familiaId"
                      className={selectClass("familiaId")}
                      value={formData.familiaId}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona una familia...</option>
                      {familias.map((familia) => {
                        const familiaOptionId = familia.id ?? familia.familiaId;
                        return (
                          <option key={familiaOptionId} value={familiaOptionId}>
                            {familia.nombre}
                          </option>
                        );
                      })}
                    </select>
                    <div className="invalid-feedback">{erroresBackend.familiaId || erroresExternos.familiaId}</div>
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Descripcion</label>
                    <textarea
                      name="descripcion"
                      className={inputClass("descripcion")}
                      value={formData.descripcion || ""}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Descripcion detallada del modelo"
                    />
                    <div className="invalid-feedback">{erroresBackend.descripcion || erroresExternos.descripcion}</div>
                    <div className="form-text text-muted">Maximo 500 caracteres</div>
                  </div>

                  <div className="col-md-12">
                    <div className="border-top pt-3 mt-2">
                      <div className="d-flex align-items-center">
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleChange}
                            id="activoSwitch"
                            style={{ width: "40px", height: "20px", cursor: "pointer" }}
                          />
                        </div>
                        <div className="ms-3">
                          <label className="form-check-label fw-semibold d-block" htmlFor="activoSwitch" style={{ cursor: "pointer" }}>
                            Modelo {formData.activo ? "Activo" : "Inactivo"}
                          </label>
                          <small className="text-muted">
                            {formData.activo
                              ? "El modelo de producto esta habilitado y disponible"
                              : "El modelo de producto esta deshabilitado"}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {esEdicion && (
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 mb-4 h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 text-secondary">
                    <i className="bi bi-image me-2"></i>Imagen del Modelo
                  </h5>
                </div>
                <div className="card-body d-flex flex-column">
                  {cargandoImagen ? (
                    <div className="text-muted">Cargando imagen...</div>
                  ) : (
                    <>
                      {imagenPrincipal?.url ? (
                        <img
                          src={toPreviewUrl(imagenPrincipal.url)}
                          alt="Imagen del modelo"
                          style={{
                            width: "100%",
                            height: "320px",
                            objectFit: "contain",
                            backgroundColor: "#f8f9fa",
                            padding: "8px",
                            borderRadius: "10px",
                            border: "1px solid #dee2e6"
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light border rounded text-muted"
                          style={{ width: "100%", height: "320px", borderRadius: "10px" }}
                        >
                          Sin imagen
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-3 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {imagenPrincipal ? "Cambiar" : "Subir"} imagen
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={manejarEliminarImagen}
                          disabled={!imagenPrincipal}
                        >
                          Eliminar imagen
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={manejarCambioImagen}
                        />
                      </div>
                    </>
                  )}

                  {variantesModelo.length === 0 && (
                    <div className="form-text text-warning mt-2">
                      Este modelo no tiene variantes. Para gestionar imagen, crea al menos una variante.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {esEdicion && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 text-secondary">
                <i className="bi bi-box-seam me-2"></i>Productos de este modelo
              </h5>
            </div>
            <div className="card-body">
              {cargandoImagen ? (
                <div className="text-muted">Cargando variantes...</div>
              ) : variantesModelo.length === 0 ? (
                <div className="text-muted">Este modelo aun no tiene variantes.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Categoria</th>
                        <th>Color</th>
                        <th>Imagen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantesModelo.map((variante) => {
                        const varianteId = getVarianteId(variante);
                        const img = varianteId ? imagenesVariantes[varianteId] : null;

                        return (
                          <tr
                            key={varianteId || variante.sku || variante.nombre}
                            style={{ cursor: "pointer" }}
                            className={Number(varianteSeleccionadaId) === Number(varianteId) && !modoNuevaVariante ? "table-primary" : ""}
                            onClick={() => seleccionarVariante(variante)}
                          >
                            <td>
                              <code>{variante.sku || "-"}</code>
                            </td>
                            <td className="text-truncate" style={{ maxWidth: "300px" }} title={variante.nombre || "-"}>
                              {variante.nombre || "-"}
                            </td>
                            <td>{getCategoriaVariante(variante, categoriasCatalogo)}</td>
                            <td>{getColorVariante(variante, coloresCatalogo)}</td>
                            <td>
                              {img?.url ? (
                                <img
                                  src={toPreviewUrl(img.url)}
                                  alt={img.altTexto || variante.nombre || "Imagen variante"}
                                  style={{
                                    width: "64px",
                                    height: "64px",
                                    objectFit: "contain",
                                    backgroundColor: "#f8f9fa",
                                    padding: "4px",
                                    borderRadius: "6px",
                                    border: "1px solid #dee2e6"
                                  }}
                                />
                              ) : (
                                <span className="text-muted">Sin imagen</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {esEdicion && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 text-secondary">
                <i className="bi bi-pencil-square me-2"></i>Editor de variante
              </h5>
            </div>
            <div className="card-body">
              {variantesModelo.length === 0 ? (
                <div className="text-muted">Este modelo aun no tiene variantes para editar.</div>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={iniciarNuevaVariante}>
                      <i className="bi bi-plus-circle me-1"></i>
                      Nueva variante
                    </button>
                    {(varianteSeleccionadaId || modoNuevaVariante) && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setModoNuevaVariante(false);
                          setVarianteSeleccionadaId(null);
                          setVarianteForm(mapVarianteToForm());
                          setImagenesVarianteSeleccionada([]);
                        }}
                      >
                        Limpiar seleccion
                      </button>
                    )}
                  </div>

                  {!varianteSeleccionadaId && !modoNuevaVariante ? (
                    <div className="text-muted">Selecciona una variante de la tabla para editarla o crea una nueva.</div>
                  ) : (
                    <div className="row g-4">
                      <div className="col-lg-5">
                        <div className="border rounded p-3 h-100">
                          <h6 className="mb-3">{modoNuevaVariante ? "Nueva Variante" : "Editar Variante"}</h6>

                          <div className="mb-2">
                            <label className="form-label">SKU</label>
                            <input
                              type="text"
                              className="form-control"
                              value={varianteForm.sku || ""}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, sku: e.target.value }))}
                            />
                          </div>

                          <div className="mb-2">
                            <label className="form-label">Nombre</label>
                            <input
                              type="text"
                              className="form-control"
                              value={varianteForm.nombre || ""}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, nombre: e.target.value }))}
                            />
                          </div>

                          <div className="mb-2">
                            <label className="form-label">Descripcion</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={varianteForm.descripcion || ""}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                            />
                          </div>

                          <div className="mb-2">
                            <label className="form-label">Categoria</label>
                            <select
                              className="form-select"
                              value={varianteForm.id_nivel || ""}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, id_nivel: e.target.value }))}
                            >
                              <option value="">Sin categoria</option>
                              {categoriasCatalogo.map((cat) => {
                                const id = cat.id ?? cat.categoriaId ?? cat.id_nivel;
                                return (
                                  <option key={id} value={id}>
                                    {cat.codigo ? `[${cat.codigo}] ` : ""}{cat.nombre || `Categoria ${id}`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Color</label>
                            <select
                              className="form-select"
                              value={varianteForm.id_color || ""}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, id_color: e.target.value }))}
                            >
                              <option value="">Sin color</option>
                              {coloresCatalogo.map((color) => {
                                const id = color.id ?? color.colorId ?? color.id_color;
                                return (
                                  <option key={id} value={id}>
                                    {color.codigo ? `[${color.codigo}] ` : ""}{color.nombre || `Color ${id}`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="form-check form-switch mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="varianteActivaSwitch"
                              checked={Boolean(varianteForm.activo)}
                              onChange={(e) => setVarianteForm((prev) => ({ ...prev, activo: e.target.checked }))}
                            />
                            <label className="form-check-label" htmlFor="varianteActivaSwitch">
                              Variante activa
                            </label>
                          </div>

                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={guardarVarianteSeleccionada}
                              disabled={guardandoVariante}
                            >
                              {guardandoVariante ? "Guardando..." : "Guardar variante"}
                            </button>

                            {!modoNuevaVariante && varianteSeleccionadaId && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={eliminarVarianteSeleccionada}
                                disabled={eliminandoVariante}
                              >
                                {eliminandoVariante ? "Eliminando..." : "Eliminar variante"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-lg-7">
                        <div className="border rounded p-3 h-100">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Imagenes de la variante</h6>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => fileInputVarianteRef.current?.click()}
                              disabled={!varianteSeleccionadaId || subiendoImagenVariante}
                            >
                              {subiendoImagenVariante ? "Subiendo..." : "Agregar imagen"}
                            </button>
                          </div>

                          <input
                            ref={fileInputVarianteRef}
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={subirImagenAVarianteSeleccionada}
                          />
                          <input
                            ref={fileInputReemplazoRef}
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={reemplazarImagenVariante}
                          />

                          {!varianteSeleccionadaId ? (
                            <div className="text-muted">Selecciona una variante existente para gestionar sus imagenes.</div>
                          ) : imagenesVarianteSeleccionada.length === 0 ? (
                            <div className="text-muted">Esta variante no tiene imagenes.</div>
                          ) : (
                            <div className="row g-3">
                              {imagenesVarianteSeleccionada.map((imagen) => {
                                const activa = getImagenActiva(imagen);
                                const esPrincipal = Boolean(imagen?.esPrincipal || imagen?.principal);
                                const loading = actualizandoImagenId === imagen.id;

                                return (
                                  <div key={imagen.id} className="col-sm-6 col-md-4">
                                    <div className="card h-100">
                                      <div className="p-2">
                                        <img
                                          src={toPreviewUrl(imagen.url)}
                                          alt={imagen.altTexto || imagen.nombre || "Imagen"}
                                          style={{
                                            width: "100%",
                                            height: "120px",
                                            objectFit: "contain",
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "6px",
                                            border: "1px solid #dee2e6",
                                            padding: "4px"
                                          }}
                                        />
                                      </div>
                                      <div className="card-body py-2 px-2">
                                        <div className="d-flex gap-1 mb-2 flex-wrap">
                                          {esPrincipal && <span className="badge bg-primary">Principal</span>}
                                          <span className={`badge ${activa ? "bg-success" : "bg-secondary"}`}>
                                            {activa ? "Activa" : "Inactiva"}
                                          </span>
                                        </div>

                                        <div className="d-grid gap-1">
                                          <button
                                            type="button"
                                            className={`btn btn-sm ${activa ? "btn-outline-secondary" : "btn-outline-success"}`}
                                            disabled={loading}
                                            onClick={() => toggleEstadoImagenVariante(imagen)}
                                          >
                                            {loading ? "Guardando..." : activa ? "Desactivar" : "Activar"}
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            disabled={loading || esPrincipal}
                                            onClick={() => marcarImagenComoPrincipal(imagen)}
                                          >
                                            Marcar principal
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-warning"
                                            disabled={loading}
                                            onClick={() => iniciarReemplazoImagen(imagen)}
                                          >
                                            Reemplazar
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            disabled={loading}
                                            onClick={() => eliminarImagenVarianteSeleccionada(imagen)}
                                          >
                                            Eliminar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
          {esModal && (
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                id="switchActivoModal"
              />
              <label className="form-check-label fw-semibold" htmlFor="switchActivoModal">
                Modelo {formData.activo ? "Activo" : "Inactivo"}
              </label>
            </div>
          )}

          <div className={`gap-2 d-flex ${esModal ? "ms-auto" : ""}`}>
            <button type="button" className="btn btn-light px-4" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary px-5 fw-bold">
              {esEdicion ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
