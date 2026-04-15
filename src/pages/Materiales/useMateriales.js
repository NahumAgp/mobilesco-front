import { useEffect, useState } from "react";
import {
  obtenerMateriales,
  eliminarMaterial as eliminarService
} from "../../services/materiales.js";

export function useMateriales() {

  const [materiales, setMateriales] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerMateriales...");
      const data = await obtenerMateriales();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setMateriales(data.content);
      } else if (Array.isArray(data)) {
        setMateriales(data);
      } else {
        setMateriales([]);
      }

    } catch (e) {
      console.error("❌ Error cargando materiales:", e);
      setError("Error cargando materiales: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarMaterial(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    materiales,
    loadingLista,
    error,
    eliminarMaterial
  };
}