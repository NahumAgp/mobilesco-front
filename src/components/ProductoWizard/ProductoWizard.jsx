// components/ProductoWizard/ProductoWizard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModeloForm from "./steps/ModeloFormStep";
import VariantesForm from "./steps/VariantesFormStep";
import ImagenesForm from "./steps/ImagenesFormStep";
import Resumen from "./steps/Resumen";

const PASOS = [
  { id: 1, nombre: "Datos Básicos", icono: "bi-info-circle", componente: ModeloForm },
  { id: 2, nombre: "Variantes", icono: "bi-palette", componente: VariantesForm },
  { id: 3, nombre: "Imágenes", icono: "bi-images", componente: ImagenesForm },
  { id: 4, nombre: "Resumen", icono: "bi-check-circle", componente: Resumen }
];

export default function ProductoWizard({ productoId, onComplete }) {
  const [pasoActual, setPasoActual] = useState(1);
  const [productoData, setProductoData] = useState({
    modelo: {
      codigo: "",
      nombre: "",
      descripcion: "",
      familiaId: "",
      activo: true
    },
    variantes: [],
    imagenes: []
  });
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const PasoComponent = PASOS.find(p => p.id === pasoActual)?.componente;

  const actualizarDatos = (seccion, datos) => {
    setProductoData(prev => ({
      ...prev,
      [seccion]: { ...prev[seccion], ...datos }
    }));
  };

  const siguientePaso = () => {
    if (pasoActual < PASOS.length) {
      setPasoActual(pasoActual + 1);
      window.scrollTo(0, 0);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      window.scrollTo(0, 0);
    }
  };

  const guardarProductoCompleto = async () => {
    setLoading(true);
    try {
      // 1. Crear/Actualizar modelo
      let modeloId = productoData.modelo.id;
      if (!modeloId) {
        const nuevoModelo = await crearModeloAPI(productoData.modelo);
        modeloId = nuevoModelo.id;
        actualizarDatos("modelo", { id: modeloId });
      } else {
        await actualizarModeloAPI(modeloId, productoData.modelo);
      }

      // 2. Guardar variantes (asociadas al modelo)
      for (const variante of productoData.variantes) {
        if (variante.id) {
          await actualizarVarianteAPI(variante.id, { ...variante, modeloId });
        } else {
          await crearVarianteAPI({ ...variante, modeloId });
        }
      }

      // 3. Guardar imágenes
      for (const imagen of productoData.imagenes) {
        if (!imagen.id && imagen.file) {
          await subirImagenAPI(imagen.file, modeloId, imagen.principal);
        }
      }

      setToastMessage("Producto guardado exitosamente");
      setTimeout(() => {
        if (onComplete) onComplete(productoData);
        else navigate("/productos");
      }, 1500);
    } catch (error) {
      setToastMessage(error.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Progress Steps */}
      <div className="mb-5">
        <div className="d-flex justify-content-between">
          {PASOS.map(paso => (
            <div
              key={paso.id}
              className={`text-center flex-grow-1 ${
                paso.id === pasoActual ? "text-primary" : "text-muted"
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => paso.id < pasoActual && setPasoActual(paso.id)}
            >
              <div
                className={`rounded-circle bg-${
                  paso.id === pasoActual ? "primary" : "light"
                } text-white d-flex align-items-center justify-content-center mx-auto mb-2`}
                style={{ width: "40px", height: "40px" }}
              >
                <i className={`${paso.icono} fs-5`}></i>
              </div>
              <small className="fw-semibold">{paso.nombre}</small>
            </div>
          ))}
        </div>
        <div className="progress mt-3">
          <div
            className="progress-bar bg-primary"
            style={{ width: `${((pasoActual - 1) / (PASOS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <PasoComponent
            data={productoData}
            onUpdate={actualizarDatos}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between mt-4">
        <button
          className="btn btn-light"
          onClick={pasoAnterior}
          disabled={pasoActual === 1}
        >
          <i className="bi bi-arrow-left me-2"></i>Anterior
        </button>
        
        {pasoActual === PASOS.length ? (
          <button
            className="btn btn-success px-5"
            onClick={guardarProductoCompleto}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : (
              <i className="bi bi-check-circle me-2"></i>
            )}
            Guardar Producto
          </button>
        ) : (
          <button className="btn btn-primary px-5" onClick={siguientePaso}>
            Siguiente<i className="bi bi-arrow-right ms-2"></i>
          </button>
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
          <div className="toast show bg-success text-white">
            <div className="toast-body">{toastMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}