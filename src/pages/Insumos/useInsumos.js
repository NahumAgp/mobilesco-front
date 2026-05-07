import { useCallback, useEffect, useState } from "react";
import {
  obtenerInsumos,
  eliminarInsumo as eliminarService,
  ajustarStock as ajustarStockService
} from "../../services/insumos.js";

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

export function useInsumos({ page, size = 10, sortBy = "nombre", direction = "asc" } = {}) {
  const [insumos, setInsumos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data =
        page === undefined || page === null
          ? await obtenerInsumos()
          : await obtenerInsumos({ page, size, sortBy, direction });

      if (data?.content) {
        setInsumos(data.content);
        setPageInfo(normalizarPageInfo(data, page ?? data.page ?? data.number ?? 0, size));
      } else {
        const lista = Array.isArray(data) ? data : [];
        setInsumos(lista);
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
      setInsumos([]);
      setPageInfo(PAGE_INFO_DEFAULT);
      setError("Error cargando insumos: " + (err.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }, [direction, page, size, sortBy]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminarInsumo(id) {
    await eliminarService(id);
    await cargar();
  }

  async function ajustarStock(id, cantidad, tipo, motivo) {
    await ajustarStockService(id, cantidad, tipo, motivo);
    await cargar();
  }

  return {
    insumos,
    pageInfo,
    loadingLista,
    error,
    eliminarInsumo,
    ajustarStock
  };
}
