const COLORES_CONOCIDOS = [
  [/blanco|white/i, "#f8fafc"],
  [/negro|black/i, "#111827"],
  [/gris|gray|grey/i, "#94a3b8"],
  [/marr[oó]n|caf[eé]|chocolate/i, "#8b5e3c"],
  [/claro|arena|beige|natural|roble/i, "#c8aa7a"],
  [/oscuro|nogal|wenge/i, "#5f432d"],
  [/azul|blue/i, "#2563eb"],
  [/verde|green/i, "#16a34a"],
  [/rosa|pink|magenta/i, "#ec4899"],
  [/rojo|red/i, "#dc2626"],
  [/amarillo|yellow/i, "#facc15"],
  [/naranja|orange/i, "#f97316"],
];

const normalizar = (valor) => String(valor || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function getColorHex(producto) {
  const directo = String(producto?.colorHex || producto?.color?.hex || producto?.hexColor || "").trim();
  const valor = directo.startsWith("#") ? directo.slice(1) : directo;
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(valor)) return `#${valor.slice(0, 6).toLowerCase()}`;
  if (/^[0-9a-f]{3}$/i.test(valor)) return `#${[...valor].map((caracter) => caracter.repeat(2)).join("").toLowerCase()}`;

  const nombre = String(producto?.colorNombre || producto?.nombre_color || producto?.color?.nombre || "");
  return COLORES_CONOCIDOS.find(([patron]) => patron.test(nombre))?.[1] || "#9ca3af";
}

export function getColorRgb(producto) {
  const hex = getColorHex(producto).slice(1);
  return [0, 2, 4].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16));
}

export function listarColoresModelo(productos) {
  const colores = new Map();
  productos.forEach((producto) => {
    const nombre = String(producto?.colorNombre || producto?.nombre_color || producto?.color?.nombre || "Sin color").trim();
    const id = producto?.colorId ?? producto?.id_color ?? producto?.color?.id;
    const key = id == null ? normalizar(nombre) : String(id);
    if (!colores.has(key)) colores.set(key, { key, nombre, hex: getColorHex(producto), productoId: producto.id });
  });
  return [...colores.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}
