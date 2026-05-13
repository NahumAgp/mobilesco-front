import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductoWizard from "./components/ProductoWizard";
import { crearModelo, actualizarModelo, subirImagenModelo } from "../../services/modelos";
import { crearVariante } from "../../services/variantes";
import { crearImagen, subirImagenArchivo } from "../../services/imagenes";
import { obtenerProductos, eliminarProducto, exportarProductosExcel } from "../../services/productos";
import { obtenerModelos } from "../../services/modelos";
import { obtenerNiveles } from "../../services/niveles";
import { obtenerColores } from "../../services/color";
import { obtenerMaterialesActivos } from "../../services/materiales";
import VariantesTable from "../Variantes/VariantesTable";
import PageHeader from "../../components/Sistema/PageHeader";
import Toast from "../../components/ui/Toast";
import "./ProductosCompletosPage.css";

const PAGE_SIZE = 10;

function construirRangoPaginas(totalPages, currentPage) {
  if (!totalPages || totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const paginas = [0];
  const inicio = Math.max(1, currentPage - 1);
  const fin = Math.min(totalPages - 2, currentPage + 1);

  if (inicio > 1) {
    paginas.push("...");
  }

  for (let page = inicio; page <= fin; page += 1) {
    paginas.push(page);
  }

  if (fin < totalPages - 2) {
    paginas.push("...");
  }

  paginas.push(totalPages - 1);
  return paginas;
}

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
      console.error("No se pudieron cargar los catalogos de variantes:", error);
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

  const enriquecerProducto = (producto) => {
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
  };

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
        varianteId,
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
      varianteId
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
      const usarModeloExistente = nuevoProducto?.modelo?.modo === "existente";
      let modeloId = usarModeloExistente ? Number(nuevoProducto?.modelo?.id) : null;

      if (!usarModeloExistente) {
        const modeloPayload = {
          codigo: nuevoProducto?.modelo?.codigo?.trim() || "",
          nombre: nuevoProducto?.modelo?.nombre?.trim() || "",
          descripcion: nuevoProducto?.modelo?.descripcion?.trim() || "",
          familia_id: Number(nuevoProducto?.modelo?.familiaId),
          activo: Boolean(nuevoProducto?.modelo?.activo)
        };

        const modeloGuardado = await crearModelo(modeloPayload);
        modeloId = obtenerIdModelo(modeloGuardado);
      }

      if (!modeloId) {
        throw new Error("No se recibio el ID del modelo para guardar variantes.");
      }

      const variantes = Array.isArray(nuevoProducto?.variantes) ? nuevoProducto.variantes : [];
      const { modelo: imagenModelo, variantes: imagenesPorVariante } = normalizarImagenes(
        nuevoProducto?.imagenes
      );

      if (imagenModelo?.file instanceof File) {
        await subirImagenModelo(Number(modeloId), imagenModelo.file);
      } else {
        const urlModelo = construirUrlPersistible(imagenModelo);
        if (urlModelo) {
          await actualizarModelo(Number(modeloId), { url_imagen: urlModelo });
        }
      }

      const mapaVariantes = new Map();
      for (const variante of variantes) {
        const payloadVariante = {
          sku: variante?.sku?.trim().toUpperCase() || "",
          nombre: `${nuevoProducto?.modelo?.nombre || "Modelo"} ${variante?.categoriaNombre || ""} ${variante?.materialNombre || ""} ${variante?.colorNombre || ""}`
            .trim()
            .replace(/\s+/g, " "),
          descripcion: `Variante ${variante?.categoriaNombre || "sin categoria"} - ${variante?.materialNombre || "sin material"} - ${variante?.colorNombre || "sin color"}`,
          activo: true,
          id_modelo: Number(modeloId),
          id_nivel: variante?.categoriaId ? Number(variante.categoriaId) : null,
          id_material: variante?.materialId ? Number(variante.materialId) : null,
          id_color: variante?.colorId ? Number(variante.colorId) : null
        };

        const varianteGuardada = await crearVariante(payloadVariante);

        const varianteIdBd = obtenerIdVariante(varianteGuardada);
        if (!varianteIdBd) {
          throw new Error(`No se recibio ID de la variante ${variante?.sku || ""}.`);
        }

        mapaVariantes.set(String(variante.id), Number(varianteIdBd));
      }

      const coloresConImagenesGuardadas = new Set();

      for (const variante of variantes) {
        const varianteIdBd = mapaVariantes.get(String(variante.id));
        if (!varianteIdBd) continue;

        const listaImagenes = Array.isArray(imagenesPorVariante?.[String(variante.id)])
          ? imagenesPorVariante[String(variante.id)]
          : [];

        const colorKey = variante?.colorId ? String(variante.colorId) : String(variante.id);
        if (coloresConImagenesGuardadas.has(colorKey)) {
          continue;
        }

        for (let idx = 0; idx < listaImagenes.length; idx += 1) {
          const imagen = listaImagenes[idx];
          await guardarImagenVariante({
            imagen,
            varianteId: varianteIdBd,
            esPrincipal: Boolean(imagen?.principal),
            orden: idx + 1,
            altTexto: imagen?.nombre || `Imagen ${idx + 1}`
          });
        }

        if (listaImagenes.length > 0) {
          coloresConImagenesGuardadas.add(colorKey);
        }
      }

      setTipoMensaje("success");
      setMensaje(
        "Producto guardado en BD (modelo, variantes e imagenes)."
      );
      cerrarModoCreacion();
      await cargarProductos();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || "No se pudo guardar el producto en la base de datos.");
      throw error;
    }
  };

  const manejarEliminar = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta variante?");
    if (!confirmar) return;

    try {
      await eliminarProducto(id);
      setTipoMensaje("success");
      setMensaje("Variante eliminada correctamente.");
      await cargarProductos();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || "No se pudo eliminar la variante.");
    }
  };

  const productosEnriquecidos = useMemo(
    () => productos.map((producto) => enriquecerProducto(producto)),
    [productos, modelosCatalogo, categoriasCatalogo, materialesCatalogo, coloresCatalogo, modelosPorId, categoriasPorId, materialesPorId, coloresPorId]
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
  const paginasVisibles = construirRangoPaginas(totalPages, paginaActual);
  const desde = totalElements > 0 ? paginaActual * PAGE_SIZE + 1 : 0;
  const hasta = totalElements > 0 ? Math.min((paginaActual + 1) * PAGE_SIZE, totalElements) : 0;
  const productosPaginados = productosFiltrados.slice(paginaActual * PAGE_SIZE, paginaActual * PAGE_SIZE + PAGE_SIZE);
  const hayFiltrosActivos = Boolean(busqueda.trim()) || filtroEstatus !== "TODOS" || Boolean(filtroModelo) || Boolean(filtroNivel) || Boolean(filtroColor);
  const mostrarVacio = !loadingLista && !errorLista && productos.length === 0;
  const mostrarSinCoincidencias = !loadingLista && !errorLista && productos.length > 0 && productosFiltrados.length === 0;

  useEffect(() => {
    if (!loadingLista && totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [loadingLista, page, totalPages]);

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina < 0) return;
    if (totalPages > 0 && nuevaPagina >= totalPages) return;
    setPage(nuevaPagina);
  };

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
        subtitle="Catalogo paginado de modelos, variantes e imagenes"
        actions={
          <div className="productos-header-actions">
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
                placeholder="Buscar por SKU, variante, modelo, nivel o color..."
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
            <VariantesTable
              data={productosPaginados}
              onEditar={(variante) => navigate(`/productos/${variante.id}`)}
              onEliminar={manejarEliminar}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={manejarOrden}
            />
          )}

          {totalElements > 0 && (
            <div className="productos-pagination-panel">
              <div className="productos-pagination-summary">
                {hayFiltrosActivos
                  ? `Mostrando ${productosPaginados.length} de ${totalElements} coincidencias`
                  : `Mostrando ${desde} a ${hasta} de ${totalElements} productos`}
              </div>

              <nav aria-label="Paginacion de productos">
                <ul className="pagination mb-0 flex-wrap">
                  <li className={`page-item ${paginaActual <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(0)}
                      disabled={paginaActual <= 0}
                    >
                      Primera
                    </button>
                  </li>

                  <li className={`page-item ${paginaActual <= 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(paginaActual - 1)}
                      disabled={paginaActual <= 0}
                    >
                      Anterior
                    </button>
                  </li>

                  {paginasVisibles.map((pagina, index) => (
                    pagina === "..." ? (
                      <li key={`dots-${index}`} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : (
                      <li
                        key={`page-${pagina}`}
                        className={`page-item ${paginaActual === pagina ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => irAPagina(pagina)}
                        >
                          {pagina + 1}
                        </button>
                      </li>
                    )
                  ))}

                  <li className={`page-item ${paginaActual >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual >= totalPages - 1}
                    >
                      Siguiente
                    </button>
                  </li>

                  <li className={`page-item ${paginaActual >= totalPages - 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => irAPagina(totalPages - 1)}
                      disabled={paginaActual >= totalPages - 1}
                    >
                      Ultima
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}
    </>
  );
}
