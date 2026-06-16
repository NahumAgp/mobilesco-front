import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerModeloPorId,
  crearModelo,
  actualizarModelo,
  eliminarModelo,
  subirImagenModelo,
  eliminarImagenModelo,
  obtenerCodigoSugerido
} from "../services/modelos.js";
import { obtenerFamilias } from "../../familias/services/familias.js";
import { obtenerProductos } from "../../productos/services/productos.js";
import { materialGateway } from "../../materiales/services/materialGateway.js";
import { obtenerCategoriasGlobalesActivas } from "../services/categoriasGlobales.js";
import { API_BASE_URL } from "../../../config/apiConfig.js";
import Toast from "../../../components/ui/Toast.jsx";
import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import "./ModelosPage.css";
import { useGeneratedCatalogCode } from "../../../hooks/useGeneratedCatalogCode.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  const visitados = new Set();
  const buscarLista = (valor, nivel = 0) => {
    if (Array.isArray(valor)) return valor;
    if (!valor || typeof valor !== "object" || nivel > 4 || visitados.has(valor)) return null;

    visitados.add(valor);

    const clavesPreferidas = [
      "content",
      "data",
      "items",
      "results",
      "productos",
      "variantes",
      "lista",
      "rows",
      "payload"
    ];

    for (const clave of clavesPreferidas) {
      const candidato = valor?.[clave];
      if (Array.isArray(candidato)) return candidato;
    }

    for (const nested of Object.values(valor)) {
      const encontrado = buscarLista(nested, nivel + 1);
      if (Array.isArray(encontrado)) return encontrado;
    }

    return null;
  };

  return buscarLista(respuesta) || [];
};

const getModeloId = (modelo) =>
  modelo?.id ||
  modelo?.modeloId ||
  modelo?.id_modelo ||
  modelo?.modelo_id ||
  modelo?.producto_base_id ||
  modelo?.id_producto_base ||
  modelo?.productoBaseId ||
  null;

const getModeloRelacionadoId = (item) =>
  item?.id_modelo ||
  item?.modeloId ||
  item?.modelo_id ||
  item?.producto_base_id ||
  item?.productoBaseId ||
  item?.id_producto_base ||
  item?.modelo?.id ||
  item?.modelo?.modeloId ||
  item?.productoBase?.id ||
  item?.producto_base?.id ||
  null;

const coincideModeloId = (item, modeloId) =>
  String(getModeloRelacionadoId(item) ?? "") === String(modeloId ?? "");

const coincideModeloIdFlexible = (item, modeloId, nivel = 0, visitados = new Set()) => {
  if (!item || typeof item !== "object" || nivel > 2 || visitados.has(item)) return false;
  visitados.add(item);

  for (const [clave, valor] of Object.entries(item)) {
    if (valor === null || valor === undefined) continue;

    if (typeof valor === "object") {
      if (coincideModeloIdFlexible(valor, modeloId, nivel + 1, visitados)) return true;
      continue;
    }

    if (String(valor) !== String(modeloId)) continue;

    if (/id|modelo|producto|base/i.test(clave)) {
      return true;
    }
  }

  return false;
};

const getVariantesDelModelo = (modelo = {}) => {
  const candidatos = [
    modelo?.variantes,
    modelo?.productos,
    modelo?.productosRelacionados,
    modelo?.productosHijos,
    modelo?.hijos,
    modelo?.detalle?.variantes,
    modelo?.detalle?.productos
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato) && candidato.length > 0) {
      return candidato;
    }
  }

  return [];
};

const toPreviewUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const getMaterialesDelModelo = (modelo = {}) => {
  const candidatos = [
    modelo?.materiales,
    modelo?.materialesSeleccionados,
    modelo?.materiales_modelo,
    modelo?.materialesModelos,
    modelo?.materiales_asociados
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) {
      return candidato.map((material) => ({
        ...material,
        id: material?.id ?? material?.materialId ?? material?.id_material ?? material?.material_id ?? null,
        codigo: material?.codigo ?? material?.codigo_material ?? "",
        nombre: material?.nombre ?? material?.nombre_material ?? "",
        descripcion: material?.descripcion ?? material?.descripcion_material ?? "",
        activo: material?.activo ?? true
      }));
    }
  }

  return [];
};

