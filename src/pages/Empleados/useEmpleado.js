import { useState, useEffect } from "react";
import { obtenerEmpleados, eliminarEmpleado } from "../../services/empleados";

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

  return {

    empleados,
    loadingLista,
    error,
    eliminarEmpleado: eliminarEmpleadoHook,
    recargarEmpleados: cargarEmpleados

  };

}