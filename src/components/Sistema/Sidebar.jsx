import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { logout, getUser, hasPermission } from "../../modules/auth/services/authService";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiConfig";
import { contarNotificacionesNoLeidas } from "../../modules/notificaciones/services/notificaciones";
import ProtectedImage from "../ui/ProtectedImage";

function LinkItem({ to, label, icon, sub = false, onClick }) {
  return (
    <NavLink to={to} className={`sidebar-link${sub ? " sidebar-link--sub" : ""}`} onClick={onClick} title={label} aria-label={label}>
      <i className={`bi ${icon} me-2`}></i>
      {label}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, toggleSidebar, closeSidebar }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [failedFoto, setFailedFoto] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const menuRef = useRef(null);

  const handleNavigation = () => {
    setOpenSubmenu(null);
    setOpenMenu(false);
    if (isMobile && isOpen) {
      closeSidebar();
    }
  };

  const toggleSubmenu = (submenu) => {
    setOpenMenu(false);
    setOpenSubmenu((current) => (current === submenu ? null : submenu));
  };

  const handleSidebarToggle = () => {
    handleNavigation();
    toggleSidebar();
  };

  const getTooltipProps = (label) => ({
    title: label,
    "aria-label": label
  });

  const can = (permission) => hasPermission(user, permission);
  const nombre = user?.nombre || "";
  const apellido = user?.apellidoPaterno || "";
  const roles = user?.roles || [];

  const rolMap = {
    ADMIN: "Dev / Admin",
    SUPER_ADMIN: "Super Admin",
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

  const rol = rolMap[roles[0]] || roles[0] || "";
  const puedeGestionarUsuarios = can("VIEW_USERS");

  const foto = user?.fotoUrl ? `${API_BASE_URL}${user.fotoUrl}` : null;
  const iniciales = `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase() || "U";
  const mostrarFoto = foto && failedFoto !== foto;
  const showProductos = ["VIEW_PRODUCTS", "VIEW_PRODUCT_CATALOG", "VIEW_PRODUCT_QUALITY", "VIEW_PRODUCT_LINES", "VIEW_FAMILIES", "VIEW_SUBFAMILIES", "VIEW_MODELS", "VIEW_MATERIALS", "VIEW_COLORS"].some(can);
  const showAlmacen = ["VIEW_INVENTORY", "VIEW_INPUT_TYPES", "VIEW_MEASURE_UNITS", "VIEW_INVENTORY_OUTPUTS", "VIEW_WAREHOUSE_REQUISITIONS", "VIEW_WAREHOUSE_RECEIPTS"].some(can);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn("Error logout:", error);
    }
    navigate("/login");
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

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

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const data = await contarNotificacionesNoLeidas();
        setNotificacionesNoLeidas(data.noLeidas || 0);
      } catch {
        setNotificacionesNoLeidas(0);
      }
    };

    cargarNotificaciones();
    const timer = window.setInterval(cargarNotificaciones, 60000);
    window.addEventListener("notificaciones:actualizar", cargarNotificaciones);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("notificaciones:actualizar", cargarNotificaciones);
    };
  }, []);

  return (
    <aside
      id="app-sidebar"
      className={`app-sidebar ${isOpen ? "" : "app-sidebar--compact"}`}
      aria-label="Navegación principal"
      aria-hidden={isMobile && !isOpen ? "true" : undefined}
      inert={isMobile && !isOpen}
    >

      {/* MARCA */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">M</div>
        <div className="sidebar-brand-name">Mobilesco</div>
      </div>

      {/* MENÚ */}
      <nav className="sidebar-menu-list">
        {can("VIEW_DASHBOARD") && <LinkItem to="/tablero" label="Tablero" icon="bi-speedometer2" onClick={handleNavigation} />}

        {puedeGestionarUsuarios && <LinkItem to="/usuarios/accesos" label="Usuarios y accesos" icon="bi-shield-check" onClick={handleNavigation} />}
        {can("VIEW_EMPLOYEES") && <LinkItem to="/empleados" label="Empleados" icon="bi-people" onClick={handleNavigation} />}
        {can("VIEW_WORK_AREAS") && <LinkItem to="/areas-trabajo" label="Areas de trabajo" icon="bi-diagram-3" onClick={handleNavigation} />}
        {can("VIEW_SUPPLIERS") && <LinkItem to="/proveedores" label="Proveedores" icon="bi-truck" onClick={handleNavigation} />}

        {showProductos && (
          <div>
            <button
              type="button"
              className={`sidebar-parent ${openSubmenu === "productos" ? "" : "collapsed"}`}
              onClick={() => toggleSubmenu("productos")}
              aria-expanded={openSubmenu === "productos"}
              aria-controls="menuProductos"
              {...getTooltipProps("Productos")}
            >
              <div className="sidebar-parent-content">
                <i className="bi bi-box-seam me-2"></i>
                <span>Productos</span>
              </div>
              <i className="bi bi-chevron-down sidebar-chevron"></i>
            </button>

            <div className={`collapse sidebar-submenu ${openSubmenu === "productos" ? "show" : ""}`} id="menuProductos">
              {can("VIEW_PRODUCT_LINES") && <LinkItem to="/lineas-producto" label="Lineas" icon="bi-collection" sub onClick={handleNavigation} />}
              {can("VIEW_FAMILIES") && <LinkItem to="/familias" label="Familias" icon="bi-diagram-3" sub onClick={handleNavigation} />}
              {can("VIEW_SUBFAMILIES") && <LinkItem to="/subfamilias" label="Subfamilias" icon="bi-diagram-2" sub onClick={handleNavigation} />}
              {can("VIEW_MODELS") && <LinkItem to="/modelos" label="Modelos" icon="bi-boxes" sub onClick={handleNavigation} />}
              {can("VIEW_MATERIALS") && <LinkItem to="/materiales" label="Materiales" icon="bi-layers" sub onClick={handleNavigation} />}
              {can("VIEW_COLORS") && <LinkItem to="/colores" label="Colores" icon="bi-palette" sub onClick={handleNavigation} />}
              {can("VIEW_PRODUCTS") && <LinkItem to="/productos" label="Productos" icon="bi-box-seam" onClick={handleNavigation} />}
              {can("VIEW_PRODUCT_QUALITY") && <LinkItem to="/productos/calidad" label="Calidad de datos" icon="bi-clipboard-check" sub onClick={handleNavigation} />}
              {can("VIEW_PRODUCT_CATALOG") && <LinkItem to="/productos/catalogo" label="Catalogo visual" icon="bi-images" sub onClick={handleNavigation} />}
            </div>
          </div>
        )}

        {showAlmacen && (
          <div>
            <button
              type="button"
              className={`sidebar-parent ${openSubmenu === "almacen" ? "" : "collapsed"}`}
              onClick={() => toggleSubmenu("almacen")}
              aria-expanded={openSubmenu === "almacen"}
              aria-controls="menuAlmacen"
              {...getTooltipProps("Almacén")}
            >
              <div className="sidebar-parent-content">
                <i className="bi bi-archive me-2"></i>
                <span>Almacén</span>
              </div>
              <i className="bi bi-chevron-down sidebar-chevron"></i>
            </button>
            <div className={`collapse sidebar-submenu ${openSubmenu === "almacen" ? "show" : ""}`} id="menuAlmacen">
              {can("VIEW_INVENTORY") && <LinkItem to="/insumos" label="Insumos" icon="bi-boxes" sub onClick={handleNavigation} />}
              {can("VIEW_WAREHOUSE_RECEIPTS") && <LinkItem to="/almacen/entradas" label="Entradas" icon="bi-box-arrow-in-down" sub onClick={handleNavigation} />}
              {can("VIEW_INPUT_TYPES") && <LinkItem to="/insumos/tipos" label="Tipos de insumo" icon="bi-tags" sub onClick={handleNavigation} />}
              {can("VIEW_INVENTORY_OUTPUTS") && <LinkItem to="/salidas-insumos" label="Salidas" icon="bi-box-arrow-right" sub onClick={handleNavigation} />}
              {can("VIEW_WAREHOUSE_REQUISITIONS") && <LinkItem to="/almacen/requisiciones" label="Requisiciones" icon="bi-clipboard-check" sub onClick={handleNavigation} />}
              {can("VIEW_MEASURE_UNITS") && <LinkItem to="/unidades-medida" label="Unidad Medida" icon="bi-aspect-ratio" sub onClick={handleNavigation} />}
            </div>
          </div>
        )}

        {can("VIEW_WORK_CENTERS") && <LinkItem to="/centros-trabajo" label="Centros de Trabajo" icon="bi-building" onClick={handleNavigation} />}
        {can("VIEW_OPERATIONS") && <LinkItem to="/operaciones" label="Operaciones" icon="bi-gear" onClick={handleNavigation} />}
        {can("VIEW_PRODUCTION_ORDERS") && <LinkItem to="/ordenes-produccion" label="Órdenes de producción" icon="bi-clipboard2-check" onClick={handleNavigation} />}
        {can("VIEW_CIF") && <LinkItem to="/cif" label="CIF" icon="bi-diagram-3" onClick={handleNavigation} />}
        {can("VIEW_PURCHASES") && <LinkItem to="/compras" label="Compras" icon="bi-cart-check" onClick={handleNavigation} />}
        {can("VIEW_PURCHASES") && <LinkItem to="/compras/abastecimiento" label="Abastecimiento asistido" icon="bi-stars" onClick={handleNavigation} />}
        {can("VIEW_ACCOUNTS_PAYABLE") && <LinkItem to="/compras/cuentas-por-pagar" label="Cuentas por pagar" icon="bi-cash-coin" onClick={handleNavigation} />}
        {can("VIEW_CUSTOMERS") && <LinkItem to="/clientes" label="Clientes" icon="bi-person-vcard" onClick={handleNavigation} />}
        {can("VIEW_QUOTES") && <LinkItem to="/cotizaciones" label="Cotizaciones" icon="bi-file-earmark-text" onClick={handleNavigation} />}
      </nav>

      <button
        type="button"
        className="sidebar-collapse-button"
        onClick={handleSidebarToggle}
        aria-label={isOpen ? "Colapsar menu" : "Expandir menu"}
        title={isOpen ? "Colapsar menu" : "Expandir menu"}
      >
        <i className="bi bi-layout-sidebar-inset"></i>
      </button>

      {/* PERFIL (al fondo) */}
      <div ref={menuRef} className="sidebar-profile">
        <div
          onClick={() => {
            setOpenSubmenu(null);
            setOpenMenu((current) => !current);
          }}
          className="sidebar-profile-button"
        >
          <div className="sidebar-profile-avatar">
            {mostrarFoto ? (
              <ProtectedImage src={foto} alt="perfil" onError={() => setFailedFoto(foto)} />
            ) : (
              <span>{iniciales}</span>
            )}
            {notificacionesNoLeidas > 0 && (
              <button
                type="button"
                className="sidebar-profile-notification-count"
                aria-label={`${notificacionesNoLeidas} notificaciones sin leer`}
                title={`${notificacionesNoLeidas} notificaciones sin leer`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleNavigation();
                  navigate("/notificaciones");
                }}
              >
                {notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas}
              </button>
            )}
          </div>

          <div className="sidebar-profile-text">
            <strong>{nombre} {apellido}</strong>
            <div>{rol}</div>
          </div>
        </div>

        {openMenu && (
          <div className="sidebar-user-menu">
            <button
              onClick={() => {
                handleNavigation();
                navigate("/notificaciones");
              }}
            >
              <i className="bi bi-bell me-2"></i>
              Notificaciones
              {notificacionesNoLeidas > 0 && (
                <span className="sidebar-user-menu-count">
                  {notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                handleNavigation();
                navigate("/perfil");
              }}
            >
              <i className="bi bi-person me-2"></i>
              Perfil
            </button>

            <button onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
