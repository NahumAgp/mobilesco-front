import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { login, getCurrentUser, isAuthenticated } from "../services/authService";
import "./Login.css";

export default function Login() {

  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {

    if (isAuthenticated()) {
      navigate("/tablero");
    }

  }, [navigate]);

  const handleChange = (e) => {

    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const response = await login(credentials);

      if (!response?.accessToken) {
        throw new Error("Token no recibido");
      }


      const user = await getCurrentUser();

      localStorage.setItem("user", JSON.stringify(user));

      navigate("/tablero");

    } catch (err) {

      console.error("Error login:", err);

      setError(
        err.message || "Credenciales incorrectas o error de conexión"
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-form-panel">
          <div className="login-brand">
            <img src="/logo-mobilesco-firmeza.svg" alt="Mobilesco" />
          </div>

          <div className="login-kicker">Mobilesco ERP</div>
          <h1 className="login-title">Iniciar sesión</h1>

          <div className="login-card">
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="login-email">Correo</label>
                <div className="login-input-wrap">
                  <i className="bi bi-envelope login-input-icon"></i>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    className="login-input"
                    placeholder="nombre@mobilesco.com"
                    value={credentials.email}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Contraseña</label>
                <div className="login-password-row">
                  <div className="login-input-wrap">
                    <i className="bi bi-lock login-input-icon"></i>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="login-input"
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    className="login-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={loading}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              {error && <div className="login-message">{error}</div>}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>

              <button
                type="button"
                className="login-link"
                onClick={() => navigate("/registro")}
                disabled={loading}
              >
                Tengo una invitación
              </button>

              <div className="login-footer">
                <span>Administración centralizada</span>
                <span>Seguridad y trazabilidad</span>
              </div>
            </form>
          </div>
        </section>

        <aside className="login-visual-panel" aria-hidden="true">
          <div className="login-visual-content">
            <div className="login-visual-top">
              <i className="bi bi-headset me-2"></i>
              Support
            </div>

            <div className="login-feature-card">
              <h3>Controla tu operación con una sola plataforma</h3>
              <p>
                Inventario, costos, producción y compras en una vista clara, consistente y alineada con la marca Mobilesco.
              </p>
              <button type="button" className="login-feature-button">
                Conocer más
              </button>
            </div>

            <div className="login-hero-accent"></div>
          </div>
        </aside>
      </div>
    </div>

  );

}
