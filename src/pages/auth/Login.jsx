import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { login, getCurrentUser, isAuthenticated } from "../../services/authService";

export default function Login() {

  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (isAuthenticated()) {
      navigate("/tablero");
    }

  }, []);

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

    <div className="container d-flex align-items-center justify-content-center min-vh-100">

      <div className="card shadow" style={{ width: "400px" }}>

        <div className="card-body p-5">

          <h2 className="text-center mb-4">Iniciar sesión</h2>

          <form onSubmit={handleSubmit}>

            <div className="mb-3">

              <label className="form-label">Correo</label>

              <input
                type="email"
                name="email"
                className="form-control"
                value={credentials.email}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </div>

            <div className="mb-3">

              <label className="form-label">Contraseña</label>

              <input
                type="password"
                name="password"
                className="form-control"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </div>

            {error && (
              <div className="alert alert-danger py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100"
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

          </form>

        </div>

      </div>

    </div>

  );

}