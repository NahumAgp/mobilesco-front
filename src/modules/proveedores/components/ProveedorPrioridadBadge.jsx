import { obtenerPrioridadProveedor } from "../utils/prioridadProveedor.js";

export default function ProveedorPrioridadBadge({ calificacion }) {
  const prioridad = obtenerPrioridadProveedor(calificacion);

  return (
    <span
      className={`badge rounded-pill border ${prioridad.className}`}
      data-prioridad={prioridad.codigo}
      title="Calculada automáticamente a partir de la calificación"
    >
      {prioridad.etiqueta}
    </span>
  );
}
