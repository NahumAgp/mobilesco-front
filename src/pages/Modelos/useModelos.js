import { useEffect, useState } from "react";
import {
  obtenerModelos,
  eliminarModelo as eliminarService
} from "../../services/modelos.js";

export function useModelos() {

  const [modelos, setModelos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerModelos...");
      const data = await obtenerModelos();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setModelos(data.content);
      } else if (Array.isArray(data)) {
        setModelos(data);
      } else {
        setModelos([]);
      }

    } catch (e) {
      console.error("❌ Error cargando modelos:", e);
      setError("Error cargando modelos: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarModelo(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    modelos,
    loadingLista,
    error,
    eliminarModelo
  };
}
