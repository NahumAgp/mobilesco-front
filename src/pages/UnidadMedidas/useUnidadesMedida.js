import { useState, useEffect } from "react";
import { obtenerUnidadesMedida } from "../../services/unidadMedidas";
import { eliminarUnidadMedida } from "../../services/unidadMedidas";

export function useUnidadesMedida() {
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUnidades();
  }, []);

  const cargarUnidades = async () => {
    try {
      setLoadingLista(true);
      setError(null);
      const data = await obtenerUnidadesMedida();
      setUnidadesMedida(data || []);
    } catch (err) {
      setError("Error al cargar las unidades de medida");
      console.error(err);
    } finally {
      setLoadingLista(false);
    }
  };

  const eliminarUnidadMedidaHook = async (id) => {
    try {
      await eliminarUnidadMedida(id);
      await cargarUnidades(); // Recargar la lista después de eliminar
    } catch (err) {
      console.error("Error al eliminar:", err);
      throw err;
    }
  };

  return {
    unidadesMedida,
    loadingLista,
    error,
    eliminarUnidadMedida: eliminarUnidadMedidaHook,
    recargarUnidades: cargarUnidades
  };
}