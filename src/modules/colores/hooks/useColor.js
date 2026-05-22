import { useEffect, useState } from "react";
import { colorGateway } from "../services/colorGateway.js";

export function useColor() {
  const [colores, setColores] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await colorGateway.obtenerColores();
      const lista = data?.content || data || [];
      setColores(Array.isArray(lista) ? lista : []);
    } catch {
      setError("Error cargando colores");
      setColores([]);
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarColor(id) {
    await colorGateway.eliminarColor(id);
    await cargar();
  }

  return {
    colores,
    loadingLista,
    error,
    eliminarColor,
    recargar: cargar
  };
}

