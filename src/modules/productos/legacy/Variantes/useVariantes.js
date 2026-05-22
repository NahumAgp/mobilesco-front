// ============================================
// RUTA: src/pages/Variantes/useVariantes.js
// ============================================
import { useEffect, useState } from "react";
import {
  obtenerProductos,
  eliminarProducto as eliminarService
} from "../../services/variantes";

export function useVariantes() {
  const [productos, setProductos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");
      const data = await obtenerProductos();

      if (data.content) {
        setProductos(data.content);
      } else {
        setProductos(data);
      }
    } catch {
      setError("Error cargando productos");
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

