import { useCallback, useEffect, useState } from "react";
import { categoriaGateway } from "../services/categoriaGateway.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
};

export function useCategorias(params = {}) {
  const { page, size, busqueda, activo } = params;
  const [categorias, setCategorias] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (overrides = {}) => {
    try {
      setLoadingLista(true);
      setError("");

      const filtros = { page, size, busqueda, activo, ...overrides };
      const data = await categoriaGateway.obtenerCategorias(undefined, filtros);
      const lista = data?.content || data || [];
      setCategorias(Array.isArray(lista) ? lista : []);
      setPageInfo(data?.content ? {
        page: data.page ?? filtros.page ?? 0,
        size: data.size ?? filtros.size ?? 10,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
    } catch {
      setError("Error cargando categorias");
      setCategorias([]);
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  }, [activo, busqueda, page, size]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminarCategoria(id) {
    await categoriaGateway.eliminarCategoria(id);
    await cargar();
  }

  return {
    categorias,
    pageInfo,
    loadingLista,
    error,
    eliminarCategoria,
    recargar: cargar
  };
}

