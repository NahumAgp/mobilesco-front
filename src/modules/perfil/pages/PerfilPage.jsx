import { useEffect, useState } from "react";
import { getCurrentUser } from "../../auth/services/authService";
import "./PerfilPage.css";
import { eliminarFotoPerfil, subirFotoPerfil } from "../../empleados/services/empleados";
import { API_BASE_URL } from "../../../config/apiConfig";

export default function PerfilPage() {

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);

  const iniciales = `${perfil?.nombre?.trim()?.charAt(0) || ""}${perfil?.apellidoPaterno?.trim()?.charAt(0) || ""}`.toUpperCase() || "U";

  const cargarPerfil = async () => {
    try {
      setError("");
      const data = await getCurrentUser();
      setPerfil(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (err) {
      console.error("Error cargando perfil:", err);
      setError(err.message || "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();

    const handleUserUpdated = () => {
      cargarPerfil();
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, []);

  const handleFotoChange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    try {

      setSubiendoFoto(true);
      await subirFotoPerfil(file);
      await cargarPerfil();
      window.dispatchEvent(new Event("userUpdated"));

    } catch (error) {

      console.error("Error subiendo foto:", error);
      setError(error.message || "No se pudo subir la foto");

    } finally {
      setSubiendoFoto(false);
      e.target.value = "";
    }

  };

  const handleEliminarFoto = async () => {
    if (!perfil?.fotoUrl) return;

    try {
      setEliminandoFoto(true);
      setError("");
      await eliminarFotoPerfil();
      await cargarPerfil();
      window.dispatchEvent(new Event("userUpdated"));
    } catch (error) {
      console.error("Error eliminando foto:", error);
      setError(error.message || "No se pudo eliminar la foto");
    } finally {
      setEliminandoFoto(false);
    }
  };

  return (

    <div className="perfil-container">

      <div className="perfil-card">

        {loading && (
          <div className="perfil-loading">Cargando perfil...</div>
        )}

        {error && (
          <div className="alert alert-danger m-3">{error}</div>
        )}

        <div className="perfil-header" />

        {/* AVATAR */}
        <div className="perfil-avatar-wrapper">

  {perfil?.fotoUrl ? (

    <img
      src={`${API_BASE_URL}${perfil.fotoUrl}`}
      className="perfil-avatar"
      alt="perfil"
    />

  ) : (

    <div className="perfil-avatar placeholder">
        {iniciales}
        </div>

    )}

    <label className="perfil-avatar-upload">

        <input
        type="file"
        accept="image/*"
        hidden
        onChange={handleFotoChange}
        disabled={subiendoFoto || eliminandoFoto}
        />

        {subiendoFoto ? "..." : "+"}

    </label>

    {perfil?.fotoUrl && (
      <button
        type="button"
        className="perfil-avatar-delete"
        onClick={handleEliminarFoto}
        disabled={eliminandoFoto || subiendoFoto}
        title="Eliminar foto"
      >
        <i className="bi bi-trash" />
      </button>
    )}

    </div>

        <div className="perfil-nombre">

          {perfil?.nombre} {perfil?.apellidoPaterno}

        </div>

        <div className="perfil-correo">
          {perfil?.correo}
        </div>

        {/* DATOS */}

        <div className="perfil-info">

          <div className="perfil-field">
            <label>Nombre</label>
            <input value={perfil?.nombre || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Apellido paterno</label>
            <input value={perfil?.apellidoPaterno || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Apellido materno</label>
            <input value={perfil?.apellidoMaterno || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Correo</label>
            <input value={perfil?.correo || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Teléfono</label>
            <input value={perfil?.telefono || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Rol</label>
            <input value={perfil?.roles?.[0] || ""} disabled />
          </div>

        </div>

      </div>

    </div>

  );

}
