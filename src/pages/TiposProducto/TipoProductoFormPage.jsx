// pages/TiposProducto/TipoProductoFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import TipoProductoForm from "./TipoProductoForm.jsx";

export default function TipoProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Tipo de Producto" : "Nuevo Tipo de Producto"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/tipos-producto")}>
          Volver
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <TipoProductoForm tipoId={id} />
        </div>
      </div>

      {esEdicion && (
        <div className="card">
          <div className="card-body">
            <h5 className="mb-2">Productos de este tipo</h5>
            <div className="text-muted">
              (Pendiente) Aquí irá la tabla de productos de este tipo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}