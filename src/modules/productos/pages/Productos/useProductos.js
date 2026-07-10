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
  const [productos, setProductos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerProductos(params);

      if (Array.isArray(data?.content)) {
        setProductos(data.content);
        setPageInfo({
          page: data.page ?? params.page ?? 0,
          size: data.size ?? params.size ?? 10,
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
  }, [params.activo, params.busqueda, params.direction, params.modeloId, params.page, params.size, params.sortBy]);

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
