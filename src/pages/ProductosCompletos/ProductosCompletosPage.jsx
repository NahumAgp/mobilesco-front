import { useEffect, useState } from "react";
import ProductoWizard from "./components/ProductoWizard";
import ProductosTable from "./components/ProductosTable";
import { crearModelo } from "../../services/modelos";
import { crearVariante } from "../../services/variantes";
import { crearImagen, subirImagenArchivo } from "../../services/imagenes";

export default function ProductosCompletosPage() {
  const [modoCreacion, setModoCreacion] = useState(false);
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");

  useEffect(() => {
    // Limpiar cache legado del modulo cuando existia en modo local.
    localStorage.removeItem("productos_completos_cache");
    localStorage.removeItem("productos_prueba");
    setProductos([]);
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

  const handleSaveComplete = async (nuevoProducto) => {
    const modeloPayload = {
      codigo: nuevoProducto?.modelo?.codigo?.trim() || "",
      nombre: nuevoProducto?.modelo?.nombre?.trim() || "",
      descripcion: nuevoProducto?.modelo?.descripcion?.trim() || "",
      familia_id: Number(nuevoProducto?.modelo?.familiaId),
      activo: Boolean(nuevoProducto?.modelo?.activo)
    };

    try {
      const modeloGuardado = await crearModelo(modeloPayload);
      const modeloId = obtenerIdModelo(modeloGuardado);

      if (!modeloId) {
        throw new Error("Se creo el modelo, pero no se recibio su ID para guardar variantes.");
      }

      const variantes = Array.isArray(nuevoProducto?.variantes) ? nuevoProducto.variantes : [];
      const { modelo: imagenModelo, variantes: imagenesPorVariante } = normalizarImagenes(
        nuevoProducto?.imagenes
      );

      const variantesGuardadas = [];
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
        variantesGuardadas.push(varianteGuardada);

        const varianteIdBd = obtenerIdVariante(varianteGuardada);
        if (!varianteIdBd) {
          throw new Error(`No se recibio ID de la variante ${variante?.sku || ""}.`);
        }

        mapaVariantes.set(String(variante.id), Number(varianteIdBd));
      }

      const imagenesGuardadas = [];
      for (const variante of variantes) {
        const varianteIdBd = mapaVariantes.get(String(variante.id));
        if (!varianteIdBd) continue;

        const listaImagenes = Array.isArray(imagenesPorVariante?.[String(variante.id)])
          ? imagenesPorVariante[String(variante.id)]
          : [];

        for (let idx = 0; idx < listaImagenes.length; idx += 1) {
          const imagen = listaImagenes[idx];
          const imagenGuardada = await guardarImagenVariante({
            imagen,
            varianteId: varianteIdBd,
            esPrincipal: Boolean(imagen?.principal),
            orden: idx + 1,
            altTexto: imagen?.nombre || `Imagen ${idx + 1}`
          });

          if (!imagenGuardada) continue;
          imagenesGuardadas.push(imagenGuardada);
        }
      }

      if (imagenModelo?.origen !== "variante" && imagenModelo && variantes.length > 0) {
        const primeraVarianteLocal = variantes[0];
        const primeraVarianteBd = mapaVariantes.get(String(primeraVarianteLocal.id));

        if (primeraVarianteBd) {
          const listaPrimera = Array.isArray(imagenesPorVariante?.[String(primeraVarianteLocal.id)])
            ? imagenesPorVariante[String(primeraVarianteLocal.id)]
            : [];

          const portadaGuardada = await guardarImagenVariante({
            imagen: imagenModelo,
            varianteId: primeraVarianteBd,
            esPrincipal: listaPrimera.length === 0,
            orden: listaPrimera.length + 1,
            altTexto: imagenModelo?.nombre || "Portada del modelo"
          });

          if (portadaGuardada) {
            imagenesGuardadas.push(portadaGuardada);
          }
        }
      }

      const registroLocal = {
        ...nuevoProducto,
        modelo: {
          ...nuevoProducto.modelo,
          id: modeloId
        },
        variantesApi: variantesGuardadas,
        imagenesApi: imagenesGuardadas
      };

      const nuevosProductos = [...productos, registroLocal];
      setProductos(nuevosProductos);
      setTipoMensaje("success");
      setMensaje(
        "Producto guardado en BD (modelo, variantes e imagenes)."
      );
      setModoCreacion(false);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error?.message || "No se pudo guardar el producto en la base de datos.");
      throw error;
    }
  };

  if (modoCreacion) {
    return (
      <ProductoWizard onComplete={handleSaveComplete} onCancel={() => setModoCreacion(false)} />
    );
  }

  return (
    <div className="container py-4">
      {mensaje && (
        <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">
          {mensaje}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary">Productos Completos</h2>
          <p className="text-muted mb-0">Alta unificada de modelo, variantes e imagenes</p>
        </div>

        <button className="btn btn-primary" onClick={() => setModoCreacion(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Producto
        </button>
      </div>

      <ProductosTable data={productos} />
    </div>
  );
}
