import { useEffect, useState } from "react";

export function useGeneratedCatalogCode(nombre, enabled, fetchSuggestedCode) {
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCodigoGenerado("");
      setGenerandoCodigo(false);
      return undefined;
    }

    const nombreNormalizado = nombre?.trim() || "";
    if (!nombreNormalizado) {
      setCodigoGenerado("");
      setGenerandoCodigo(false);
      return undefined;
    }

    let vigente = true;
    const timeoutId = setTimeout(async () => {
      try {
        setGenerandoCodigo(true);
        const respuesta = await fetchSuggestedCode(nombreNormalizado);
        if (vigente) {
          setCodigoGenerado(respuesta?.codigo || "");
        }
      } catch {
        if (vigente) {
          setCodigoGenerado("");
        }
      } finally {
        if (vigente) {
          setGenerandoCodigo(false);
        }
      }
    }, 200);

    return () => {
      vigente = false;
      clearTimeout(timeoutId);
    };
  }, [enabled, fetchSuggestedCode, nombre]);

  return { codigoGenerado, generandoCodigo };
}
