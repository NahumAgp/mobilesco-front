// pages/Materiales/MaterialFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import MaterialForm from "./MaterialForm.jsx";

export default function MaterialFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Material" : "Nuevo Material"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/materiales")}>
          Volver
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <MaterialForm materialId={id} />
        </div>
      </div>
    </div>
  );
}