import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerWithInvitation } from "../../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    token: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerWithInvitation({
        token: form.token,
        email: form.email,
        password: form.password
      });

      setSuccess(response?.mensaje || "Registro creado y activado correctamente.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "No se pudo registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: "radial-gradient(circle at top, #e7fff6 0%, #f7fafc 45%, #edf7f2 100%)"
      }}
    >
      <div className="card shadow-lg border-0" style={{ width: "100%", maxWidth: 460 }}>
        <div className="card-body p-4 p-md-5">
          <div className="mb-4">
            <div className="text-uppercase text-success fw-bold small mb-2">Registro por invitación</div>
            <h2 className="fw-bold mb-2">Crear cuenta</h2>
            <p className="text-muted mb-0">Usa el token que te compartieron para activar tu acceso.</p>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label">Token de invitación</label>
              <input
                type="text"
                name="token"
                className="form-control"
                value={form.token}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="form-label">Correo</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="form-label">Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}
            {success && <div className="alert alert-success py-2 mb-0">{success}</div>}

            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? "Registrando..." : "Registrar cuenta"}
            </button>

            <button type="button" className="btn btn-link text-decoration-none" onClick={() => navigate("/login")}>
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
