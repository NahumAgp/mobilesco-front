import { useEffect, useMemo, useState } from "react";

import { obtenerModelosActivos } from "../../../../../modelos/services/modelos.js";
import request from "../../../../../../services/api.js";
import { API_PATHS } from "../../../../../../config/apiPaths.js";
import SearchableSelect from "../../../../../../components/ui/SearchableSelect.jsx";
import { ModeloDraftModal } from "../WizardDraftModal.jsx";
import { construirUrlImagen } from "../../../../services/imagenes.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const obtenerProductosPorModelo = (modeloId) =>
  request(`${API_PATHS.PRODUCTOS}/por-modelo/${modeloId}`);

const normalizarVarianteExistente = (producto) => ({
  id: `existing-${producto?.id}`,
  productoId: producto?.id,
  _existing: true,
  categoriaId: producto?.nivelId || producto?.id_nivel || producto?.categoriaId || "",
  categoriaNombre: producto?.nivelNombre || producto?.nombre_nivel || producto?.categoriaNombre || "",
  categoriaCodigo: producto?.nivelCodigo || producto?.codigo_nivel || producto?.categoriaCodigo || "",
  materialId: producto?.materialId || producto?.id_material || "",
  materialNombre: producto?.materialNombre || producto?.nombre_material || "",
  materialCodigo: producto?.materialCodigo || producto?.codigo_material || "",
  colorId: producto?.colorId || producto?.id_color || "",
  colorNombre: producto?.colorNombre || producto?.nombre_color || "",
  colorCodigo: producto?.colorCodigo || producto?.codigo_color || "",
  colorHex: producto?.colorHex || producto?.hexColor || producto?.hex_color || "",
  sku: producto?.sku || "",
  descripcionCorta: producto?.descripcionCorta || "",
  ancho: producto?.ancho ?? "",
  alto: producto?.alto ?? "",
  fondo: producto?.fondo ?? "",
  pesoKg: producto?.pesoKg ?? ""
});

const normalizarImagenesExistentes = (producto, variante) => {
  const imagenes = [];
  const agregar = (imagen, origen = "galeria") => {
    if (!imagen) return;
    const url = imagen?.url || imagen;
    if (!url) return;
    const key = imagen?.id ? `id-${imagen.id}` : `url-${url}`;
    if (imagenes.some((item) => item._sourceKey === key)) return;

    imagenes.push({
      id: imagen?.id ? `persisted-${imagen.id}` : `persisted-${imagenes.length}-${variante.id}`,
      imagenId: imagen?.id || null,
      _sourceKey: key,
      persisted: true,
      readonly: true,
      origen,
      nombre: imagen?.altTexto || imagen?.nombre || `Imagen ${imagenes.length + 1}`,
      url: /^blob:/i.test(url) ? url : construirUrlImagen(url),
      varianteId: variante.id,
      productoId: variante.productoId,
      materialId: variante.materialId,
      materialNombre: variante.materialNombre,
      colorId: variante.colorId,
      colorNombre: variante.colorNombre,
      principal: Boolean(imagen?.esPrincipal || imagen?.principal)
    });
  };

  agregar(producto?.imagenPrincipal, "principal");
  if (Array.isArray(producto?.imagenes)) {
    producto.imagenes.forEach((imagen) => agregar(imagen));
  }

  if (imagenes.length > 0 && !imagenes.some((imagen) => imagen.principal)) {
    imagenes[0] = { ...imagenes[0], principal: true };
  }

  return imagenes.map((imagen) => {
    const normalizada = { ...imagen };
    delete normalizada._sourceKey;
    return normalizada;
  });
};

const getNombreLinea = (modelo = {}) =>
  modelo?.linea?.nombre || modelo?.lineaNombre || modelo?.familia?.linea?.nombre || modelo?.familia?.lineaNombre || "";

const getNombreFamilia = (modelo = {}) =>
  modelo?.familia?.nombre || modelo?.familiaNombre || "";

const getNombreSubfamilia = (modelo = {}) =>
  modelo?.subfamilia?.nombre || modelo?.subfamiliaNombre || "";

const getModeloLabel = (modelo = {}) => {
  const ruta = [getNombreLinea(modelo), getNombreFamilia(modelo), getNombreSubfamilia(modelo), modelo?.nombre || "-"].filter(Boolean).join(" / ");
  return `${modelo.codigo ? `[${modelo.codigo}] ` : ""}${ruta}`;
};

