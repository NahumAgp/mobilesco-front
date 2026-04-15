import { useEffect, useState } from "react";
import {
  obtenerInsumos,
  eliminarInsumo as eliminarService,
  ajustarStock as ajustarStockService
} from "../../services/insumos.js";

export function useInsumos() {

  const [insumos, setInsumos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      console.log("🔍 Iniciando llamada a obtenerInsumos...");
      const data = await obtenerInsumos();
      console.log("✅ Datos recibidos:", data);

      if (data.content) {
        setInsumos(data.content);
      } else if (Array.isArray(data)) {
        setInsumos(data);
      } else {
        setInsumos([]);
      }

    } catch (e) {
      console.error("❌ Error cargando insumos:", e);
      setError("Error cargando insumos: " + (e.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarInsumo(id) {
    await eliminarService(id);
    await cargar();
  }

  async function ajustarStock(id, cantidad, tipo, motivo) {
    await ajustarStockService(id, cantidad, tipo, motivo);
    await cargar(); // Recargar para ver el stock actualizado
  }

  return {
    insumos,
    loadingLista,
    error,
    eliminarInsumo,
    ajustarStock
  };
}