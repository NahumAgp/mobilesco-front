import { useEffect, useState } from "react";
import {
  activarSubfamilia,
  desactivarSubfamilia,
  obtenerSubfamilias
} from "../services/subfamilias.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

const normalizarPageInfo = (data, fallbackPage = 0) => {
  if (!data?.content) {
    const total = Array.isArray(data) ? data.length : 0;
    return {
      ...PAGE_INFO_DEFAULT,
      page: fallbackPage,
      totalElements: total,
      totalPages: total > 0 ? 1 : 0
    };
  }

  return {
    page: Number(data.number ?? data.page ?? fallbackPage),
    size: Number(data.size ?? 10),
    totalElements: Number(data.totalElements ?? data.content.length ?? 0),
    totalPages: Number(data.totalPages ?? 0),
    first: Boolean(data.first),
    last: Boolean(data.last)
  };
};

export function useSubfamilias(params = {}) {
  const [subfamilias, setSubfamilias] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoadingLista(true);
      setError("");
      const data = await obtenerSubfamilias(params);
      setSubfamilias(data?.content || (Array.isArray(data) ? data : []));
      setPageInfo(normalizarPageInfo(data, params.page ?? 0));
    } catch (err) {
      setError(err.message || "No se pudieron cargar las subfamilias");
      setSubfamilias([]);
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [params.activo, params.busqueda, params.direction, params.familiaId, params.page, params.sortBy]);

  const cambiarEstadoSubfamilia = async (id, activo) => {
    if (activo) {
      await activarSubfamilia(id);
    } else {
      await desactivarSubfamilia(id);
    }
    await cargar();
  };

  return {
    subfamilias,
    pageInfo,
    loadingLista,
    error,
    recargar: cargar,
    cambiarEstadoSubfamilia
  };
}
