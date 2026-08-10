import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 620 }}>
        <div className="card-body text-center p-5">
          <i className="bi bi-shield-lock fs-1 text-warning" aria-hidden="true" />
          <h1 className="h4 mt-3">Sin permiso para esta vista</h1>
          <p className="text-muted">Tu cuenta está activa, pero el rol asignado no permite abrir esta página.</p>
          <Link className="btn btn-success" to="/tablero">Volver al tablero</Link>
        </div>
      </div>
    </div>
  );
}
