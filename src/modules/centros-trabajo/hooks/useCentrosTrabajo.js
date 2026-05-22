import { useEffect, useState } from "react";
import {
  obtenerCentrosTrabajo,
  eliminarCentroTrabajo as eliminarService
} from "../services/centrosTrabajo.js";

export function useCentrosTrabajo() {

  const [centrosTrabajo, setCentrosTrabajo] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerCentrosTrabajo...");
      const data = await obtenerCentrosTrabajo();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setCentrosTrabajo(data.content);
      } else if (Array.isArray(data)) {
        setCentrosTrabajo(data);
      } else {
        setCentrosTrabajo([]);
      }

    } catch (error) {
      console.error("❌ Error cargando centros de trabajo:", error);
      setError("Error cargando centros de trabajo: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarCentroTrabajo(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    centrosTrabajo,
    loadingLista,
    error,
    eliminarCentroTrabajo
  };
}
