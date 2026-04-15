// src/pages/LineaProducto/useLineasProducto.js
import { useEffect, useState } from "react";
import {
  obtenerLineasProducto,
  eliminarLineaProducto as eliminarService
} from "../../services/lineaProducto.js";

export function useLineasProducto() {

  const [lineasProducto, setLineasProducto] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerLineasProducto();

      // 🔥 IMPORTANTE
      // Si backend devuelve paginado
      if (data.content) {
        setLineasProducto(data.content);
      } else {
        setLineasProducto(data);
      }

    } catch (e) {
      setError("Error cargando líneas de producto");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarLineaProducto(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    lineasProducto,
    loadingLista,
    error,
    eliminarLineaProducto
  };
}