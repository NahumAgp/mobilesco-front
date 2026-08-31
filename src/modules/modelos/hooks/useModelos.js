import { useCallback, useEffect, useState } from "react";
import {
  obtenerModelos,
  activarModelo,
  desactivarModelo,
  eliminarModelo as eliminarService
} from "../services/modelos.js";

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

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  const visitados = new Set();
  const buscarLista = (valor, nivel = 0) => {
    if (Array.isArray(valor)) return valor;
    if (!valor || typeof valor !== "object" || nivel > 4 || visitados.has(valor)) return null;

    visitados.add(valor);

    const clavesPreferidas = [
      "content",
      "data",
      "items",
      "results",
      "productos",
      "variantes",
      "lista",
      "rows",
      "payload"
    ];

    for (const clave of clavesPreferidas) {
      const candidato = valor?.[clave];
      if (Array.isArray(candidato)) return candidato;
    }

    for (const nested of Object.values(valor)) {
      const encontrado = buscarLista(nested, nivel + 1);
      if (Array.isArray(encontrado)) return encontrado;
    }

    return null;
  };

  return buscarLista(respuesta) || [];
};

const getUrlImagenEnModelo = (modelo) =>
  modelo?.imagenUrl ||
  modelo?.urlImagen ||
  modelo?.url_imagen ||
  modelo?.imagenPrincipalUrl ||
  modelo?.fotoUrl ||
  modelo?.imagen?.url ||
  modelo?.imagenPrincipal?.url ||
  (Array.isArray(modelo?.imagenes) ? modelo.imagenes.find((img) => img?.url)?.url || "" : "") ||
  "";

async function resolverImagenPrincipalModelo(modelo) {
  return getUrlImagenEnModelo(modelo);
}

export function useModelos({
  page,
  size = 10,
  sortBy = "nombre",
  direction = "asc",
  busqueda = "",
  activo = null,
  familiaId = "",
  lineaId = ""
} = {}) {
  const [modelos, setModelos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data =
        page === undefined || page === null
          ? await obtenerModelos()
          : await obtenerModelos({ page, size, sortBy, direction, busqueda, activo, familiaId, lineaId });

      if (data?.content) {
        setModelos(data.content);
        setPageInfo(normalizarPageInfo(data, page ?? data.page ?? data.number ?? 0));
      } else {
        const lista = getLista(data);
        setModelos(lista);
        setPageInfo({
          totalElements: lista.length,
          totalPages: lista.length > 0 ? 1 : 0,
          number: 0,
          size: lista.length || size,
          first: true,
          last: true
        });
      }

      const listaModelos = getLista(data?.content ? data.content : data);
      const modelosEnriquecidos = await Promise.all(
        listaModelos.map(async (modelo) => ({
          ...modelo,
          imagenPrincipalUrl: await resolverImagenPrincipalModelo(modelo)
        }))
      );

      setModelos(modelosEnriquecidos);
    } catch (error) {
      setError("Error cargando modelos: " + (error.message || "Error desconocido"));
      setModelos([]);
      setPageInfo(PAGE_INFO_DEFAULT);
    } finally {
      setLoadingLista(false);
    }
  }, [direction, page, size, sortBy, busqueda, activo, familiaId, lineaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminarModelo(id) {
    await eliminarService(id);
    await cargar();
  }

  async function cambiarEstadoModelo(id, activo) {
    if (activo) {
      await activarModelo(id);
    } else {
      await desactivarModelo(id);
    }

    await cargar();
  }

  return {
    modelos,
    pageInfo,
    loadingLista,
    error,
    eliminarModelo,
    cambiarEstadoModelo,
    recargarModelos: cargar
  };
}
