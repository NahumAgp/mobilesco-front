import { describe, expect, it } from "vitest";

import { obtenerPrioridadProveedor } from "./prioridadProveedor.js";

describe("obtenerPrioridadProveedor", () => {
  it.each([
    [null, "SIN_EVALUAR", "Sin evaluar"],
    [undefined, "SIN_EVALUAR", "Sin evaluar"],
    ["", "SIN_EVALUAR", "Sin evaluar"],
    ["   ", "SIN_EVALUAR", "Sin evaluar"],
    [0, "BAJA", "Prioridad baja"],
    [49.99, "BAJA", "Prioridad baja"],
    [50, "MEDIA", "Prioridad media"],
    [74.99, "MEDIA", "Prioridad media"],
    [75, "ALTA", "Prioridad alta"],
    [100, "ALTA", "Prioridad alta"]
  ])(
    "clasifica %s como %s",
    (calificacion, codigoEsperado, etiquetaEsperada) => {
      expect(obtenerPrioridadProveedor(calificacion)).toMatchObject({
        codigo: codigoEsperado,
        etiqueta: etiquetaEsperada
      });
    }
  );

  it("acepta la calificacion como texto porque el formulario usa el valor del input", () => {
    expect(obtenerPrioridadProveedor("75").codigo).toBe("ALTA");
  });

  it.each([-1, 100.01, "no numerica", Number.NaN])(
    "marca %s como una calificacion invalida",
    (calificacion) => {
      expect(obtenerPrioridadProveedor(calificacion)).toMatchObject({
        codigo: "INVALIDA",
        etiqueta: "Calificación inválida"
      });
    }
  );
});
