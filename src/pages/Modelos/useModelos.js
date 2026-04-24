import { useEffect, useState } from "react";
import {
  obtenerModelos,
  eliminarModelo as eliminarService
} from "../../services/modelos.js";
import { obtenerVariantesPorProductoBase } from "../../services/variantes.js";
import { obtenerImagenPrincipalPorVariante } from "../../services/imagenes.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getModeloId = (modelo) =>
  modelo?.id || modelo?.modeloId || modelo?.id_producto_base || modelo?.productoBaseId || null;

const getVarianteId = (variante) =>
  variante?.id || variante?.varianteId || variante?.id_variante || null;

const getUrlImagenEnModelo = (modelo) =>
  modelo?.imagenUrl ||
  modelo?.urlImagen ||
  modelo?.imagenPrincipalUrl ||
  modelo?.fotoUrl ||
  modelo?.imagen?.url ||
  modelo?.imagenPrincipal?.url ||
  "";

async function resolverImagenPrincipalModelo(modelo) {
  const imagenDirecta = getUrlImagenEnModelo(modelo);
  if (imagenDirecta) return imagenDirecta;

  const modeloId = getModeloId(modelo);
  if (!modeloId) return "";

  try {
    const variantesResp = await obtenerVariantesPorProductoBase(modeloId);
    const variantes = getLista(variantesResp);

    for (const variante of variantes) {
      const urlDirectaVariante =
        variante?.imagenPrincipalUrl ||
        variante?.imagenUrl ||
        variante?.imagen?.url ||
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
    } catch (e) {
      setError("Error cargando modelos: " + (e.message || "Error desconocido"));
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
    eliminarModelo
  };
}
