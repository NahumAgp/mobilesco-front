import { describe, expect, it } from "vitest";
import { prepararPaginasCatalogo } from "./catalogoPdf";

describe("páginas del catálogo PDF", () => {
  it("muestra una sola imagen por modelo y agrupa sus colores", () => {
    const productos = [
      ...Array.from({ length: 5 }, (_, indice) => ({
        id: indice + 1, activo: true, linea: "ESCOLAR", familia: "SILLAS", modeloId: 10,
        modelo: "Concha", nombre: `Variante ${indice + 1}`, colorId: indice + 1,
        colorNombre: `Color ${indice + 1}`, modeloImagenUrl: "/modelo-concha.jpg",
        imagenUrl: `/variante-${indice + 1}.jpg`,
      })),
      { id: 7, activo: true, linea: "OFICINA", familia: "SILLAS", modeloId: 20, modelo: "Ejecutiva", nombre: "Silla de oficina" },
      { id: 8, activo: false, linea: "ESCOLAR", familia: "SILLAS", nombre: "No mostrar" },
    ];

    const paginas = prepararPaginasCatalogo(productos);

    expect(paginas.map((pagina) => [pagina.linea, pagina.productos.length])).toEqual([
      ["Sillas escolares", 1], ["Sillas de oficina", 1],
    ]);
    expect(paginas[0].productos[0]).toMatchObject({
      nombre: "Concha", imagenUrl: "/modelo-concha.jpg",
    });
    expect(paginas[0].productos[0].colores).toHaveLength(5);
    expect(paginas.flatMap((pagina) => pagina.productos).map((producto) => producto.nombre)).not.toContain("No mostrar");
  });

  it("continúa la misma familia en otra página cuando hay más de cuatro modelos", () => {
    const productos = Array.from({ length: 5 }, (_, indice) => ({
      id: indice + 1, activo: true, linea: "ESCOLAR", familia: "SILLAS",
      modeloId: indice + 1, modelo: `Modelo ${indice + 1}`,
    }));
    expect(prepararPaginasCatalogo(productos).map((pagina) => pagina.productos.length)).toEqual([4, 1]);
  });
});
