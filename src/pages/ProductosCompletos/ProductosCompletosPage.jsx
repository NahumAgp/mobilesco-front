import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductoWizard from "./components/ProductoWizard";
import { crearModelo } from "../../services/modelos";
import { crearVariante } from "../../services/variantes";
import { crearImagen, subirImagenArchivo } from "../../services/imagenes";
import { obtenerProductos, eliminarProducto } from "../../services/productos";
import { obtenerModelos } from "../../services/modelos";
import { obtenerCategorias } from "../../services/categorias";
import { obtenerColores } from "../../services/color";
import VariantesTable from "../Variantes/VariantesTable";
import PageHeader from "../../components/Sistema/PageHeader";
import Toast from "../../components/ui/Toast";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
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

export default function ProductosCompletosPage({ iniciarCreacion = false }) {
  const navigate = useNavigate();
  const [modoCreacion, setModoCreacion] = useState(iniciarCreacion);
  const [productos, setProductos] = useState([]);
  const [modelosCatalogo, setModelosCatalogo] = useState([]);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState([]);
  const [coloresCatalogo, setColoresCatalogo] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [errorLista, setErrorLista] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");

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
      const [modelosResp, categoriasResp, coloresResp] = await Promise.all([
        obtenerModelos(),
        obtenerCategorias(),
        obtenerColores()
      ]);

      setModelosCatalogo(getLista(modelosResp));
      setCategoriasCatalogo(getLista(categoriasResp));
      setColoresCatalogo(getLista(coloresResp));
    } catch (error) {
      console.error("No se pudieron cargar los catalogos de variantes:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

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

  const enriquecerProducto = (producto) => {
    const modeloNombre =
      getNombrePorCatalogo(
        producto,
        modelosCatalogo,
        ["productoBaseId", "modeloId", "id_producto_base", "id_modelo"],
        ["productoBaseNombre", "modeloNombre"]
      ) ||
      modelosPorId.get(String(producto?.productoBaseId || producto?.modeloId || producto?.id_producto_base || producto?.id_modelo)) ||
      "";

    const categoriaNombre =
      getNombrePorCatalogo(
        producto,
        categoriasCatalogo,
        ["id_nivel", "nivelId", "categoriaId"],
        ["nivelNombre", "categoriaNombre"]
      ) ||
      categoriasPorId.get(String(producto?.id_nivel || producto?.nivelId || producto?.categoriaId)) ||
      "";

    const colorNombre =
      getNombrePorCatalogo(
        producto,
        coloresCatalogo,
        ["id_color", "colorId"],
        ["colorNombre"]
      ) ||
      coloresPorId.get(String(producto?.id_color || producto?.colorId)) ||
      "";

    return {
      ...producto,
      modeloNombre: modeloNombre || producto?.modeloNombre || producto?.productoBaseNombre || "",
      nivelNombre: categoriaNombre || producto?.nivelNombre || producto?.categoriaNombre || "",
      categoriaNombre: categoriaNombre || producto?.categoriaNombre || producto?.nivelNombre || "",
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

      const mapaVariantes = new Map();
      for (const variante of variantes) {
        const payloadVariante = {
          sku: variante?.sku?.trim().toUpperCase() || "",
          nombre: `${nuevoProducto?.modelo?.nombre || "Modelo"} ${variante?.categoriaNombre || ""} ${variante?.colorNombre || ""}`
            .trim()
            .replace(/\s+/g, " "),
          descripcion: `Variante ${variante?.categoriaNombre || "sin categoria"} - ${variante?.colorNombre || "sin color"}`,
          activo: true,
          id_producto_base: Number(modeloId),
          id_nivel: variante?.categoriaId ? Number(variante.categoriaId) : null,
          id_color: variante?.colorId ? Number(variante.colorId) : null
        };

        const varianteGuardada = await crearVariante(payloadVariante);

        const varianteIdBd = obtenerIdVariante(varianteGuardada);
        if (!varianteIdBd) {
          throw new Error(`No se recibio ID de la variante ${variante?.sku || ""}.`);
        }

        mapaVariantes.set(String(variante.id), Number(varianteIdBd));
      }

      for (const variante of variantes) {
        const varianteIdBd = mapaVariantes.get(String(variante.id));
        if (!varianteIdBd) continue;

        const listaImagenes = Array.isArray(imagenesPorVariante?.[String(variante.id)])
          ? imagenesPorVariante[String(variante.id)]
          : [];

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
      }

      if (imagenModelo?.origen !== "variante" && imagenModelo && variantes.length > 0) {
        const primeraVarianteLocal = variantes[0];
        const primeraVarianteBd = mapaVariantes.get(String(primeraVarianteLocal.id));

        if (primeraVarianteBd) {
          const listaPrimera = Array.isArray(imagenesPorVariante?.[String(primeraVarianteLocal.id)])
            ? imagenesPorVariante[String(primeraVarianteLocal.id)]
            : [];

          await guardarImagenVariante({
            imagen: imagenModelo,
            varianteId: primeraVarianteBd,
            esPrincipal: listaPrimera.length === 0,
            orden: listaPrimera.length + 1,
            altTexto: imagenModelo?.nombre || "Portada del modelo"
          });
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

  const productosFiltrados = productos.filter((variante) => {
    const productoEnriquecido = enriquecerProducto(variante);
    const termino = busqueda.toLowerCase().trim();
    const texto = [
      productoEnriquecido?.sku,
      productoEnriquecido?.nombre,
      productoEnriquecido?.descripcion,
      productoEnriquecido?.productoBaseNombre,
      productoEnriquecido?.modeloNombre,
      productoEnriquecido?.nivelNombre,
      productoEnriquecido?.categoriaNombre,
      productoEnriquecido?.colorNombre
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = !termino || texto.includes(termino);
    const coincideEstatus =
      filtroEstatus === "TODOS" ||
      (filtroEstatus === "ACTIVO" && productoEnriquecido?.activo) ||
      (filtroEstatus === "INACTIVO" && !productoEnriquecido?.activo);

    return coincideBusqueda && coincideEstatus;
  });

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
        subtitle="Alta unificada de modelos, variantes e imagenes"
        actions={
          <button className="btn btn-success" onClick={() => setModoCreacion(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Nuevo Producto
          </button>
        }
      />

      {loadingLista && <div className="alert alert-info">Cargando productos...</div>}
      {errorLista && <div className="alert alert-danger">{errorLista}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por SKU, variante, modelo, nivel o color..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(event) => setFiltroEstatus(event.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <VariantesTable
        data={productosFiltrados}
        onEditar={(variante) => navigate(`/productos/${variante.id}`)}
        onEliminar={manejarEliminar}
      />
    </>
  );
}
