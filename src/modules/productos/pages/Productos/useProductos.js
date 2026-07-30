import { useCallback, useEffect, useState } from "react";
import {
  obtenerProductos,
  desactivarProducto as desactivarService,
  eliminarProductoDefinitivo as eliminarDefinitivoService
} from "../../services/productos.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
};

export function useProductos(params = {}) {
  const { activo, busqueda, direction, modeloId, page, size, sortBy } = params;
  const [productos, setProductos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const filtros = { activo, busqueda, direction, modeloId, page, size, sortBy };
      const data = await obtenerProductos(filtros);

      if (Array.isArray(data?.content)) {
        setProductos(data.content);
        setPageInfo({
          page: data.page ?? page ?? 0,
          size: data.size ?? size ?? 10,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0
        });
      } else if (Array.isArray(data)) {
        setProductos(data);
        setPageInfo({
          page: 0,
          size: data.length,
          totalElements: data.length,
          totalPages: data.length > 0 ? 1 : 0
        });
      } else {
        setProductos([]);
        setPageInfo(PAGE_INFO_DEFAULT);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      setError("Error cargando productos: " + (error.message || "Error desconocido"));
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  }, [activo, busqueda, direction, modeloId, page, size, sortBy]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function desactivarProducto(id) {
    await desactivarService(id);
    await cargar();
  }

  async function eliminarProductoDefinitivo(id) {
    await eliminarDefinitivoService(id);
    await cargar();
  }

  return {
    productos,
    pageInfo,
    loadingLista,
    error,
    recargar: cargar,
    desactivarProducto,
    eliminarProductoDefinitivo
  };
}
