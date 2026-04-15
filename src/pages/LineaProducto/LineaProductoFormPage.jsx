import { useParams, useNavigate } from "react-router-dom";
import LineaProductoForm from "./LineaProductoForm.jsx";

export default function LineaProductoFormPage() {
  const { id } = useParams(); // si existe, estamos editando
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Línea de Producto" : "Nueva Línea de Producto"}</h3>

        <button className="btn btn-outline-secondary" onClick={() => navigate("/lineas-producto")}>
          Volver
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="card mb-4">
        <div className="card-body">
          {/* Reutilizamos el MISMO form */}
          <LineaProductoForm lineaProductoId={id} />
        </div>
      </div>

      {/* PRODUCTOS (solo dejamos el espacio por ahora) */}
      {esEdicion && (
        <div className="card">
          <div className="card-body">
            <h5 className="mb-2">Productos de esta línea</h5>
            <div className="text-muted">
              (Pendiente) Aquí irá la tabla de productos de esta línea.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}