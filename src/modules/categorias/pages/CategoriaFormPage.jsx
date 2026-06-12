import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CategoriaForm from "./CategoriaForm.jsx";
import CategoriaProductosTable from "./CategoriaProductosTable.jsx";
import { obtenerProductos } from "../../productos/services/productos.js";
import "./CategoriaPage.css";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  const visitados = new Set();

  const buscarLista = (valor, nivel = 0) => {
    if (Array.isArray(valor)) return valor;
    if (!valor || typeof valor !== "object" || nivel > 4 || visitados.has(valor)) return null;

    visitados.add(valor);

    const clavesPreferidas = ["content", "data", "items", "results", "productos", "lista", "rows", "payload"];
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

export default function CategoriaFormPage() {
  const { id } = useParams(); // si existe, estamos editando
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState("");

  useEffect(() => {
    if (!esEdicion || !id) return undefined;

    let cancelado = false;

    const cargarProductos = async () => {
      try {
        setLoadingProductos(true);
        setErrorProductos("");

        const data = await obtenerProductos();
        if (cancelado) return;

        setProductos(getLista(data));
      } catch (error) {
        if (cancelado) return;

        console.error("Error cargando productos de la categoria:", error);
        setProductos([]);
        setErrorProductos("No se pudieron cargar los productos de esta categoria.");
      } finally {
        if (!cancelado) setLoadingProductos(false);
      }
    };

    cargarProductos();

    return () => {
      cancelado = true;
    };
  }, [esEdicion, id]);

  const productosCategoria = useMemo(() => {
    const categoriaNumerica = Number(id);
    if (!Number.isFinite(categoriaNumerica)) return [];

    return productos.filter((producto) => Number(producto?.nivelId) === categoriaNumerica);
  }, [id, productos]);

  return (
    <div className="container mt-4 categorias-page-shell">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Categoría" : "Nueva Categoría"}</h3>

        <button className="btn btn-outline-secondary" onClick={() => navigate("/categorias")}>
          Volver
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="card mb-4 categorias-table-card">
        <div className="card-body">
          {/* Reutilizamos el MISMO form */}
          <CategoriaForm categoriaId={id} />
        </div>
      </div>

      {esEdicion && (
        <div className="card mt-4 categorias-table-card">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 className="mb-1">Productos de esta categoría</h5>
                <div className="text-muted">
                  Productos cuyo nivel coincide con esta categoría.
                </div>
              </div>

              <span className="badge text-bg-secondary">
                {loadingProductos ? "Cargando..." : `${productosCategoria.length} productos`}
              </span>
            </div>

            {errorProductos && <div className="alert alert-danger mb-3">{errorProductos}</div>}

            <CategoriaProductosTable
              data={productosCategoria}
              loading={loadingProductos}
              onVer={(producto) => navigate(`/productos/${producto.id}/ver`)}
              onEditar={(producto) => navigate(`/productos/${producto.id}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
