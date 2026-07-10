import { useEffect, useState } from "react";
import { colorGateway } from "../services/colorGateway.js";

const PAGE_INFO_DEFAULT = {
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0
};

export function useColor(params = {}) {
  const [colores, setColores] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar(overrides = {}) {
    try {
      setLoadingLista(true);
      setError("");

      const filtros = { ...params, ...overrides };
      const data = await colorGateway.obtenerColores(filtros);
      const lista = data?.content || data || [];
      setColores(Array.isArray(lista) ? lista : []);
      setPageInfo(data?.content ? {
        page: data.page ?? filtros.page ?? 0,
        size: data.size ?? filtros.size ?? 10,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      } : PAGE_INFO_DEFAULT);
    } catch {
      setError("Error cargando colores");
      setColores([]);
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [params.page, params.size, params.busqueda, params.activo]);

  async function eliminarColor(id) {
    await colorGateway.eliminarColor(id);
    await cargar();
  }

  return {
    colores,
    pageInfo,
    loadingLista,
    error,
    eliminarColor,
    recargar: cargar
  };
}

