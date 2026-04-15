// pages/Productos/ProductoFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import ProductoForm from "./ProductoForm.jsx"; 

export default function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Producto" : "Nuevo Producto"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/productos")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>

      <ProductoForm productoId={id} />
    </div>
  );
}