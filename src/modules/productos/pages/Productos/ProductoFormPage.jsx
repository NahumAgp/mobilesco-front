// pages/Productos/ProductoFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import ProductoForm from "./ProductoForm.jsx"; 
import ProductoCostosPanel from "./ProductoCostosPanel.jsx";
import { eliminarProductoDefinitivo } from "../../services/productos.js";
import { getUser, hasPermission } from "../../../auth/services/authService.js";
import "./ProductoForm.css";

export default function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const user = getUser();
  const puedeEliminarDefinitivo = hasPermission(user, "ACTION_PRODUCTS_DELETE");

  const manejarEliminarDefinitivo = async () => {
    if (!esEdicion || !puedeEliminarDefinitivo) return;

    const confirmacion = window.confirm(
      "Eliminar definitivamente este producto? Se borrarán también sus imágenes, insumos y operaciones asociadas."
    );
    if (!confirmacion) return;

    try {
      await eliminarProductoDefinitivo(id);
      navigate("/productos", { replace: true });
    } catch (error) {
      alert(error.message || "No se pudo eliminar definitivamente el producto.");
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Producto" : "Nuevo Producto"}</h3>
        <div className="d-flex gap-2">
          <button className="btn producto-form-outline" onClick={() => navigate("/productos")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>

      <ProductoForm
        productoId={id}
        costSummary={esEdicion ? <ProductoCostosPanel productoId={id} embedded summaryOnly /> : null}
        costDetails={esEdicion ? <ProductoCostosPanel productoId={id} embedded detailsOnly /> : null}
        canEliminarDefinitivo={puedeEliminarDefinitivo}
        onEliminarDefinitivo={manejarEliminarDefinitivo}
      />
    </div>
  );
}
