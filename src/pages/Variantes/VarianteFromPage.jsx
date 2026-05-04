import { useNavigate } from "react-router-dom";
import ProductoForm from "../Productos/ProductoForm.jsx";

export default function ProductoFormPage({ returnPath = "/productos" }) {
  const navigate = useNavigate();

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">Editar Producto</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate(returnPath)}>
          Volver
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <ProductoForm returnPath={returnPath} />
        </div>
      </div>
    </div>
  );
}
