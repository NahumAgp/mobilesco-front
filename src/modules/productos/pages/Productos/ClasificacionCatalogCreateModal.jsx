import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useGeneratedCatalogCode } from "../../../../hooks/useGeneratedCatalogCode.js";
import { lineaProductoGateway } from "../../../lineas-producto/services/lineaProductoGateway.js";
import { familiaGateway } from "../../../familias/services/familiaGateway.js";
import {
  crearSubfamilia,
  obtenerCodigoSubfamiliaSugerido,
} from "../../../subfamilias/services/subfamilias.js";

const CONFIG = {
  linea: {
    title: "Nueva línea",
    eyebrow: "Clasificación principal",
    icon: "bi-diagram-3",
    placeholder: "Ej. Hospitalaria",
    description: "La línea estará disponible inmediatamente en este producto.",
  },
  familia: {
    title: "Nueva familia",
    eyebrow: "Clasificación intermedia",
    icon: "bi-folder-plus",
    placeholder: "Ej. Pupitre",
    description: "La familia se creará dentro de la línea seleccionada.",
  },
  subfamilia: {
    title: "Nueva subfamilia",
    eyebrow: "Clasificación específica",
    icon: "bi-tags",
    placeholder: "Ej. Mesabanco",
    description: "La subfamilia se creará dentro de la familia seleccionada.",
  },
};

const getBackendError = (error, field) =>
  error?.errors?.[field]
  || error?.errors?.[`${field}Id`]
  || error?.errors?.[`${field}_id`]
  || "";

export default function ClasificacionCatalogCreateModal({
  tipo,
  lineaId,
  lineaNombre,
  familiaId,
  familiaNombre,
  onClose,
  onCreated,
}) {
  const config = CONFIG[tipo];
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const obtenerCodigo = useCallback((nombre) => {
    if (tipo === "linea") return lineaProductoGateway.obtenerCodigoSugerido(nombre);
    if (tipo === "familia") return familiaGateway.obtenerCodigoSugerido(nombre, lineaId);
    return obtenerCodigoSubfamiliaSugerido(nombre, familiaId);
  }, [familiaId, lineaId, tipo]);

  const codigoHabilitado = Boolean(
    tipo === "linea"
    || (tipo === "familia" && lineaId)
    || (tipo === "subfamilia" && familiaId)
  );
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    formData.nombre,
    codigoHabilitado,
    obtenerCodigo
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !guardando) onClose();
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [guardando, onClose]);

  if (!config) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nombre = formData.nombre.trim();
    if (!nombre) {
      setErrores({ nombre: "El nombre es obligatorio." });
      return;
    }
    if (tipo === "familia" && !lineaId) {
      setErrores({ general: "Selecciona primero una línea." });
      return;
    }
    if (tipo === "subfamilia" && !familiaId) {
      setErrores({ general: "Selecciona primero una familia." });
      return;
    }

    try {
      setGuardando(true);
      setErrores({});
      const base = {
        nombre,
        descripcion: formData.descripcion.trim(),
        activo: true,
      };
      let creado;
      if (tipo === "linea") {
        creado = await lineaProductoGateway.crearLineaProducto(base);
      } else if (tipo === "familia") {
        const parentId = Number(lineaId);
        creado = await familiaGateway.crearFamilia({
          ...base,
          lineaId: parentId,
          linea_id: parentId,
        });
      } else {
        creado = await crearSubfamilia({
          ...base,
          familia_id: Number(familiaId),
        });
      }
      await onCreated({ tipo, creado, nombre });
    } catch (error) {
      setErrores({
        nombre: getBackendError(error, "nombre"),
        descripcion: getBackendError(error, "descripcion"),
        general: error?.message || "No se pudo crear el registro.",
      });
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div
      className="producto-catalog-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !guardando) onClose();
      }}
    >
      <section
        className="producto-catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`producto-catalog-modal-${tipo}`}
      >
        <header className="producto-catalog-modal-header">
          <div className="producto-catalog-modal-icon">
            <i className={`bi ${config.icon}`}></i>
          </div>
          <div>
            <div className="producto-catalog-modal-eyebrow">{config.eyebrow}</div>
            <h3 id={`producto-catalog-modal-${tipo}`}>{config.title}</h3>
          </div>
          <button
            type="button"
            className="producto-catalog-modal-close"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="producto-catalog-modal-body">
            <p className="producto-catalog-modal-description">{config.description}</p>

            {tipo !== "linea" && (
              <div className="producto-catalog-parent">
                <span>{tipo === "familia" ? "Línea seleccionada" : "Familia seleccionada"}</span>
                <strong>{tipo === "familia" ? lineaNombre : familiaNombre}</strong>
              </div>
            )}

            {errores.general && (
              <div className="alert alert-danger py-2" role="alert">{errores.general}</div>
            )}

            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label fw-semibold" htmlFor={`catalogo-${tipo}-nombre`}>
                  Nombre <span className="text-danger">*</span>
                </label>
                <input
                  id={`catalogo-${tipo}-nombre`}
                  autoFocus
                  type="text"
                  name="nombre"
                  className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder={config.placeholder}
                  disabled={guardando}
                />
                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Código</label>
                <div className="producto-catalog-code">
                  {generandoCodigo ? (
                    <><span className="spinner-border spinner-border-sm"></span> Generando</>
                  ) : codigoGenerado ? (
                    codigoGenerado
                  ) : (
                    "Automático"
                  )}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor={`catalogo-${tipo}-descripcion`}>
                  Descripción
                </label>
                <textarea
                  id={`catalogo-${tipo}-descripcion`}
                  name="descripcion"
                  className={`form-control ${errores.descripcion ? "is-invalid" : ""}`}
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción opcional"
                  disabled={guardando}
                />
                {errores.descripcion && <div className="invalid-feedback">{errores.descripcion}</div>}
              </div>
            </div>
          </div>

          <footer className="producto-catalog-modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn producto-form-primary" disabled={guardando || generandoCodigo}>
              {guardando ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Creando...</>
              ) : (
                <><i className="bi bi-plus-lg me-2"></i>Crear y seleccionar</>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body
  );
}
