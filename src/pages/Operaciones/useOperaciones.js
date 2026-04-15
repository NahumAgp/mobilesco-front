import { useEffect, useState } from "react";
import {
  obtenerOperaciones,
  eliminarOperacion as eliminarService
} from "../../services/operaciones.js";

export function useOperaciones() {

  const [operaciones, setOperaciones] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerOperaciones...");
      const data = await obtenerOperaciones();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setOperaciones(data.content);
      } else if (Array.isArray(data)) {
        setOperaciones(data);
      } else {
        setOperaciones([]);
      }

    } catch (e) {
      console.error("❌ Error cargando operaciones:", e);
      setError("Error cargando operaciones: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarOperacion(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    operaciones,
    loadingLista,
    error,
    eliminarOperacion
  };
}