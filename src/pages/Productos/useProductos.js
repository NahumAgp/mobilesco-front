import { useEffect, useState } from "react";
import {
  obtenerProductos,
  eliminarProducto as eliminarService
} from "../../services/productos.js";

export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerProductos...");
      const data = await obtenerProductos();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setProductos(data.content);
      } else if (Array.isArray(data)) {
        setProductos(data);
      } else {
        setProductos([]);
      }

    } catch (e) {
      console.error("❌ Error cargando productos:", e);
      setError("Error cargando productos: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarProducto(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    productos,
    loadingLista,
    error,
    eliminarProducto
  };
}