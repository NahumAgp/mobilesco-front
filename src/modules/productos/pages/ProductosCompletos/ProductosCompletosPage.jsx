import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductoWizard from "./components/ProductoWizard";
import { actualizarModelo, subirImagenModelo } from "../../../modelos/services/modelos";
import { crearImagen, subirImagenArchivo } from "../../services/imagenes";
import { activarProducto, crearProductoCompleto, obtenerProductos, eliminarProducto, exportarProductosExcel } from "../../services/productos";
import { obtenerModelos } from "../../../modelos/services/modelos";
import { obtenerNiveles } from "../../services/niveles";
import { obtenerColores } from "../../../colores/services/color";
import { obtenerMaterialesActivos } from "../../../materiales/services/materiales";
import ProductosListadoTable from "./components/ProductosListadoTable";
import PageHeader from "../../../../components/Sistema/PageHeader";
import CatalogPagination from "../../../../components/ui/CatalogPagination";
import Toast from "../../../../components/ui/Toast";
import "./ProductosCompletosPage.css";

const PAGE_SIZE = 10;

const compararValor = (a, b) => {
  const valorA = a ?? "";
  const valorB = b ?? "";

  if (typeof valorA === "number" && typeof valorB === "number") {
    return valorA - valorB;
  }

  if (typeof valorA === "boolean" && typeof valorB === "boolean") {
    return Number(valorA) - Number(valorB);
  }

  return String(valorA).localeCompare(String(valorB), "es", {
    numeric: true,
    sensitivity: "base"
  });
};

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

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getNombrePorCatalogo = (item, catalogo, clavesId = [], clavesNombre = []) => {
  for (const clave of clavesNombre) {
    const valorDirecto = item?.[clave];
    if (typeof valorDirecto === "string" && valorDirecto.trim()) return valorDirecto.trim();
  }

  for (const clave of clavesId) {
    const id = item?.[clave];
    if (id === null || id === undefined || id === "") continue;
    const encontrado = catalogo.find((registro) => String(registro?.id) === String(id));
    if (encontrado?.nombre) return encontrado.nombre;
  }

  return "";
};

