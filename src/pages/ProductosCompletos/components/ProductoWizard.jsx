import { useState } from "react";
import ModeloStep from "./steps/ModeloStep";
import VariantesStep from "./steps/VariantesStep";
import ImagenesStep from "./steps/ImagenesStep";
import ResumenStep from "./steps/ResumenStep";

const PASOS = [
  { id: 1, nombre: "Modelo", icono: "bi-box" },
  { id: 2, nombre: "Variantes", icono: "bi-palette" },
  { id: 3, nombre: "Im\u00e1genes", icono: "bi-image" },
  { id: 4, nombre: "Resumen", icono: "bi-check-circle" }
];

const MENSAJES_VALIDACION = {
  1: "Selecciona un modelo existente o completa codigo, nombre y familia para crear uno nuevo.",
  2: "Agrega al menos una variante con categoria, material, color y SKU generado.",
  3: "Puedes continuar sin im\u00e1genes o agregar al menos una imagen."
};

export default function ProductoWizard({ onComplete, onCancel }) {
  const [pasoActual, setPasoActual] = useState(1);
  const [errorPaso, setErrorPaso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [productoData, setProductoData] = useState({
    modelo: {
      modo: "existente",
      id: null,
      codigo: "",
      nombre: "",
      descripcion: "",
      familiaId: "",
      activo: true
    },
    variantes: [],
    imagenes: {
      modelo: null,
      variantes: {}
    }
  });

  const actualizarDatos = (seccion, datos) => {
    setProductoData((prev) => {
      if (Array.isArray(datos)) {
        return { ...prev, [seccion]: datos };
      }

      return {
        ...prev,
        [seccion]: { ...prev[seccion], ...datos }
      };
    });
  };

  const validarPasoActual = () => {
    if (pasoActual === 1) {
      const { modo, id, codigo, nombre, familiaId } = productoData.modelo;

      if (modo === "existente") {
        return Boolean(id);
      }

      return Boolean(codigo?.trim() && nombre?.trim() && familiaId);
    }

    if (pasoActual === 2) {
      if (!Array.isArray(productoData.variantes) || productoData.variantes.length === 0) {
        return false;
      }

      return productoData.variantes.every((variante) =>
        Boolean(variante?.categoriaId) && Boolean(variante?.materialId) && Boolean(variante?.colorId) && Boolean(variante?.sku?.trim())
      );
    }

    return true;
  };

  const siguientePaso = async () => {
    if (guardando) return;

    if (!validarPasoActual()) {
      setErrorPaso(MENSAJES_VALIDACION[pasoActual] || "Revisa los datos antes de continuar.");
      return;
    }

    setErrorPaso("");

    if (pasoActual < PASOS.length) {
      setPasoActual((prev) => prev + 1);
      return;
    }

    const nuevoProducto = {
      ...productoData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      setGuardando(true);
      await onComplete(nuevoProducto);
    } catch (error) {
      setErrorPaso(error?.message || "No se pudo guardar en la base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  const pasoAnterior = () => {
    setErrorPaso("");
    if (pasoActual > 1) {
      setPasoActual((prev) => prev - 1);
    }
  };

  let pasoContenido = null;
  switch (pasoActual) {
    case 1:
      pasoContenido = <ModeloStep data={productoData} onUpdate={actualizarDatos} />;
      break;
    case 2:
      pasoContenido = <VariantesStep data={productoData} onUpdate={actualizarDatos} />;
      break;
    case 3:
      pasoContenido = <ImagenesStep data={productoData} onUpdate={actualizarDatos} />;
      break;
    case 4:
      pasoContenido = <ResumenStep data={productoData} />;
      break;
    default:
      pasoContenido = null;
  }

  return (
    <div className="container py-4">
      <div className="mb-5">
        <div className="d-flex justify-content-between">
          {PASOS.map((paso) => {
            const estado =
              paso.id < pasoActual ? "success" : paso.id === pasoActual ? "primary" : "light";
            const colorTexto = paso.id <= pasoActual ? "white" : "secondary";

            return (
              <div key={paso.id} className="text-center flex-grow-1">
                <div
                  className={`rounded-circle bg-${estado} text-${colorTexto} d-flex align-items-center justify-content-center mx-auto mb-2`}
                  style={{ width: "40px", height: "40px" }}
                >
                  <i className={`${paso.icono} fs-5`}></i>
                </div>
                <small className="fw-semibold">{paso.nombre}</small>
              </div>
            );
          })}
        </div>

        <div className="progress mt-3">
          <div
            className="progress-bar bg-primary"
            style={{ width: `${((pasoActual - 1) / (PASOS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          {pasoContenido}
        </div>
      </div>

      {errorPaso && (
        <div className="alert alert-danger mt-3 mb-0">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorPaso}
        </div>
      )}

      <div className="d-flex justify-content-between mt-4">
        <div>
          {pasoActual > 1 && (
            <button className="btn btn-light" onClick={pasoAnterior} disabled={guardando}>
              <i className="bi bi-arrow-left me-2"></i>
              Anterior
            </button>
          )}
        </div>

        <div>
          <button className="btn btn-secondary me-2" onClick={onCancel} disabled={guardando}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={siguientePaso} disabled={guardando}>
            {pasoActual === PASOS.length ? (guardando ? "Guardando..." : "Guardar Producto") : "Siguiente"}
            {!guardando && <i className="bi bi-arrow-right ms-2"></i>}
          </button>
        </div>
      </div>
    </div>
  );
}
