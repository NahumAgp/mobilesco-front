import { useEffect, useState } from "react";
import {
  obtenerTiposProducto,
  eliminarTipoProducto as eliminarService
} from "../../services/tiposProducto.js";

export function useTiposProducto() {

  const [tiposProducto, setTiposProducto] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerTiposProducto...");
      const data = await obtenerTiposProducto();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setTiposProducto(data.content);
      } else if (Array.isArray(data)) {
        setTiposProducto(data);
      } else {
        setTiposProducto([]);
      }

    } catch (e) {
      console.error("❌ Error cargando tipos de producto:", e);
      setError("Error cargando tipos de producto: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarTipoProducto(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    tiposProducto,
    loadingLista,
    error,
    eliminarTipoProducto
  };
}