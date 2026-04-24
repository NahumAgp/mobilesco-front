// ============================================
// RUTA: src/pages/Variantes/useVariantes.js
// ============================================
import { useEffect, useState } from "react";
import {
  obtenerVariantes,
  eliminarVariante as eliminarService
} from "../../services/variantes";

export function useVariantes() {

  const [variantes, setVariantes] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");
      const data = await obtenerVariantes();

      if (data.content) {
        setVariantes(data.content);
      } else {
        setVariantes(data);
      }
    } catch (e) {
      setError("Error cargando variantes");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarVariante(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    variantes,
    loadingLista,
    error,
    eliminarVariante
  };
}