const getCategoriasDelModelo = (modelo = {}) => {
  const candidatos = [
    modelo?.categorias,
    modelo?.categoriasSeleccionadas,
    modelo?.niveles,
    modelo?.nivelesSeleccionados
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) {
      return candidato.map((categoria) => ({
        ...categoria,
        id: categoria?.id ?? categoria?.nivelId ?? categoria?.nivel_id ?? null,
        categoriaId: categoria?.categoriaId ?? categoria?.categoria_id ?? categoria?.categoria?.id ?? null,
        codigo: categoria?.codigo ?? "",
        nombre: categoria?.nombre ?? categoria?.categoriaNombre ?? categoria?.categoria?.nombre ?? "",
        descripcion: categoria?.descripcion ?? categoria?.categoria?.descripcion ?? "",
        activo: categoria?.activo ?? true
      }));
    }
  }

  return [];
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
  const [materialesCatalogo, setMaterialesCatalogo] = useState([]);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
  const [materialSeleccionadoId, setMaterialSeleccionadoId] = useState("");
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState("");
  const [variantesModelo, setVariantesModelo] = useState([]);
  const [imagenPrincipal, setImagenPrincipal] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [cargandoMateriales, setCargandoMateriales] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);

  const fileInputRef = useRef(null);

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
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    formData.nombre,
    !esEdicion,
    obtenerCodigoSugerido
  );

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const familiasResp = await obtenerFamilias();
        setFamilias(getLista(familiasResp));
      } catch (error) {
        console.error("Error cargando catalogos:", error);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        setCargandoMateriales(true);
        const materialesResp = await materialGateway.obtenerMaterialesActivos();
        setMaterialesCatalogo(getLista(materialesResp));
      } catch (error) {
        console.error("Error cargando materiales:", error);
        setMaterialesCatalogo([]);
      } finally {
        setCargandoMateriales(false);
      }
    };

    cargarMateriales();
  }, []);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setCargandoCategorias(true);
        const categoriasResp = await obtenerCategoriasGlobalesActivas();
        setCategoriasCatalogo(getLista(categoriasResp));
      } catch (error) {
        console.error("Error cargando categorias globales:", error);
        setCategoriasCatalogo([]);
      } finally {
        setCargandoCategorias(false);
      }
    };

    cargarCategorias();
  }, []);

  const cargarImagenPrincipalModelo = async (modeloFuente) => {
    const idModelo = typeof modeloFuente === "object" ? getModeloId(modeloFuente) : modeloFuente;
    const productosLocales = typeof modeloFuente === "object" ? getVariantesDelModelo(modeloFuente) : [];
    const imagenLocal = typeof modeloFuente === "object" ? getImagenDesdeRespuesta(modeloFuente) : null;

    if (!idModelo && !imagenLocal?.url) {
      setVariantesModelo([]);
      setImagenPrincipal(null);
      return;
    }

    setCargandoImagen(true);
    try {
      let principal = imagenLocal ? { ...imagenLocal, modeloId: idModelo || null } : null;

      if (idModelo && !principal?.url) {
        const modeloActualizado = await obtenerModeloPorId(idModelo);
        const imagenModelo = getImagenDesdeRespuesta(modeloActualizado);
        if (imagenModelo?.url) {
          principal = { ...imagenModelo, modeloId: idModelo };
        }
      }

      const productosDelModelo =
        productosLocales.length > 0
          ? productosLocales
          : idModelo
            ? getLista(await obtenerProductos()).filter(
                (item) => coincideModeloId(item, idModelo) || coincideModeloIdFlexible(item, idModelo)
              )
            : [];

      setVariantesModelo(productosDelModelo);
      setImagenPrincipal(principal);
    } catch (error) {
      console.error("Error cargando imagen principal del modelo:", error);
      setImagenPrincipal(null);
      setVariantesModelo([]);
    } finally {
      setCargandoImagen(false);
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
        setMaterialesSeleccionados(getMaterialesDelModelo(modelo));
        setCategoriasSeleccionadas(getCategoriasDelModelo(modelo));

        await cargarImagenPrincipalModelo(modelo);
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
          setMaterialesSeleccionados(getMaterialesDelModelo(data));
          setCategoriasSeleccionadas(getCategoriasDelModelo(data));

          await cargarImagenPrincipalModelo(data || modeloId);
        } catch (error) {
          console.error("Error cargando:", error);
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

  const materialesDisponibles = materialesCatalogo.filter(
    (material) =>
      !materialesSeleccionados.some(
        (seleccionado) => String(seleccionado.id ?? seleccionado.materialId ?? "") === String(material.id)
      )
  );

  const agregarMaterial = (materialId, material) => {
    const idNormalizado = Number(materialId);
    if (!Number.isFinite(idNormalizado)) {
      return;
    }

    setMaterialesSeleccionados((prev) => {
      if (prev.some((item) => String(item.id) === String(idNormalizado))) {
        return prev;
      }

      const materialCompleto =
        material || materialesCatalogo.find((item) => String(item.id) === String(idNormalizado));

      if (!materialCompleto) {
        return prev;
      }

      return [...prev, materialCompleto];
    });
    setMaterialSeleccionadoId("");
  };

  const quitarMaterial = (materialId) => {
    setMaterialesSeleccionados((prev) => prev.filter((material) => String(material.id) !== String(materialId)));
  };

  const categoriasDisponibles = useMemo(
    () =>
      categoriasCatalogo.filter(
        (categoria) =>
          !categoriasSeleccionadas.some(
            (seleccionada) => String(seleccionada.categoriaId ?? seleccionada.id ?? "") === String(categoria.id)
          )
      ),
    [categoriasCatalogo, categoriasSeleccionadas]
  );

  const agregarCategoria = (categoriaId, categoria) => {
    const idNormalizado = Number(categoriaId);
    if (!Number.isFinite(idNormalizado)) return;

    setCategoriasSeleccionadas((prev) => {
      if (prev.some((item) => String(item.categoriaId ?? item.id) === String(idNormalizado))) {
        return prev;
      }

      const categoriaCompleta =
        categoria || categoriasCatalogo.find((item) => String(item.id) === String(idNormalizado));

      if (!categoriaCompleta) {
        return prev;
      }

      return [
        ...prev,
        {
          categoriaId: categoriaCompleta.id,
          id: null,
          codigo: "",
          nombre: categoriaCompleta.nombre || "",
          descripcion: categoriaCompleta.descripcion || "",
          activo: categoriaCompleta.activo ?? true
        }
      ];
    });

    setCategoriaSeleccionadaId("");
  };

  const quitarCategoria = (categoriaId) => {
    setCategoriasSeleccionadas((prev) =>
      prev.filter((categoria) => String(categoria.categoriaId ?? categoria.id) !== String(categoriaId))
    );
  };

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

      const categorias = categoriasSeleccionadas.map((categoria, index) => ({
        id: categoria.id || null,
        categoria_id: categoria.categoriaId || categoria.id || null,
        codigo: categoria.codigo?.trim().toUpperCase() || null,
        nombre: categoria.nombre?.trim() || "",
        descripcion: categoria.descripcion?.trim() || "",
        activo: categoria.activo !== false,
        orden: index + 1
      }));
      if (!categorias.length || categorias.some((categoria) => !categoria.categoria_id)) {
        setErroresBackend((prev) => ({
          ...prev,
          categorias: "El modelo debe tener al menos una categoria seleccionada"
        }));
        return;
      }

      const dataToSend = {
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        familia_id: familiaIdNormalizado,
        activo: Boolean(formData.activo),
        categorias: categorias.map(({ orden, ...categoria }) => categoria),
        materiales: materialesSeleccionados
          .map((material) => Number(material.id))
          .filter((id) => Number.isFinite(id))
      };
      if (esEdicion) {
        dataToSend.codigo = formData.codigo?.toString().trim() || "";
      }

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

    const idModeloActual = modeloId || getModeloId(modelo);

    if (!idModeloActual) {
      setToastType("danger");
      setToastMessage("No se encontro el ID del modelo para subir la imagen.");
      return;
    }

    try {
      const modeloActualizado = await subirImagenModelo(Number(idModeloActual), archivo);

      setToastType("success");
      setToastMessage("Imagen del modelo actualizada.");

      await cargarImagenPrincipalModelo(modeloActualizado || idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo actualizar la imagen del modelo.");
    }
  };

  const manejarEliminarImagen = async () => {
    const idModeloActual = imagenPrincipal?.modeloId || modeloId || getModeloId(modelo);

    if (!imagenPrincipal?.url || !idModeloActual) {
      setToastType("warning");
      setToastMessage("No hay imagen de modelo para eliminar.");
      return;
    }

    try {
      const modeloActualizado = await eliminarImagenModelo(idModeloActual);

      setToastType("success");
      setToastMessage("Imagen del modelo eliminada.");

      await cargarImagenPrincipalModelo(modeloActualizado || idModeloActual);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar la imagen.");
    }
  };

  const inputClass = (field) =>
    `form-control ${(erroresBackend[field] || erroresExternos[field]) ? "is-invalid" : "border-soft"}`;

  const handleCancel = () => {
    if (esModal) {
      onCancel();
    } else {
      navigate("/modelos");
    }
  };

  const handleEliminar = async () => {
    if (!esEdicion || esModal) return;

    const confirmado = window.confirm("¿Seguro que deseas eliminar este modelo?");
    if (!confirmado) return;

    const id = modelo?.id || modeloId;
    if (!id) {
      setToastType("danger");
      setToastMessage("No se encontro el ID del modelo para eliminar.");
      return;
    }

    try {
      await eliminarModelo(id);
      setToastType("success");
      setToastMessage("Modelo eliminado con exito");
      setTimeout(() => navigate("/modelos"), 1200);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar el modelo");
    }
  };

  return (
    <div className={esModal ? "" : "container py-4 modelos-page-shell"}>
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
            <div className="card shadow-sm border-0 mb-4 h-100 modelos-table-card">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 text-secondary">
                  <i className="bi bi-tag me-2"></i>Informacion del Modelo
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
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
                      Codigo generado <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      className={`${inputClass("codigo")} ${!esEdicion ? "bg-light text-secondary" : ""}`}
                      value={esEdicion ? formData.codigo : codigoGenerado}
                      onChange={handleChange}
                      readOnly={!esEdicion}
                      maxLength="3"
                      placeholder={generandoCodigo ? "Generando..." : "Automatico"}
                    />
                    <div className="invalid-feedback">{erroresBackend.codigo || erroresExternos.codigo}</div>
                  </div>

                  <div className="col-md-4">
                    <SearchableSelect
                      label="Familia"
                      value={formData.familiaId}
                      options={familias}
                      onChange={(value) => handleChange({ target: { name: "familiaId", value } })}
                      placeholder="Selecciona una familia..."
                      searchPlaceholder="Escribe código, nombre o descripción..."
                      error={erroresBackend.familiaId || erroresExternos.familiaId}
                      getOptionValue={(familia) => familia.id ?? familia.familiaId}
                      getOptionLabel={(familia) => `${familia.codigo ? `[${familia.codigo}] ` : ""}${familia.nombre || "-"}`}
                      getOptionSearchText={(familia) =>
                        [familia.codigo, familia.nombre, familia.descripcion].filter(Boolean).join(" ").toLowerCase()
                      }
                    />
                  </div>

                  <div className="col-md-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-semibold mb-0">Materiales del modelo</label>
                      <small className="text-muted">
                        Catálogo global, reutilizable en cualquier modelo
                      </small>
                    </div>

                    <SearchableSelect
                      label=""
                      value={materialSeleccionadoId}
                      options={materialesDisponibles}
                      onChange={agregarMaterial}
                      placeholder={cargandoMateriales ? "Cargando materiales..." : "Buscar y agregar material..."}
                      searchPlaceholder="Escribe código, nombre o descripción..."
                      loading={cargandoMateriales}
                      emptyText="No hay materiales disponibles"
                      getOptionValue={(material) => material.id ?? material.materialId}
                      getOptionLabel={(material) => `${material.codigo ? `[${material.codigo}] ` : ""}${material.nombre || "-"}`}
                      getOptionSearchText={(material) =>
                        [material.codigo, material.nombre, material.descripcion].filter(Boolean).join(" ").toLowerCase()
                      }
                      renderOptionLabel={(material) =>
                        `${material.codigo ? `[${material.codigo}] ` : ""}${material.nombre || "-"}`
                      }
                      helperText="Selecciona materiales para este modelo sin sacarlos del catálogo general."
                      className="mb-2"
                    />

                    {materialesSeleccionados.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {materialesSeleccionados.map((material) => (
                          <span
                            key={material.id}
                            className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2"
                          >
                            <span>
                              {material.codigo ? `[${material.codigo}] ` : ""}
                              {material.nombre || "-"}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0 bg-transparent text-danger"
                              onClick={() => quitarMaterial(material.id)}
                              aria-label={`Quitar material ${material.nombre || material.codigo || material.id}`}
                              title="Quitar material"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="form-text text-muted">
                        Aún no se ha asociado ningún material a este modelo.
                      </div>
                    )}
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
                    <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-2 mb-3">
                      <div>
                        <div className="fw-semibold">Categorias del catalogo global</div>
                        <small className="text-muted">
                          Selecciona categorias globales y el sistema les asignara un codigo interno por modelo: 01, 02, 03...
                        </small>
                      </div>
                    </div>

                    {erroresBackend.categorias && (
                      <div className="alert alert-warning py-2">{erroresBackend.categorias}</div>
                    )}

                    <label className="form-label fw-semibold mb-2">
                      Buscar categoría global
                    </label>
                    <SearchableSelect
                      label=""
                      value={categoriaSeleccionadaId}
                      options={categoriasDisponibles}
                      onChange={agregarCategoria}
                      placeholder={cargandoCategorias ? "Cargando categorías..." : "Buscar y agregar categoría global..."}
                      searchPlaceholder="Escribe código, nombre o descripción..."
                      emptyText="No hay categorías globales disponibles"
                      getOptionValue={(categoria) => categoria.id}
                      getOptionLabel={(categoria) => `${categoria.codigo ? `[${categoria.codigo}] ` : ""}${categoria.nombre || "-"}`}
                      getOptionSearchText={(categoria) =>
                        [categoria.codigo, categoria.nombre, categoria.descripcion].filter(Boolean).join(" ").toLowerCase()
                      }
                      renderOptionLabel={(categoria) =>
                        `${categoria.codigo ? `[${categoria.codigo}] ` : ""}${categoria.nombre || "-"}`
                      }
                      helperText="Selecciona una categoría del catálogo global y se enlazará al modelo."
                      className="mb-3"
                    />

                    {categoriasSeleccionadas.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {categoriasSeleccionadas.map((categoria, index) => (
                          <span
                            key={categoria.id || categoria.categoriaId || index}
                            className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2"
                          >
                            <span className="fw-semibold">
                              {categoria.codigo ? `[${categoria.codigo}] ` : `[${String(index + 1).padStart(2, "0")}] `}
                              {categoria.nombre || "-"}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm p-0 border-0 bg-transparent text-danger"
                              onClick={() => quitarCategoria(categoria.categoriaId ?? categoria.id)}
                              aria-label={`Quitar categoria ${categoria.nombre || categoria.id || categoria.categoriaId}`}
                              title="Quitar categoria"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="form-text text-muted">
                        Aun no se ha asociado ninguna categoria al modelo.
                      </div>
                    )}
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
              <div className="card shadow-sm border-0 mb-4 h-100 modelos-table-card">
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
                      Este modelo aun no tiene productos, pero la portada del modelo se puede cargar aqui.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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
            {!esModal && esEdicion && (
              <button type="button" className="btn btn-outline-danger px-4" onClick={handleEliminar}>
                Eliminar
              </button>
            )}
            <button type="button" className="btn btn-light px-4" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn modelos-brand-primary px-5 fw-bold">
              {esEdicion ? "Guardar Cambios" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


