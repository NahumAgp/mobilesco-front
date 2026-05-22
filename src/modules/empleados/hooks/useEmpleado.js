import { useState, useEffect } from "react";
import {
  activarEmpleado,
  desactivarEmpleado,
  eliminarEmpleado,
  obtenerEmpleados
} from "../services/empleados";

export function useEmpleado() {

  const [empleados, setEmpleados] = useState([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {

    try {

      setLoadingLista(true);
      setError(null);

      const data = await obtenerEmpleados();

      setEmpleados(data || []);

    } catch (err) {

      setError("Error al cargar empleados");
      console.error(err);

    } finally {

      setLoadingLista(false);

    }

  };

  const eliminarEmpleadoHook = async (id) => {

    try {

      await eliminarEmpleado(id);
      await cargarEmpleados();

    } catch (err) {

      console.error("Error al eliminar empleado:", err);
      throw err;

    }

  };

  const cambiarEstadoEmpleado = async (id, activo) => {
    try {
      if (activo) {
        await activarEmpleado(id);
      } else {
        await desactivarEmpleado(id);
      }

      await cargarEmpleados();
    } catch (err) {
      console.error("Error al cambiar estado del empleado:", err);
      throw err;
    }
  };

  return {

    empleados,
    loadingLista,
    error,
    eliminarEmpleado: eliminarEmpleadoHook,
    cambiarEstadoEmpleado,
    recargarEmpleados: cargarEmpleados

  };

}
