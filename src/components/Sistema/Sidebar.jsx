import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { logout, getUser } from "../../modules/auth/services/authService";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiConfig";

export default function Sidebar() {

  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [failedFoto, setFailedFoto] = useState(null);

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const nombre = user?.nombre || "";
  const apellido = user?.apellidoPaterno || "";

  const rolMap = {
    ADMIN: "Dev / Admin",
    DIRECTOR_GENERAL: "Director General",
    SUBDIRECCION_ADMINISTRATIVA: "Subdirección Administrativa",
    ASISTENTE_GERENCIAL: "Asistente Gerencial",
    SUPERVISOR_PRODUCCION: "Supervisor de Producción",
    JEFE_HERRERIA: "Jefe de Herrería",
    JEFE_CARPINTERIA: "Jefe de Carpintería",
    JEFE_ARMADO: "Jefe de Armado",
    JEFE_ALMACEN: "Jefe de Almacén",
    JEFE_LOGISTICA: "Jefe de Logística",
    TECNICO: "Técnico",
    AYUDANTE_GENERAL: "Ayudante General",
    EMPLOYEE: "Empleado"
  };

  const rol = rolMap[user?.roles?.[0]] || user?.roles?.[0] || "";
  const puedeGestionarUsuarios = user?.roles?.some(
    (r) => r === "ADMIN" || r === "DIRECTOR_GENERAL" || r === "SUBDIRECCION_ADMINISTRATIVA"
  );

  const foto = user?.fotoUrl
    ? `${API_BASE_URL}${user.fotoUrl}`
    : null;
  const iniciales = `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase() || "U";
  const mostrarFoto = foto && failedFoto !== foto;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn("Error logout:", error);
    }
    navigate("/login");
  };

  useEffect(() => {
    const updateUser = () => {
      setUser(getUser());
      setFailedFoto(null);
    };

    window.addEventListener("userUpdated", updateUser);
    return () => window.removeEventListener("userUpdated", updateUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="app-sidebar">

      {/* PERFIL */}
      <div ref={menuRef} className="sidebar-profile">

        <div
          onClick={() => setOpenMenu(!openMenu)}
          className="sidebar-profile-button"
        >
          <div className="sidebar-profile-avatar">
            {mostrarFoto ? (
              <img
                src={foto}
                alt="perfil"
                onError={() => setFailedFoto(foto)}
              />
            ) : (
              <span>{iniciales}</span>
            )}
          </div>

          <div className="sidebar-profile-text">
            <strong>{nombre} {apellido}</strong>
            <div>{rol}</div>
          </div>
        </div>

        {/* DROPDOWN */}
        {openMenu && (
          <div className="sidebar-user-menu">
            <button
              onClick={() => navigate("/perfil")}
            >
              <i className="bi bi-person me-2"></i>
              Perfil
            </button>

            <button
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* MENÚ */}
      <nav className="sidebar-menu-list">

        <NavLink to="/tablero" className="sidebar-link">
          <i className="bi bi-speedometer2 me-2"></i>
          Tablero
        </NavLink>

        {puedeGestionarUsuarios && (
          <NavLink to="/usuarios/accesos" className="sidebar-link">
            <i className="bi bi-shield-check me-2"></i>
            Usuarios y accesos
          </NavLink>
        )}

        {/* EMPLEADOS */}
        <NavLink to="/empleados" className="sidebar-link">
          <i className="bi bi-people me-2"></i>
          Empleados
        </NavLink>

        {/* PROVEEDORES */}
        <NavLink to="/proveedores" className="sidebar-link">
          <i className="bi bi-truck me-2"></i>
          Proveedores
        </NavLink>

        {/* PRODUCTOS */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuProductoS">
            <div className="sidebar-parent-content">
              <i className="bi bi-box-seam me-2"></i>
              <span>Productos</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>

          <div className="collapse sidebar-submenu" id="menuProductoS">

            <NavLink to="/lineas-producto" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-collection me-2"></i>
              Lineas
            </NavLink>

            <NavLink to="/familias" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-diagram-3 me-2"></i>
              Familias
            </NavLink>

            <NavLink to="/modelos" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-boxes me-2"></i>
              Modelos
            </NavLink>

            <NavLink to="/categorias" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-tag me-2"></i>
              Categoria
            </NavLink>

            <NavLink to="/materiales" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-layers me-2"></i>
              Materiales
            </NavLink>

            <NavLink to="/colores" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-palette me-2"></i>
              Colores
            </NavLink>

            <NavLink to="/productos" className="sidebar-link">
              <i className="bi bi-box-seam me-2"></i>
              Productos
            </NavLink>

            <NavLink to="/productos/catalogo" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-images me-2"></i>
              Catalogo visual
            </NavLink>

          </div>
        </div>

        {/* INSUMOS */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuInsumos">
            <div className="sidebar-parent-content">
              <i className="bi bi-boxes me-2"></i>
              <span>Insumos</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>
          <div className="collapse sidebar-submenu" id="menuInsumos">
            <NavLink to="/insumos" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-boxes me-2"></i>
              Insumos
            </NavLink>

            <NavLink to="/salidas-insumos" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-box-arrow-right me-2"></i>
              Salidas
            </NavLink>

            <NavLink to="/unidades-medida" className="sidebar-link sidebar-link--sub">
              <i className="bi bi-aspect-ratio me-2"></i>
              Unidad Medida
            </NavLink>
          </div>
        </div>

        {/* Centros de Trabajo */}
        <NavLink to="/centros-trabajo" className="sidebar-link">
          <i className="bi bi-building me-2"></i>
          Centros de Trabajo
        </NavLink>

        {/* OPERACIONES */}
        <NavLink to="/operaciones" className="sidebar-link">
          <i className="bi bi-gear me-2"></i>
          Operaciones
        </NavLink>

        <NavLink to="/cif" className="sidebar-link">
          <i className="bi bi-diagram-3 me-2"></i>
          CIF
        </NavLink>

        {/* Compras */}
        <NavLink to="/compras" className="sidebar-link">
          <i className="bi bi-cart-check me-2"></i>
          Compras
        </NavLink>

        {/* KARDEX */}
        <NavLink to="/kardex" className="sidebar-link">
          <i className="bi bi-journal-text me-2"></i>
          kardex
        </NavLink>

        {/* Cotizaciones */}
        <NavLink to="/cotizaciones" className="sidebar-link">
          <i className="bi bi-file-earmark-text me-2"></i>
          Cotizaciones
        </NavLink>

      </nav>
    </aside>
  );
}
