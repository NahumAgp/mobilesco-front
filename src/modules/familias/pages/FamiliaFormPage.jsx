import { useParams, useNavigate } from "react-router-dom";
import FamiliaForm from "./FamiliaForm.jsx";

export default function FamiliaFormPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">

      <div className="d-flex align-items-center justify-content-between mb-3">

        <h3 className="m-0">
          {esEdicion ? "Editar Familia" : "Nueva Familia"}
        </h3>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/familias")}
        >
          Volver
        </button>

      </div>

      <div className="card">
        <div className="card-body">
          <FamiliaForm familiaId={id} />
        </div>
      </div>

    </div>
  );
}