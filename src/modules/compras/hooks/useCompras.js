import { useEffect, useState } from "react";
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
  const [compras, setCompras] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerCompras(params);
      setCompras(data?.content || (Array.isArray(data) ? data : []));
      setPageInfo(normalizarPageInfo(data, params.page ?? 0, params.size ?? 10));
    } catch (error) {
      console.error("Error cargando compras:", error);
      setError("Error cargando compras: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [params.busqueda, params.estado, params.fechaFin, params.fechaInicio, params.page, params.proveedor, params.size]);

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
