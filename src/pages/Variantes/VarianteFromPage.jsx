// ============================================
// RUTA: src/pages/Variantes/VarianteFormPage.jsx
// ============================================
import { useParams, useNavigate } from "react-router-dom";
import VarianteForm from "./VarianteForm.jsx";

export default function VarianteFormPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">
          {esEdicion ? "Editar Variante" : "Nueva Variante"}
        </h3>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/variantes")}
        >
          Volver
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <VarianteForm varianteId={id} />
        </div>
      </div>
    </div>
  );
}