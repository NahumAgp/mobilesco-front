import { useCallback, useEffect, useState } from "react";
import {
  activarEmpleado,
  desactivarEmpleado,
  eliminarEmpleado,
  obtenerEmpleados
} from "../services/empleados";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
};

export function useEmpleado(params = {}) {
  const { page, size, busqueda, activo } = params;

  const [empleados, setEmpleados] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(true);
  const [error, setError] = useState(null);

  const cargarEmpleados = useCallback(async (overrides = {}) => {

    try {

      setLoadingLista(true);
      setError(null);

      const filtros = { page, size, busqueda, activo, ...overrides };
      const data = await obtenerEmpleados(filtros);

      const lista = data?.content || data || [];
      setEmpleados(Array.isArray(lista) ? lista : []);
      setPageInfo(data?.content ? {
        page: data.page ?? filtros.page ?? 0,
        size: data.size ?? filtros.size ?? 10,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);

    } catch (err) {

      setError("Error al cargar empleados");
      setPageInfo(PAGE_INFO_DEFAULT);
      console.error(err);

    } finally {

      setLoadingLista(false);

    }

  }, [activo, busqueda, page, size]);

  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

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
    pageInfo,
    loadingLista,
    error,
    eliminarEmpleado: eliminarEmpleadoHook,
    cambiarEstadoEmpleado,
    recargarEmpleados: cargarEmpleados

  };

}
