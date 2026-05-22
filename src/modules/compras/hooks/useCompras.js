import { useEffect, useState } from "react";
import {
  obtenerCompras,
  eliminarCompra as eliminarService,
  recibirCompra as recibirService,
  cancelarCompra as cancelarService
} from "../services/compras.js";

export function useCompras() {

  const [compras, setCompras] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerCompras...");
      const data = await obtenerCompras();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setCompras(data.content);
      } else if (Array.isArray(data)) {
        setCompras(data);
      } else {
        setCompras([]);
      }

    } catch (error) {
      console.error("❌ Error cargando compras:", error);
      setError("Error cargando compras: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarCompra(id) {
    await eliminarService(id);
    await cargar();
  }

  async function recibirCompra(id) {
    const response = await recibirService(id);
    await cargar();
    return response;
  }

  async function cancelarCompra(id, motivo) {
    const response = await cancelarService(id, motivo);
    await cargar();
    return response;
  }

  return {
    compras,
    loadingLista,
    error,
    eliminarCompra,
    recibirCompra,
    cancelarCompra
  };
}
