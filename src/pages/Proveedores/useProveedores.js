import { useEffect, useState } from "react";
import {
  obtenerProveedores,
  eliminarProveedor as eliminarService
} from "../../services/proveedores.js";

export function useProveedores({
  activo,
  busqueda,
  tipoInsumo,
  page = 0,
  size = 10,
  sortBy = "id",
  direction = "asc"
} = {}) {
  const [proveedores, setProveedores] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 10,
    totalPages: null,
    totalElements: null,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
    hasNext: false,
    hasPrevious: false
  });
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerProveedores({
        activo,
        busqueda,
        tipoInsumo,
        page,
        size,
        sortBy,
        direction
      });

      if (Array.isArray(data)) {
        setProveedores(data);
        setPageInfo({
          page,
          size,
          totalPages: 0,
          totalElements: 0,
          numberOfElements: data.length,
          first: page === 0,
          last: data.length < size,
          empty: data.length === 0,
          hasNext: data.length === size,
          hasPrevious: page > 0
        });
        return;
      }

      if (data?.content) {
        setProveedores(data.content);
        setPageInfo({
          page: data.number ?? page,
          size: data.size ?? size,
          totalPages: data.totalPages ?? 0,
          totalElements: data.totalElements ?? data.content.length,
          numberOfElements: data.numberOfElements ?? data.content.length,
          first: Boolean(data.first),
          last: Boolean(data.last),
          empty: Boolean(data.empty),
          hasNext: !Boolean(data.last),
          hasPrevious: !Boolean(data.first)
        });
        return;
      }

      setProveedores([]);
      setPageInfo({
        page,
        size,
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        first: page === 0,
        last: true,
        empty: true,
        hasNext: false,
        hasPrevious: page > 0
      });
    } catch (e) {
      setError("Error cargando proveedores");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [activo, busqueda, tipoInsumo, page, size, sortBy, direction]);

  async function eliminarProveedor(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    proveedores,
    pageInfo,
    loadingLista,
    error,
    eliminarProveedor
  };
}
