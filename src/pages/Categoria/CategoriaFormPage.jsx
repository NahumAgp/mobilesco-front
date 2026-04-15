import { useParams, useNavigate } from "react-router-dom";
import CategoriaForm from "./CategoriaForm.jsx";

export default function CategoriaFormPage() {
  const { id } = useParams(); // si existe, estamos editando
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Categoría" : "Nueva Categoría"}</h3>

        <button className="btn btn-outline-secondary" onClick={() => navigate("/categorias")}>
          Volver
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="card mb-4">
        <div className="card-body">
          {/* Reutilizamos el MISMO form */}
          <CategoriaForm categoriaId={id} />
        </div>
      </div>

      {/* PRODUCTOS (solo dejamos el espacio por ahora) */}
      {esEdicion && (
        <div className="card">
          <div className="card-body">
            <h5 className="mb-2">Productos de esta categoría</h5>
            <div className="text-muted">
              (Pendiente) Aquí irá la tabla de productos de esta categoría.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}