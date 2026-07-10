import { useCallback, useEffect, useState } from "react";
import { obtenerUnidadesMedida } from "../services/unidadMedidas";
import { eliminarUnidadMedida } from "../services/unidadMedidas";

const PAGE_INFO_DEFAULT = {
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true
};

function normalizarPageInfo(data, fallbackPage = 0, fallbackSize = 10) {
  const totalPages = Number(data?.totalPages ?? 0);
  const number = Number(data?.page ?? data?.number ?? fallbackPage ?? 0);
  const size = Number(data?.size ?? fallbackSize);

  return {
    totalElements: Number(data?.totalElements ?? 0),
    totalPages,
    number,
    size,
    first: number <= 0,
    last: totalPages <= 0 ? true : number >= totalPages - 1
  };
}

export function useUnidadesMedida({
  page,
  size = 10,
  sortBy = "nombre",
  direction = "asc",
  busqueda = "",
  estado = null
} = {}) {
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(true);
  const [error, setError] = useState(null);

  const cargarUnidades = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError(null);

      const data =
        page === undefined || page === null
          ? await obtenerUnidadesMedida()
          : await obtenerUnidadesMedida({ page, size, sortBy, direction, busqueda, estado });

      if (data?.content) {
        setUnidadesMedida(data.content);
        setPageInfo(normalizarPageInfo(data, page ?? data.page ?? data.number ?? 0, size));
      } else {
        const lista = Array.isArray(data) ? data : [];
        setUnidadesMedida(lista);
        setPageInfo({
          totalElements: lista.length,
          totalPages: lista.length > 0 ? 1 : 0,
          number: 0,
          size: lista.length || size,
          first: true,
          last: true
        });
      }
    } catch (err) {
      setError("Error al cargar las unidades de medida");
      setUnidadesMedida([]);
      setPageInfo(PAGE_INFO_DEFAULT);
      console.error(err);
    } finally {
      setLoadingLista(false);
    }
  }, [direction, page, size, sortBy, busqueda, estado]);

  useEffect(() => {
    cargarUnidades();
  }, [cargarUnidades]);

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
    pageInfo,
    loadingLista,
    error,
    eliminarUnidadMedida: eliminarUnidadMedidaHook,
    recargarUnidades: cargarUnidades
  };
}
