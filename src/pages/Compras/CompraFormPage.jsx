import { useParams, useNavigate } from "react-router-dom";
import CompraForm from "./CompraForm.jsx";

export default function CompraFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Compra" : "Nueva Compra"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>

      <CompraForm compraId={id} />
    </div>
  );
}