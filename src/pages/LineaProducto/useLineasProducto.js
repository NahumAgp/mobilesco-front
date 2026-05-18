// src/pages/LineaProducto/useLineasProducto.js
import { useCallback, useEffect, useState } from "react";
import { lineaProductoGateway } from "../../gateways/lineaProductoGateway.js";

const PAGE_INFO_DEFAULT = {
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true
};

function normalizarPageInfo(data, fallbackPage = 0) {
  const totalPages = Number(data?.totalPages ?? 0);
  const number = Number(data?.page ?? data?.number ?? fallbackPage ?? 0);
  const size = Number(data?.size ?? 10);

  return {
    totalElements: Number(data?.totalElements ?? 0),
    totalPages,
    number,
    size,
    first: number <= 0,
    last: totalPages <= 0 ? true : number >= totalPages - 1
  };
}

export function useLineasProducto({ page, sortBy = "nombre", direction = "asc" } = {}) {
  const [lineasProducto, setLineasProducto] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data =
          page === undefined || page === null
          ? await lineaProductoGateway.obtenerLineasProducto()
          : await lineaProductoGateway.obtenerLineasProducto({ page, sortBy, direction });

      if (data?.content) {
        setLineasProducto(data.content);
        setPageInfo(normalizarPageInfo(data, page ?? data.page ?? data.number ?? 0));
      } else {
        const lista = Array.isArray(data) ? data : [];
        setLineasProducto(lista);
        setPageInfo({
          totalElements: lista.length,
          totalPages: lista.length > 0 ? 1 : 0,
          number: 0,
          size: lista.length || 10,
          first: true,
          last: true
        });
      }
    } catch {
      setLineasProducto([]);
      setPageInfo(PAGE_INFO_DEFAULT);
      setError("Error cargando líneas de producto");
    } finally {
      setLoadingLista(false);
    }
  }, [page, sortBy, direction]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstadoLineaProducto(id, activo) {
    if (activo) {
      await lineaProductoGateway.activarLineaProducto(id);
    } else {
      await lineaProductoGateway.desactivarLineaProducto(id);
    }

    await cargar();
  }

  return {
    lineasProducto,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoLineaProducto
  };
}
