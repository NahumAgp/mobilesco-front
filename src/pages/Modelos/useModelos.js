import { useEffect, useState } from "react";
import {
  obtenerModelos,
  eliminarModelo as eliminarService
} from "../../services/modelos.js";
import { obtenerProductos, obtenerVariantesPorProductoBase } from "../../services/variantes.js";
import {
  obtenerImagenPrincipalPorProducto,
  obtenerImagenPrincipalPorVariante
} from "../../services/imagenes.js";

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

const getVariantesDelModelo = (modelo) => {
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

export function useModelos() {
  const [modelos, setModelos] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerModelos();
      const listaModelos = getLista(data);

      const modelosEnriquecidos = await Promise.all(
        listaModelos.map(async (modelo) => ({
          ...modelo,
          imagenPrincipalUrl: await resolverImagenPrincipalModelo(modelo)
        }))
      );

      setModelos(modelosEnriquecidos);
    } catch (error) {
      setError("Error cargando modelos: " + (error.message || "Error desconocido"));
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarModelo(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    modelos,
    loadingLista,
    error,
    eliminarModelo,
    recargarModelos: cargar
  };
}