export default function ModeloStep({ data, onUpdate, borradores, onUpsertDraft }) {
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoVariantes, setCargandoVariantes] = useState(false);
  const [mostrarNuevoModelo, setMostrarNuevoModelo] = useState(false);

  const modelo = data?.modelo || {};

  useEffect(() => {
    obtenerModelosActivos()
      .then((respuesta) => setModelos(getLista(respuesta)))
      .catch((error) => console.error("Error cargando modelos:", error))
      .finally(() => setCargando(false));
  }, []);

  const modeloSeleccionado = useMemo(
    () => modelos.find((item) => String(item.id) === String(modelo.id || "")) || null,
    [modelos, modelo.id]
  );

  const limpiarVariantesDelModelo = () => {
    onUpdate("variantes", []);
    onUpdate("imagenes", { modelo: null, variantes: {} });
  };

  const seleccionarModelo = async (modeloId, opcion) => {
    limpiarVariantesDelModelo();
    onUpdate("modelo", {
      modo: "existente",
      id: modeloId || null,
      ref: undefined,
      _pending: false,
      codigo: opcion?.codigo || "",
      nombre: opcion?.nombre || "",
      descripcion: opcion?.descripcion || "",
      descripcionCorta: opcion?.descripcionCorta || "",
      familiaId: opcion?.familiaId || opcion?.familia?.id || "",
      subfamiliaId: opcion?.subfamiliaId || opcion?.subfamilia?.id || "",
      familiaRef: undefined,
      familia: opcion?.familia || null,
      subfamilia: opcion?.subfamilia || (opcion?.subfamiliaNombre ? {
        id: opcion.subfamiliaId,
        nombre: opcion.subfamiliaNombre,
        codigo: opcion.subfamiliaCodigo
      } : null),
      linea: opcion?.linea || null,
      categorias: Array.isArray(opcion?.categorias) ? opcion.categorias : [],
      materiales: Array.isArray(opcion?.materiales) ? opcion.materiales : [],
      insumos: Array.isArray(opcion?.insumos) ? opcion.insumos : [],
      operaciones: Array.isArray(opcion?.operaciones) ? opcion.operaciones : []
    });

    if (!modeloId) return;

    try {
      setCargandoVariantes(true);
      const productosModelo = getLista(await obtenerProductosPorModelo(modeloId));
      const existentes = productosModelo
        .map((producto) => ({
          producto,
          variante: normalizarVarianteExistente(producto)
        }))
        .filter(({ variante }) => variante.categoriaId && variante.materialId && variante.colorId);
      const imagenesPorVariante = {};

      existentes.forEach(({ producto, variante }) => {
        const imagenes = normalizarImagenesExistentes(producto, variante);
        if (imagenes.length > 0) {
          imagenesPorVariante[String(variante.id)] = imagenes;
        }
      });

      onUpdate(
        "variantes",
        existentes.map(({ variante }) => variante)
      );
      onUpdate("imagenes", { modelo: null, variantes: imagenesPorVariante });
    } catch (error) {
      console.error("No se pudieron cargar las variantes existentes del modelo:", error);
    } finally {
      setCargandoVariantes(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div>
        <p className="mb-0 mt-2">Cargando informacion basica...</p>
      </div>
    );
  }

  const visible = modeloSeleccionado || (modelo?._pending ? modelo : null);

  return (
    <>
      <div>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h4 className="mb-1"><i className="bi bi-box-seam me-2 text-primary"></i>Selecciona el modelo</h4>
            <p className="text-muted mb-0">El modelo define la familia y las categorias disponibles para los nuevos productos.</p>
          </div>
          <button type="button" className="btn productos-brand-primary" onClick={() => setMostrarNuevoModelo(true)}>
            <i className="bi bi-plus-circle me-2"></i>Crear nuevo modelo
          </button>
        </div>

        <div className="producto-modelo-selector">
          <SearchableSelect
            label="Modelo"
            value={modelo?._pending ? "" : modelo.id || ""}
            options={modelos}
            onChange={seleccionarModelo}
            placeholder="Seleccionar modelo..."
            searchPlaceholder="Busca por codigo, nombre o descripcion..."
            getOptionValue={(item) => item.id}
            getOptionLabel={getModeloLabel}
            getOptionSearchText={(item) => [item.codigo, getNombreLinea(item), getNombreFamilia(item), item.nombre, item.descripcion].filter(Boolean).join(" ").toLowerCase()}
          />
          {cargandoVariantes && (
            <div className="form-text">Cargando variantes ya creadas del modelo...</div>
          )}

          {visible ? (
            <div className="producto-modelo-seleccionado mt-4">
              <div className="producto-modelo-seleccionado-icon"><i className="bi bi-check-lg"></i></div>
              <div>
                <div className="fw-semibold">
                  {visible.nombre}
                  {modelo?._pending && <span className="badge text-bg-warning ms-2">Pendiente</span>}
                </div>
                <div className="small text-muted">
                  {[visible.codigo, [getNombreLinea(visible), getNombreFamilia(visible), visible?.subfamilia?.nombre || visible?.subfamiliaNombre].filter(Boolean).join(" / ")].filter(Boolean).join(" - ")}
                </div>
              </div>
              <span className="badge text-bg-light ms-auto">{(visible.categorias || []).length} categorias</span>
              <span className="badge text-bg-light ms-2">{(visible.materiales || []).length} materiales</span>
              {modelo?._pending && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setMostrarNuevoModelo(true)}>Editar</button>
              )}
            </div>
          ) : (
            <div className="producto-modelo-ayuda mt-4">
              <i className="bi bi-lightbulb me-2"></i>Busca un modelo existente o crea uno nuevo sin salir del wizard.
            </div>
          )}
        </div>
      </div>

      <ModeloDraftModal
        show={mostrarNuevoModelo}
        initialValue={modelo?._pending ? modelo : null}
        modelos={modelos}
        borradores={borradores}
        onUpsertDraft={onUpsertDraft}
        onClose={() => setMostrarNuevoModelo(false)}
        onSave={(borrador) => {
          limpiarVariantesDelModelo();
          onUpdate("modelo", borrador);
          setMostrarNuevoModelo(false);
        }}
      />
    </>
  );
}
