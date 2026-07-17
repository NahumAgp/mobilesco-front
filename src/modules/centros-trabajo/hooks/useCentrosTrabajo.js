import { useEffect, useState } from "react";
import {
  obtenerCentrosTrabajo,
  eliminarCentroTrabajo as eliminarService
} from "../services/centrosTrabajo.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false
};

function normalizarPageInfo(data, fallbackPage = 0, fallbackSize = 12) {
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

export function useCentrosTrabajo(params = {}) {
  const [centrosTrabajo, setCentrosTrabajo] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerCentrosTrabajo(params);
      setCentrosTrabajo(data?.content || (Array.isArray(data) ? data : []));
      setPageInfo(normalizarPageInfo(data, params.page ?? 0, params.size ?? 12));
    } catch (error) {
      console.error("Error cargando centros de trabajo:", error);
      setError("Error cargando centros de trabajo: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [params.busqueda, params.estatus, params.page, params.size, params.soloActivos]);

  async function eliminarCentroTrabajo(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    centrosTrabajo,
    pageInfo,
    loadingLista,
    error,
    eliminarCentroTrabajo
  };
}
