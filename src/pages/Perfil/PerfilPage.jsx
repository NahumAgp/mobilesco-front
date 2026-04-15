import { useState } from "react";
import { getUser } from "../../services/authService";
import "./PerfilPage.css";
import { subirFotoPerfil } from "../../services/empleados";

export default function PerfilPage() {

  const user = getUser();

  const [fotoPreview, setFotoPreview] = useState(
    user?.fotoUrl ? `http://localhost:8081${user.fotoUrl}` : null
  );

  const handleFotoChange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setFotoPreview(preview);

    try {

      const response = await subirFotoPerfil(file);

      const user = JSON.parse(localStorage.getItem("user"));

      user.fotoUrl = response.fotoUrl;

      localStorage.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("userUpdated"));

    } catch (error) {

      console.error("Error subiendo foto:", error);

    }

  };

  return (

    <div className="perfil-container">

      <div className="perfil-card">

        <div className="perfil-header" />

        {/* AVATAR */}
        <div className="perfil-avatar-wrapper">

  {fotoPreview ? (

    <img
      src={fotoPreview}
      className="perfil-avatar"
      alt="perfil"
    />

  ) : (

    <div className="perfil-avatar placeholder">
        {user?.nombre?.charAt(0)}
        {user?.apellidoPaterno?.charAt(0)}
        </div>

    )}

    <label className="perfil-avatar-upload">

        <input
        type="file"
        accept="image/*"
        hidden
        onChange={handleFotoChange}
        />

        +

    </label>

    </div>

        <div className="perfil-nombre">

          {user?.nombre} {user?.apellidoPaterno}

        </div>

        <div className="perfil-correo">
          {user?.correo}
        </div>

        {/* DATOS */}

        <div className="perfil-info">

          <div className="perfil-field">
            <label>Nombre</label>
            <input value={user?.nombre || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Apellido paterno</label>
            <input value={user?.apellidoPaterno || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Apellido materno</label>
            <input value={user?.apellidoMaterno || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Correo</label>
            <input value={user?.correo || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Teléfono</label>
            <input value={user?.telefono || ""} disabled />
          </div>

          <div className="perfil-field">
            <label>Rol</label>
            <input value={user?.roles?.[0] || ""} disabled />
          </div>

        </div>

      </div>

    </div>

  );

}