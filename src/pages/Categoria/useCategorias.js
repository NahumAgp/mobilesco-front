// src/pages/Categoria/useCategorias.js
import { useEffect, useState } from "react";
import {
  obtenerCategorias,
  eliminarCategoria as eliminarService
} from "../../services/categorias.js";
export function useCategorias() {

  const [categorias, setCategorias] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {

      console.log("🔍 Iniciando llamada a obtenerCategorias...");
      const data1 = await obtenerCategorias();
      console.log("✅ Datos recibidos del backend:", data1);

      setLoadingLista(true);
      setError("");

      const data = await obtenerCategorias();
      

      // 🔥 IMPORTANTE
      // Si backend devuelve paginado
      if (data.content) {
        setCategorias(data.content);
      } else {
        setCategorias(data);
      }

    } catch (e) {
      setError("Error cargando categorías");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarCategoria(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    categorias,
    loadingLista,
    error,
    eliminarCategoria
  };
}