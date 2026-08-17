const PRIORIDADES = {
  ALTA: {
    codigo: "ALTA",
    etiqueta: "Prioridad alta",
    className: "bg-success-subtle text-success-emphasis border-success-subtle"
  },
  MEDIA: {
    codigo: "MEDIA",
    etiqueta: "Prioridad media",
    className: "bg-warning-subtle text-warning-emphasis border-warning-subtle"
  },
  BAJA: {
    codigo: "BAJA",
    etiqueta: "Prioridad baja",
    className: "bg-danger-subtle text-danger-emphasis border-danger-subtle"
  },
  SIN_EVALUAR: {
    codigo: "SIN_EVALUAR",
    etiqueta: "Sin evaluar",
    className: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle"
  },
  INVALIDA: {
    codigo: "INVALIDA",
    etiqueta: "Calificación inválida",
    className: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle"
  }
};

export function obtenerPrioridadProveedor(calificacion) {
  if (
    calificacion === null
    || calificacion === undefined
    || (typeof calificacion === "string" && calificacion.trim() === "")
  ) {
    return PRIORIDADES.SIN_EVALUAR;
  }

  const valor = Number(calificacion);

  if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
    return PRIORIDADES.INVALIDA;
  }

  if (valor >= 75) {
    return PRIORIDADES.ALTA;
  }

  if (valor >= 50) {
    return PRIORIDADES.MEDIA;
  }

  return PRIORIDADES.BAJA;
}
