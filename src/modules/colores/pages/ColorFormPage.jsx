import { useParams, useNavigate } from "react-router-dom";
import ColorForm from "./ColorForm.jsx";
import "./ColorPage.css";

export default function ColorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4 colores-page-shell">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Color" : "Nuevo Color"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/colores")}>
          Volver
        </button>
      </div>

      <div className="card mb-4 colores-table-card">
        <div className="card-body">
          <ColorForm colorId={id} />
        </div>
      </div>
    </div>
  );
}
