// pages/TiposProducto/TipoProductoFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import ModelosForm from "./ModelosForm.jsx";

export default function ModelosFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Modelo" : "Nuevo Modelo"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/modelos")}>
          Volver
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <ModelosForm modeloId={id} />
        </div>
      </div>

      {esEdicion && (
        <div className="card">
          <div className="card-body">
            <h5 className="mb-2">Productos de este modelo</h5>
            <div className="text-muted">
              (Pendiente) Aquí irá la tabla de productos de este modelo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}