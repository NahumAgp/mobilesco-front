import { useCallback, useEffect, useState } from "react";
import { materialGateway } from "../../gateways/materialGateway.js";

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

export function useMateriales({ page, size = 10, sortBy = "nombre", direction = "asc" } = {}) {
  const [materiales, setMateriales] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data =
        page === undefined || page === null
          ? await materialGateway.obtenerMateriales()
          : await materialGateway.obtenerMateriales({ page, size, sortBy, direction });

      if (data?.content) {
        setMateriales(data.content);
        setPageInfo(normalizarPageInfo(data, page ?? data.page ?? data.number ?? 0));
      } else {
        const lista = Array.isArray(data) ? data : [];
        setMateriales(lista);
        setPageInfo({
          totalElements: lista.length,
          totalPages: lista.length > 0 ? 1 : 0,
          number: 0,
          size: lista.length || size,
          first: true,
          last: true
        });
      }
    } catch (loadError) {
      setMateriales([]);
      setPageInfo(PAGE_INFO_DEFAULT);
      setError("Error cargando materiales: " + (loadError?.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }, [direction, page, size, sortBy]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstadoMaterial(id, activo) {
    if (activo) {
      await materialGateway.activarMaterial(id);
    } else {
      await materialGateway.desactivarMaterial(id);
    }

    await cargar();
  }

  async function eliminarMaterial(id) {
    await materialGateway.eliminarMaterial(id);
    await cargar();
  }

  return {
    materiales,
    pageInfo,
    loadingLista,
    error,
    cambiarEstadoMaterial,
    eliminarMaterial,
    recargarMateriales: cargar
  };
}
