import { useCallback, useEffect, useState } from "react";
import {
  obtenerOperaciones,
  eliminarOperacion as eliminarService
} from "../services/operaciones.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
};

export function useOperaciones(params = {}) {
  const { page, size, busqueda, activo, centroTrabajo } = params;
  const [operaciones, setOperaciones] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (overrides = {}) => {
    try {
      setLoadingLista(true);
      setError("");

      const filtros = { page, size, busqueda, activo, centroTrabajo, ...overrides };
      const data = await obtenerOperaciones(filtros);

      if (data?.content) {
        setOperaciones(data.content);
        setPageInfo({
          page: data.page ?? filtros.page ?? 0,
          size: data.size ?? filtros.size ?? 10,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0
        });
      } else if (Array.isArray(data)) {
        setOperaciones(data);
        setPageInfo(PAGE_INFO_DEFAULT);
      } else {
        setOperaciones([]);
        setPageInfo(PAGE_INFO_DEFAULT);
      }
    } catch (error) {
      setError("Error cargando operaciones: " + (error.message || "Error desconocido"));
      setOperaciones([]);
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  }, [activo, busqueda, centroTrabajo, page, size]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminarOperacion(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    operaciones,
    pageInfo,
    loadingLista,
    error,
    eliminarOperacion,
    recargar: cargar
  };
}
