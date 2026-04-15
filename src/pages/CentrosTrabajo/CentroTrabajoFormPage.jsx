import { useParams, useNavigate } from "react-router-dom";
import CentroTrabajoForm from "./CentroTrabajoForm.jsx";

export default function CentroTrabajoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Centro de Trabajo" : "Nuevo Centro de Trabajo"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/centros-trabajo")}>
          Volver
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <CentroTrabajoForm centroId={id} />
        </div>
      </div>
    </div>
  );
}