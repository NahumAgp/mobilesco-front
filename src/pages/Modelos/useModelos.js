import { useEffect, useState } from "react";
import {
  obtenerModelos,
  activarModelo,
  desactivarModelo,
  eliminarModelo as eliminarService
} from "../../services/modelos.js";
import { obtenerProductos, obtenerVariantesPorProductoBase } from "../../services/variantes.js";
import {
  obtenerImagenPrincipalPorProducto,
  obtenerImagenPrincipalPorVariante
} from "../../services/imagenes.js";

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

const getModeloId = (modelo) =>
  modelo?.id ||
  modelo?.modeloId ||
  modelo?.id_modelo ||
  modelo?.modelo_id ||
  modelo?.producto_base_id ||
  modelo?.id_producto_base ||
  modelo?.productoBaseId ||
  null;

const getVarianteId = (variante) =>
  variante?.id || variante?.varianteId || variante?.id_variante || null;

const getModeloRelacionadoId = (item) =>
  item?.id_modelo ||
  item?.modeloId ||
  item?.modelo_id ||
  item?.producto_base_id ||
  item?.productoBaseId ||
  item?.id_producto_base ||
  item?.modelo?.id ||
  item?.modelo?.modeloId ||
  item?.productoBase?.id ||
  item?.producto_base?.id ||
  null;

const coincideModeloId = (item, modeloId) =>
  String(getModeloRelacionadoId(item) ?? "") === String(modeloId ?? "");

const coincideModeloIdFlexible = (item, modeloId, nivel = 0, visitados = new Set()) => {
  if (!item || typeof item !== "object" || nivel > 2 || visitados.has(item)) return false;
  visitados.add(item);

  for (const [clave, valor] of Object.entries(item)) {
    if (valor === null || valor === undefined) continue;

    if (typeof valor === "object") {
      if (coincideModeloIdFlexible(valor, modeloId, nivel + 1, visitados)) return true;
      continue;
    }

    if (String(valor) !== String(modeloId)) continue;

    if (/id|modelo|producto|base/i.test(clave)) {
      return true;
    }
  }

  return false;
};

const getVariantesDelModelo = (modelo = {}) => {
  const candidatos = [
    modelo?.variantes,
    modelo?.productos,
    modelo?.productosRelacionados,
    modelo?.productosHijos,
    modelo?.hijos,
    modelo?.detalle?.variantes,
    modelo?.detalle?.productos
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato) && candidato.length > 0) {
      return candidato;
    }
  }

  return [];
};

const getUrlImagenEnModelo = (modelo) =>
  modelo?.imagenUrl ||
  modelo?.urlImagen ||
  modelo?.imagenPrincipalUrl ||
  modelo?.fotoUrl ||
  modelo?.imagen?.url ||
  modelo?.imagenPrincipal?.url ||
  (Array.isArray(modelo?.imagenes) ? modelo.imagenes.find((img) => img?.url)?.url || "" : "") ||
  "";

const getUrlImagenDesdeRespuesta = (respuesta) => {
  if (!respuesta) return "";

  if (Array.isArray(respuesta)) {
    const principal = respuesta.find(
      (img) => Boolean(img?.esPrincipal || img?.principal) && img?.url
    );
    if (principal?.url) return principal.url;

    const primera = respuesta.find((img) => img?.url);
    return primera?.url || "";
  }

  if (typeof respuesta === "object") {
    return (
      respuesta?.url ||
      respuesta?.imagenUrl ||
      respuesta?.urlImagen ||
      respuesta?.fotoUrl ||
      respuesta?.imagenPrincipalUrl ||
      respuesta?.imagen?.url ||
      respuesta?.imagenPrincipal?.url ||
      ""
    );
  }

  return "";
};

const resolverImagenDesdeVariantes = async (variantes = []) => {
  for (const variante of variantes) {
    const urlDirectaVariante =
      variante?.imagenPrincipalUrl ||
      variante?.imagenUrl ||
      variante?.imagen?.url ||
      variante?.fotoUrl ||
      "";
    if (urlDirectaVariante) {
      return urlDirectaVariante;
    }

    const varianteId = getVarianteId(variante);
    if (!varianteId) continue;

    try {
      const imagenPrincipal = await obtenerImagenPrincipalPorVariante(varianteId);
      if (imagenPrincipal?.url) {
        return imagenPrincipal.url;
      }
    } catch {
      // Si una variante no tiene imagen principal, continuamos con la siguiente.
    }
  }

  return "";
};

async function resolverImagenPrincipalModelo(modelo) {
  const modeloId = getModeloId(modelo);

  if (modeloId) {
    try {
      const imagenModelo = await obtenerImagenPrincipalPorProducto(modeloId);
      const urlModelo = getUrlImagenDesdeRespuesta(imagenModelo);
      if (urlModelo) return urlModelo;
    } catch {
      // Si el modelo no tiene imagen independiente, seguimos con los respaldos.
    }
  }

  const imagenDirecta = getUrlImagenEnModelo(modelo);
  if (imagenDirecta) return imagenDirecta;

  const variantesLocales = getVariantesDelModelo(modelo);
  const imagenDesdeLocales = await resolverImagenDesdeVariantes(variantesLocales);
  if (imagenDesdeLocales) return imagenDesdeLocales;

  if (!modeloId) return "";

  try {
    const variantesResp = await obtenerVariantesPorProductoBase(modeloId);
    let variantes = getLista(variantesResp);
    if (variantes.length === 0) {
      const productosResp = await obtenerProductos();
      variantes = getLista(productosResp).filter((item) => coincideModeloId(item, modeloId) || coincideModeloIdFlexible(item, modeloId));
    }

    return resolverImagenDesdeVariantes(variantes);
  } catch {
    return "";
  }
}

export function useModelos({ page, size = 10, sortBy = "nombre", direction = "asc" } = {}) {
  const [modelos, setModelos] = useState([]);
  const [pageInfo, setPageInfo] = useState(PAGE_INFO_DEFAULT);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      setLoadingLista(true);
      setError("");

      const data =
        page === undefined || page === null
          ? await obtenerModelos()
          : await obtenerModelos({ page, size, sortBy, direction });

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
  };

  useEffect(() => {
    cargar();
  }, [page, size, sortBy, direction]);

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
