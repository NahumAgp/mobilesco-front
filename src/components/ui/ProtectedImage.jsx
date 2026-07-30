import { useEffect, useState } from "react";
import request from "../../services/api";

function esCargaPrivada(src) {
  if (!src) return false;
  try {
    const url = new URL(src, window.location.origin);
    return url.pathname.startsWith("/uploads/empleados/");
  } catch {
    return false;
  }
}

export default function ProtectedImage({ src, onError, ...props }) {
  const [resolvedSrc, setResolvedSrc] = useState(() => esCargaPrivada(src) ? "" : src);

  useEffect(() => {
    if (!src || !esCargaPrivada(src)) {
      setResolvedSrc(src || "");
      return undefined;
    }

    let activo = true;
    let objectUrl = "";

    request(src, { responseType: "blob" })
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch((error) => {
        if (!activo) return;
        setResolvedSrc("");
        onError?.(error);
      });

    return () => {
      activo = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // onError puede ser una funcion inline; la carga debe repetirse solo si cambia la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return <img {...props} src={resolvedSrc || undefined} onError={onError} />;
}