const getRelacionadoId = (item, claves = []) => {
  for (const clave of claves) {
    const valor = item?.[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }

  return (
    item?.modelo?.id ||
    item?.modelo?.modeloId ||
    item?.modelo?.id_modelo ||
    item?.modelo?.producto_base_id ||
    item?.productoBase?.id ||
    item?.producto_base?.id ||
    null
  );
};

const buscarIdEnCatalogo = (item, catalogoMapa, nivel = 0, visitados = new Set()) => {
  if (!item || typeof item !== "object" || nivel > 2 || visitados.has(item)) return null;
  visitados.add(item);

  for (const [clave, valor] of Object.entries(item)) {
    if (valor === null || valor === undefined) continue;

    if (typeof valor === "object") {
      const encontrado = buscarIdEnCatalogo(valor, catalogoMapa, nivel + 1, visitados);
      if (encontrado !== null) return encontrado;
      continue;
    }

    if (/id|modelo|producto|base|nivel|categoria|color/i.test(clave) && catalogoMapa.has(String(valor))) {
      return valor;
    }
  }

  return null;
};

export default function ProductosCompletosPage({ iniciarCreacion = false }) {
  const navigate = useNavigate();
  const [modoCreacion, setModoCreacion] = useState(iniciarCreacion);
  const [productos, setProductos] = useState([]);
  const [modelosCatalogo, setModelosCatalogo] = useState([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [materialesCatalogo, setMaterialesCatalogo] = useState([]);
  const [coloresCatalogo, setColoresCatalogo] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [errorLista, setErrorLista] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroColor, setFiltroColor] = useState("");
  const [sortField, setSortField] = useState("sku");
  const [sortDirection, setSortDirection] = useState("asc");
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const cargarProductos = async () => {
    // Limpiar cache legado del modulo cuando existia en modo local.
    localStorage.removeItem("productos_completos_cache");
    localStorage.removeItem("productos_prueba");

    try {
      setLoadingLista(true);
      setErrorLista("");
      const data = await obtenerProductos();
      setProductos(getLista(data));
    } catch (error) {
      setErrorLista(error?.message || "No se pudieron cargar los productos.");
    } finally {
      setLoadingLista(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [modelosResp, categoriasResp, materialesResp, coloresResp] = await Promise.all([
        obtenerModelos(),
        obtenerNiveles(),
        obtenerMaterialesActivos(),
        obtenerColores()
      ]);

      setModelosCatalogo(getLista(modelosResp));
      setCategoriasCatalogo(getLista(categoriasResp));
      setMaterialesCatalogo(getLista(materialesResp));
      setColoresCatalogo(getLista(coloresResp));
    } catch (error) {
      console.error("No se pudieron cargar los catalogos de productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

  const exportarExcel = async () => {
    try {
      setExportandoExcel(true);

      const blob = await exportarProductosExcel({
        activo: filtroEstatus === "TODOS" ? undefined : filtroEstatus === "ACTIVO",
        busqueda: busqueda || undefined,
        sortBy: sortField,
        direction: sortDirection
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "productos.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setTipoMensaje("success");
      setMensaje("Reporte de Excel generado correctamente");
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || "No se pudo generar el reporte de Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  const obtenerIdModelo = (modeloGuardado) =>
    modeloGuardado?.id ||
    modeloGuardado?.modeloId ||
    modeloGuardado?.id_producto_base ||
    modeloGuardado?.productoBaseId ||
    null;

  const obtenerIdVariante = (varianteGuardada) =>
    varianteGuardada?.id ||
    varianteGuardada?.varianteId ||
    varianteGuardada?.id_variante ||
    null;

  const modelosPorId = useMemo(
    () => new Map(modelosCatalogo.map((modelo) => [String(modelo?.id), modelo?.nombre || ""])),
    [modelosCatalogo]
  );

  const categoriasPorId = useMemo(
    () => new Map(categoriasCatalogo.map((categoria) => [String(categoria?.id), categoria?.nombre || ""])),
    [categoriasCatalogo]
  );

  const coloresPorId = useMemo(
    () => new Map(coloresCatalogo.map((color) => [String(color?.id), color?.nombre || ""])),
    [coloresCatalogo]
  );

  const materialesPorId = useMemo(
    () => new Map(materialesCatalogo.map((material) => [String(material?.id), material?.nombre || ""])),
    [materialesCatalogo]
  );

  const enriquecerProducto = useCallback((producto) => {
    const modeloNombre =
      producto?.nombre_modelo ||
      getNombrePorCatalogo(
        producto,
        modelosCatalogo,
        ["productoBaseId", "modeloId", "id_producto_base", "id_modelo", "producto_base_id", "modelo_id"],
        ["productoBaseNombre", "modeloNombre"]
      ) ||
      modelosPorId.get(
        String(
          getRelacionadoId(producto, [
            "productoBaseId",
            "modeloId",
            "id_producto_base",
            "id_modelo",
            "producto_base_id",
            "modelo_id"
          ])
        )
      ) ||
      modelosPorId.get(String(buscarIdEnCatalogo(producto, modelosPorId))) ||
      "";

    const categoriaNombre =
      producto?.nombre_nivel ||
      getNombrePorCatalogo(
        producto,
        categoriasCatalogo,
        ["id_nivel", "nivelId", "categoriaId", "nivel_id", "categoria_id"],
        ["nivelNombre", "categoriaNombre"]
      ) ||
      categoriasPorId.get(
        String(getRelacionadoId(producto, ["id_nivel", "nivelId", "categoriaId", "nivel_id", "categoria_id"]))
      ) ||
      "";

    const colorNombre =
      producto?.nombre_color ||
      getNombrePorCatalogo(
        producto,
        coloresCatalogo,
        ["id_color", "colorId", "color_id"],
        ["colorNombre"]
      ) ||
      coloresPorId.get(String(getRelacionadoId(producto, ["id_color", "colorId", "color_id"]))) ||
      "";

    const materialNombre =
      producto?.nombre_material ||
      getNombrePorCatalogo(
        producto,
        materialesCatalogo,
        ["id_material", "materialId", "material_id"],
        ["materialNombre"]
      ) ||
      materialesPorId.get(String(getRelacionadoId(producto, ["id_material", "materialId", "material_id"]))) ||
      "";

    return {
      ...producto,
      lineaNombre: producto?.lineaNombre || producto?.linea?.nombre || producto?.modelo?.familia?.linea?.nombre || "",
      familiaNombre: producto?.familiaNombre || producto?.familia?.nombre || producto?.modelo?.familia?.nombre || "",
      nombre_modelo: modeloNombre || producto?.nombre_modelo || "",
      nombre_nivel: categoriaNombre || producto?.nombre_nivel || "",
      nombre_color: colorNombre || producto?.nombre_color || "",
      modeloNombre: modeloNombre || producto?.modeloNombre || producto?.productoBaseNombre || "",
      nivelNombre: categoriaNombre || producto?.nivelNombre || producto?.categoriaNombre || "",
      categoriaNombre: categoriaNombre || producto?.categoriaNombre || producto?.nivelNombre || "",
      materialNombre: materialNombre || producto?.materialNombre || "",
      nombre_material: materialNombre || producto?.nombre_material || "",
      colorNombre: colorNombre || producto?.colorNombre || "",
      productoBaseNombre: modeloNombre || producto?.productoBaseNombre || ""
    };
  }, [
    categoriasCatalogo,
    categoriasPorId,
    coloresCatalogo,
    coloresPorId,
    materialesCatalogo,
    materialesPorId,
    modelosCatalogo,
    modelosPorId
  ]);

  const normalizarImagenes = (imagenes) => {
    if (Array.isArray(imagenes)) {
      return {
        modelo: imagenes.find((img) => img?.principal) || imagenes[0] || null,
        variantes: {}
      };
    }

    return {
      modelo: imagenes?.modelo || null,
      variantes: imagenes?.variantes || {}
    };
  };

  const construirUrlPersistible = (imagen) => {
    const url = imagen?.url?.toString().trim();
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : "";
  };

  const guardarImagenVariante = async ({ imagen, varianteId, esPrincipal, orden, altTexto }) => {
    if (imagen?.file instanceof File) {
      return subirImagenArchivo({
        archivo: imagen.file,
        productoId: varianteId,
        esPrincipal,
        orden,
        altTexto
      });
    }

    const url = construirUrlPersistible(imagen);
    if (!url) return null;

    return crearImagen({
      url,
      esPrincipal,
      orden,
      altTexto,
      productoId: varianteId
    });
  };

  const cerrarModoCreacion = () => {
    setModoCreacion(false);
    if (iniciarCreacion) {
      navigate("/productos", { replace: true });
    }
  };

  const handleSaveComplete = async (nuevoProducto) => {
    try {
      const variantes = Array.isArray(nuevoProducto?.variantes) ? nuevoProducto.variantes : [];
      const borradores = nuevoProducto?.borradores || {};
      const modelo = nuevoProducto?.modelo || {};
      const esRef = (valor) => String(valor || "").startsWith("draft-");
      const refsCategoria = new Set(variantes.map((item) => item?.categoriaId).filter(esRef).map(String));
      const refsMaterial = new Set(variantes.map((item) => item?.materialId).filter(esRef).map(String));
      const refsColor = new Set(variantes.map((item) => item?.colorId).filter(esRef).map(String));
      const familiaBorrador = (borradores?.familias || []).find((item) => String(item.ref) === String(modelo?.familiaRef));
      const refsLinea = new Set(familiaBorrador?.lineaRef ? [String(familiaBorrador.lineaRef)] : []);
      const refsFamilia = new Set(modelo?.familiaRef ? [String(modelo.familiaRef)] : []);

      const payload = {
        lineas: (borradores?.lineas || [])
          .filter((item) => refsLinea.has(String(item.ref)))
          .map((item) => ({ ref: item.ref, codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion, orden: item.orden || 0 })),
        familias: (borradores?.familias || [])
          .filter((item) => refsFamilia.has(String(item.ref)))
          .map((item) => ({
            ref: item.ref,
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion,
            lineaId: item.lineaId || undefined,
            lineaRef: item.lineaRef || undefined
          })),
        modelo: modelo?._pending
          ? {
              ref: modelo.ref,
              codigo: modelo.codigo,
              nombre: modelo.nombre,
              descripcion: modelo.descripcion,
              activo: modelo.activo !== false,
              familiaId: modelo.familiaId || undefined,
              familiaRef: modelo.familiaRef || undefined,
              categorias: (modelo.categorias || []).map((item) => ({
                ref: item.ref || item.id,
                codigo: item.codigo,
                nombre: item.nombre,
                descripcion: item.descripcion,
                activo: item.activo !== false
              }))
            }
          : undefined,
        categorias: modelo?._pending
          ? []
          : (borradores?.categorias || [])
              .filter((item) => refsCategoria.has(String(item.ref)))
              .map((item) => ({
                ref: item.ref,
                codigo: item.codigo,
                nombre: item.nombre,
                descripcion: item.descripcion,
                activo: item.activo !== false,
                modeloId: Number(modelo.id)
              })),
        materiales: (borradores?.materiales || [])
          .filter((item) => refsMaterial.has(String(item.ref)))
          .map((item) => ({ ref: item.ref, codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion })),
        colores: (borradores?.colores || [])
          .filter((item) => refsColor.has(String(item.ref)))
          .map((item) => ({ ref: item.ref, codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion, hex: item.hex })),
        variantes: variantes.map((variante) => ({
          clientRef: String(variante.id),
          nombre: `${modelo?.nombre || "Modelo"} ${variante?.categoriaNombre || ""} ${variante?.materialNombre || ""} ${variante?.colorNombre || ""}`.trim().replace(/\s+/g, " "),
          descripcion: `Producto ${variante?.categoriaNombre || "sin categoria"} - ${variante?.materialNombre || "sin material"} - ${variante?.colorNombre || "sin color"}`,
          descripcionCorta: variante.descripcionCorta?.trim() || null,
          pesoVolumetrico: toOptionalNumber(variante.pesoVolumetrico),
          ancho: toOptionalNumber(variante.ancho),
          alto: toOptionalNumber(variante.alto),
          fondo: toOptionalNumber(variante.fondo),
          activo: true,
          modeloId: modelo?._pending ? undefined : Number(modelo.id),
          modeloRef: modelo?._pending ? modelo.ref : undefined,
          categoriaId: esRef(variante.categoriaId) ? undefined : Number(variante.categoriaId),
          categoriaRef: esRef(variante.categoriaId) ? String(variante.categoriaId) : undefined,
          materialId: esRef(variante.materialId) ? undefined : Number(variante.materialId),
          materialRef: esRef(variante.materialId) ? String(variante.materialId) : undefined,
          colorId: esRef(variante.colorId) ? undefined : Number(variante.colorId),
          colorRef: esRef(variante.colorId) ? String(variante.colorId) : undefined
        }))
      };

      const resultado = await crearProductoCompleto(payload);
      const modeloId = obtenerIdModelo(resultado?.modelo) || Number(modelo.id);
      const { modelo: imagenModelo, variantes: imagenesPorVariante } = normalizarImagenes(
        nuevoProducto?.imagenes
      );

      const mapaVariantes = new Map(
        (resultado?.productos || []).map((item) => [String(item.clientRef), Number(obtenerIdVariante(item.producto))])
      );
      const erroresImagen = [];

      try {
        if (imagenModelo?.file instanceof File) {
          await subirImagenModelo(Number(modeloId), imagenModelo.file);
        } else {
          const urlModelo = construirUrlPersistible(imagenModelo);
          if (urlModelo) await actualizarModelo(Number(modeloId), { url_imagen: urlModelo });
        }
      } catch (error) {
        erroresImagen.push(error?.message || "No se pudo guardar la portada del modelo.");
      }

      for (const variante of variantes) {
        const varianteIdBd = mapaVariantes.get(String(variante.id));
        if (!varianteIdBd) continue;

        const listaImagenes = Array.isArray(imagenesPorVariante?.[String(variante.id)])
          ? imagenesPorVariante[String(variante.id)]
          : [];

        for (let idx = 0; idx < listaImagenes.length; idx += 1) {
          const imagen = listaImagenes[idx];
          try {
            await guardarImagenVariante({
              imagen,
              varianteId: varianteIdBd,
              esPrincipal: Boolean(imagen?.principal),
              orden: idx + 1,
              altTexto: imagen?.nombre || `Imagen ${idx + 1}`
            });
          } catch (error) {
            erroresImagen.push(error?.message || `No se pudo guardar una imagen de ${variante?.colorNombre || "producto"}.`);
          }
        }

      }

      setTipoMensaje(erroresImagen.length ? "warning" : "success");
      setMensaje(erroresImagen.length
        ? `Producto guardado. ${erroresImagen.length} imagenes no pudieron cargarse.`
        : "Producto y catalogos relacionados guardados correctamente.");
      cerrarModoCreacion();
      await cargarProductos();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || "No se pudo guardar el producto en la base de datos.");
      throw error;
    }
  };

  const manejarCambiarEstado = async (producto) => {
    const id = producto?.id;
    const estaActivo = Boolean(producto?.activo);
    const accion = estaActivo ? "desactivar" : "activar";
    const confirmar = window.confirm(`¿Seguro que deseas ${accion} este producto?`);
    if (!confirmar) return;

    try {
      if (estaActivo) {
        await eliminarProducto(id);
      } else {
        await activarProducto(id);
      }
      setTipoMensaje("success");
      setMensaje(estaActivo ? "Producto desactivado correctamente." : "Producto activado correctamente.");
      await cargarProductos();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || `No se pudo ${accion} el producto.`);
    }
  };

  const productosEnriquecidos = useMemo(
    () => productos.map((producto) => enriquecerProducto(producto)),
    [productos, enriquecerProducto]
  );

  const modelosDisponibles = useMemo(() => {
    const mapa = new Map();
    productosEnriquecidos.forEach((producto) => {
      const id = producto?.modeloId || producto?.id_modelo || producto?.modelo_id || producto?.productoBaseId || "";
      const nombre = producto?.modeloNombre || producto?.nombre_modelo || producto?.productoBaseNombre || "";
      if (id && nombre) mapa.set(String(id), nombre);
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [productosEnriquecidos]);

  const nivelesDisponibles = useMemo(() => {
    const mapa = new Map();
    productosEnriquecidos.forEach((producto) => {
      const id = producto?.nivelId || producto?.id_nivel || producto?.nivel_id || producto?.categoriaId || "";
      const nombre = producto?.nivelNombre || producto?.nombre_nivel || producto?.categoriaNombre || "";
      if (id && nombre) mapa.set(String(id), nombre);
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [productosEnriquecidos]);

  const coloresDisponibles = useMemo(() => {
    const mapa = new Map();
    productosEnriquecidos.forEach((producto) => {
      const id = producto?.colorId || producto?.id_color || producto?.color_id || "";
      const nombre = producto?.colorNombre || producto?.nombre_color || "";
      if (id && nombre) mapa.set(String(id), nombre);
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [productosEnriquecidos]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim().replace(/\s+/g, " ");
    const palabras = termino ? termino.split(" ") : [];

    const filtrados = productosEnriquecidos.filter((productoEnriquecido) => {
      const texto = [
        productoEnriquecido?.sku,
        productoEnriquecido?.nombre,
        productoEnriquecido?.descripcion,
        productoEnriquecido?.lineaNombre,
        productoEnriquecido?.familiaNombre,
        productoEnriquecido?.productoBaseNombre,
        productoEnriquecido?.nombre_modelo,
        productoEnriquecido?.modeloNombre,
        productoEnriquecido?.nivelNombre,
        productoEnriquecido?.nombre_nivel,
        productoEnriquecido?.categoriaNombre,
        productoEnriquecido?.materialNombre,
        productoEnriquecido?.nombre_material,
        productoEnriquecido?.colorNombre,
        productoEnriquecido?.nombre_color,
        productoEnriquecido?.activo ? "activo" : "inactivo"
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = palabras.length === 0 || palabras.every((palabra) => texto.includes(palabra));
      const coincideEstatus =
        filtroEstatus === "TODOS" ||
        (filtroEstatus === "ACTIVO" && productoEnriquecido?.activo) ||
        (filtroEstatus === "INACTIVO" && !productoEnriquecido?.activo);
      const coincideModelo =
        !filtroModelo ||
        String(productoEnriquecido?.modeloId || productoEnriquecido?.id_modelo || productoEnriquecido?.modelo_id || productoEnriquecido?.productoBaseId || "") === String(filtroModelo);
      const coincideNivel =
        !filtroNivel ||
        String(productoEnriquecido?.nivelId || productoEnriquecido?.id_nivel || productoEnriquecido?.nivel_id || productoEnriquecido?.categoriaId || "") === String(filtroNivel);
      const coincideColor =
        !filtroColor ||
        String(productoEnriquecido?.colorId || productoEnriquecido?.id_color || productoEnriquecido?.color_id || "") === String(filtroColor);

      return coincideBusqueda && coincideEstatus && coincideModelo && coincideNivel && coincideColor;
    });

    return filtrados.sort((a, b) => {
      const getValor = (producto) => {
        switch (sortField) {
          case "modeloNombre":
            return producto?.modeloNombre || producto?.nombre_modelo || "";
          case "lineaNombre":
            return producto?.lineaNombre || "";
          case "familiaNombre":
            return producto?.familiaNombre || "";
          case "nivelNombre":
            return producto?.nivelNombre || producto?.nombre_nivel || producto?.categoriaNombre || "";
          case "colorNombre":
            return producto?.colorNombre || producto?.nombre_color || "";
          default:
            return producto?.[sortField];
        }
      };

      const resultado = compararValor(getValor(a), getValor(b));
      return sortDirection === "asc" ? resultado : -resultado;
    });
  }, [
    busqueda,
    filtroColor,
    filtroEstatus,
    filtroModelo,
    filtroNivel,
    productosEnriquecidos,
    sortDirection,
    sortField
  ]);

  const totalElements = productosFiltrados.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const paginaActual = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const productosPaginados = productosFiltrados.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE);
  const hayFiltrosActivos = Boolean(busqueda.trim()) || filtroEstatus !== "TODOS" || Boolean(filtroModelo) || Boolean(filtroNivel) || Boolean(filtroColor);
  const mostrarVacio = !loadingLista && !errorLista && productos.length === 0;
  const mostrarSinCoincidencias = !loadingLista && !errorLista && productos.length > 0 && productosFiltrados.length === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [loadingLista, page, totalPages]);

  const manejarOrden = (campo) => {
    if (sortField === campo) {
      setSortDirection((direccionActual) => (direccionActual === "asc" ? "desc" : "asc"));
    } else {
      setSortDirection("asc");
      setSortField(campo);
    }
    setPage(0);
  };

  if (modoCreacion) {
    return (
      <ProductoWizard onComplete={handleSaveComplete} onCancel={cerrarModoCreacion} />
    );
  }

  return (
    <>
      <Toast message={mensaje} type={tipoMensaje} onClose={() => setMensaje("")} />

      <PageHeader
        title="Productos"
        subtitle="Catalogo paginado de productos, colores e imagenes"
        actions={
          <div className="productos-header-actions">
            <button
              className="btn productos-brand-outline me-2"
              onClick={() => navigate("/productos/catalogo")}
            >
              <i className="bi bi-images me-1"></i>
              Catalogo visual
            </button>
            <button
              className="btn productos-brand-outline me-2"
              onClick={exportarExcel}
              disabled={exportandoExcel}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              {exportandoExcel ? "Generando..." : "Reporte Excel"}
            </button>
            <button className="btn productos-brand-primary" onClick={() => setModoCreacion(true)}>
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Producto
            </button>
          </div>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando productos...</div>}
      {errorLista && <div className="alert alert-danger">{errorLista}</div>}

      <div className="card mb-3 productos-filters-card">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-lg-4 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por SKU, producto, modelo, nivel o color..."
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div className="col-lg-2 col-md-3">
              <select
                className="form-select"
                value={filtroModelo}
                onChange={(event) => {
                  setFiltroModelo(event.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos los modelos</option>
                {modelosDisponibles.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-3">
              <select
                className="form-select"
                value={filtroNivel}
                onChange={(event) => {
                  setFiltroNivel(event.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos los niveles</option>
                {nivelesDisponibles.map((nivel) => (
                  <option key={nivel.id} value={nivel.id}>
                    {nivel.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-3">
              <select
                className="form-select"
                value={filtroColor}
                onChange={(event) => {
                  setFiltroColor(event.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos los colores</option>
                {coloresDisponibles.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-3">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(event) => {
                  setFiltroEstatus(event.target.value);
                  setPage(0);
                }}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {mostrarVacio ? (
        <div className="card shadow-sm border-0 productos-empty-card">
          <div className="text-center text-muted py-5">
            <i className="bi bi-box-seam fs-1 d-block mb-3 text-secondary"></i>
            <span className="fs-5 d-block">No hay productos registrados</span>
            <p className="text-secondary mt-2 mb-0">
              Crea el primer producto para comenzar el catalogo
            </p>
          </div>
        </div>
      ) : (
        <div className="productos-page-shell">
          {mostrarSinCoincidencias ? (
            <div className="card shadow-sm border-0 productos-empty-card">
              <div className="text-center text-muted py-5">
                <i className="bi bi-funnel fs-1 d-block mb-3 text-secondary"></i>
                <span className="fs-5 d-block">No hay coincidencias</span>
                <p className="text-secondary mt-2 mb-0">
                  Ajusta los filtros para ver productos en esta pagina
                </p>
              </div>
            </div>
          ) : (
            <ProductosListadoTable
              data={productosPaginados}
              onEditar={(variante) => navigate(`/productos/${variante.id}`)}
              onCambiarEstado={manejarCambiarEstado}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <CatalogPagination
              currentPage={paginaActual}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              currentCount={productosPaginados.length}
              itemLabel="productos"
              summary={
                hayFiltrosActivos
                  ? `Mostrando ${productosPaginados.length} de ${totalElements} coincidencias`
                  : undefined
              }
              ariaLabel="Paginacion de productos"
              onPageChange={setPage}
              className="productos-pagination-panel"
            />
          )}
        </div>
      )}
    </>
  );
}
