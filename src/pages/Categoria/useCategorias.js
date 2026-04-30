import { useEffect, useState } from "react";
import { obtenerCategorias, eliminarCategoria as eliminarService } from "../../services/categorias.js";

export function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerCategorias();
      const lista = data?.content || data || [];
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch {
      setError("Error cargando categorias");
      setCategorias([]);
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

