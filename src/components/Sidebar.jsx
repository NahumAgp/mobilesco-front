import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside style={{ width: 260, padding: 16, background: "#244b47", color: "#fff" }}>
      {/* Perfil */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#1b7f72",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {/* Icono */}
          <i className="bi bi-person-fill"></i>
        </div>

        <div>
          <strong>Mobilesco ERP</strong>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Administrador</div>
        </div>
      </div>

      {/* Menú */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <NavLink
          to="/tablero"
          style={({ isActive }) => ({
            color: "#fff",
            textDecoration: "none",
            padding: "10px 12px",
            borderRadius: 10,
            background: isActive ? "#1b7f72" : "transparent",
          })}
        >
          Tablero
        </NavLink>

        <NavLink
          to="/productos"
          style={({ isActive }) => ({
            color: "#fff",
            textDecoration: "none",
            padding: "10px 12px",
            borderRadius: 10,
            background: isActive ? "#1b7f72" : "transparent",
          })}
        >
          Productos
        </NavLink>

        <NavLink
          to="/proveedores"
          style={({ isActive }) => ({
            color: "#fff",
            textDecoration: "none",
            padding: "10px 12px",
            borderRadius: 10,
            background: isActive ? "#1b7f72" : "transparent",
          })}
        >
          Proveedores
        </NavLink>
      </nav>
    </aside>
  );
}
