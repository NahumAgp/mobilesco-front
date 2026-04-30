// ============================================
// RUTA: src/pages/Variantes/VarianteFormPage.jsx
// ============================================
import { useParams, useNavigate } from "react-router-dom";
import VarianteForm from "./VarianteForm.jsx";

export default function VarianteFormPage({ returnPath = "/productos" }) {

  const { id } = useParams();
  const navigate = useNavigate();

  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">
          {esEdicion ? "Editar Producto" : "Nuevo Producto"}
        </h3>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(returnPath)}
        >
          Volver
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <VarianteForm productoId={id} returnPath={returnPath} />
        </div>
      </div>
    </div>
  );
}
