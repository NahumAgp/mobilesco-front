import { useParams, useNavigate } from "react-router-dom";
import OperacionForm from "./OperacionForm.jsx";

export default function OperacionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Operación" : "Nueva Operación"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/operaciones")}>
          Volver
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <OperacionForm operacionId={id} />
        </div>
      </div>
    </div>
  );
}