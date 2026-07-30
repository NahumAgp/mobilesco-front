import { useCallback, useEffect, useState } from "react";
import {
  obtenerCompras,
  eliminarCompra as eliminarService,
  recibirCompra as recibirService,
  cancelarCompra as cancelarService
} from "../services/compras.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false
};

function normalizarPageInfo(data, fallbackPage = 0, fallbackSize = 10) {
  if (!data?.content) {
    const total = Array.isArray(data) ? data.length : 0;
    return {
      ...PAGE_INFO_DEFAULT,
      page: fallbackPage,
      size: total || fallbackSize,
      totalElements: total,
      totalPages: total > 0 ? 1 : 0
    };
  }

  return {
    page: Number(data.number ?? data.page ?? fallbackPage),
    size: Number(data.size ?? fallbackSize),
    totalElements: Number(data.totalElements ?? data.content.length ?? 0),
    totalPages: Number(data.totalPages ?? 0),
    first: Boolean(data.first),
    last: Boolean(data.last),
    hasNext: !data.last,
    hasPrevious: !data.first
  };
}

export function useCompras(params = {}) {
  const { busqueda, estado, fechaFin, fechaInicio, page, proveedor, size } = params;
  const [compras, setCompras] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const filtros = { busqueda, estado, fechaFin, fechaInicio, page, proveedor, size };
      const data = await obtenerCompras(filtros);
      setCompras(data?.content || (Array.isArray(data) ? data : []));
      setPageInfo(normalizarPageInfo(data, page ?? 0, size ?? 10));
    } catch (error) {
      console.error("Error cargando compras:", error);
      setError("Error cargando compras: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }, [busqueda, estado, fechaFin, fechaInicio, page, proveedor, size]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminarCompra(id) {
    await eliminarService(id);
    await cargar();
  }

  async function recibirCompra(id) {
    const response = await recibirService(id);
    await cargar();
    return response;
  }

  async function cancelarCompra(id, motivo) {
    const response = await cancelarService(id, motivo);
    await cargar();
    return response;
  }

  return {
    compras,
    pageInfo,
    loadingLista,
    error,
    eliminarCompra,
    recibirCompra,
    cancelarCompra
  };
}
