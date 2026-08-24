import "./Sidebar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { logout, getUser, hasPermission } from "../../modules/auth/services/authService";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiConfig";
import { contarNotificacionesNoLeidas } from "../../modules/notificaciones/services/notificaciones";
import ProtectedImage from "../ui/ProtectedImage";

const NAV_USAGE_PREFIX = "mobilesco:navigationUsage";
const NAV_PINNED_PREFIX = "mobilesco:navigationPinned";
const COMPACT_VISIBLE_ITEMS = 9;

function loadNavigationUsage(key) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function loadNavigationPins(key) {
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function LinkItem({ to, label, icon, sub = false, onClick }) {
  return (
    <NavLink to={to} className={`sidebar-link${sub ? " sidebar-link--sub" : ""}`} onClick={onClick} title={label} aria-label={label}>
      <i className={`bi ${icon} me-2`}></i>
      {label}
    </NavLink>
  );
}

function CompactLinkItem({ item, pinned, onClick, onContextMenu }) {
  return (
    <NavLink
      to={item.to}
      className={`sidebar-compact-link ${pinned ? "is-pinned" : ""}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={item.label}
      aria-label={item.label}
    >
      <i className={`bi ${item.icon}`}></i>
      {pinned && <span className="sidebar-pin-indicator" aria-hidden="true"></span>}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, toggleSidebar, closeSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getUser());
  const [failedFoto, setFailedFoto] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [openMore, setOpenMore] = useState(false);
  const [navUsageVersion, setNavUsageVersion] = useState(0);
  const [pinnedVersion, setPinnedVersion] = useState(0);
  const [pinMenu, setPinMenu] = useState(null);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const menuRef = useRef(null);
  const moreRef = useRef(null);

  const handleNavigation = () => {
    setOpenSubmenu(null);
    setOpenMenu(false);
    setOpenMore(false);
    setPinMenu(null);
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
  const userStorageId =
    user?.id ||
    user?.usuarioId ||
    user?.email ||
    user?.username ||
    user?.nombreUsuario ||
    `${nombre || "usuario"}-${roles.join("-") || "sin-rol"}`;
  const navUsageKey = `${NAV_USAGE_PREFIX}:${userStorageId}`;
  const navPinnedKey = `${NAV_PINNED_PREFIX}:${userStorageId}`;
  const navUsage = navUsageVersion >= 0 ? loadNavigationUsage(navUsageKey) : {};
  const pinnedRoutes = pinnedVersion >= 0 ? loadNavigationPins(navPinnedKey) : [];
  const pinnedRouteSet = new Set(pinnedRoutes);

  const registerRouteUse = (to) => {
    const current = loadNavigationUsage(navUsageKey);
    const next = { ...current, [to]: (Number(current[to]) || 0) + 1 };
    try {
      window.localStorage.setItem(navUsageKey, JSON.stringify(next));
    } catch {
      // Si localStorage no esta disponible, la navegacion sigue funcionando.
    }
    setNavUsageVersion((version) => version + 1);
  };

  const handleRouteNavigation = (to) => {
    registerRouteUse(to);
    handleNavigation();
  };

  const openPinMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenMenu(false);
    setOpenMore(false);
    setPinMenu({
      item,
      x: event.clientX,
      y: event.clientY
    });
  };

  const togglePinnedRoute = (item) => {
    const current = loadNavigationPins(navPinnedKey);
    const exists = current.includes(item.to);
    const next = exists
      ? current.filter((route) => route !== item.to)
      : [...current, item.to];
    try {
      window.localStorage.setItem(navPinnedKey, JSON.stringify(next));
    } catch {
      // Si localStorage no esta disponible, la fijacion solo no persiste.
    }
    setPinnedVersion((version) => version + 1);
    setPinMenu(null);
  };

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
  const navItems = [
    can("VIEW_DASHBOARD") && { to: "/tablero", label: "Tablero", shortLabel: "Inicio", icon: "bi-speedometer2", section: "Inicio" },
    puedeGestionarUsuarios && { to: "/usuarios/accesos", label: "Usuarios y accesos", shortLabel: "Usuarios", icon: "bi-shield-check", section: "General" },
    can("VIEW_EMPLOYEES") && { to: "/empleados", label: "Empleados", icon: "bi-people", section: "General" },
    can("VIEW_WORK_AREAS") && { to: "/areas-trabajo", label: "Areas de trabajo", shortLabel: "Areas", icon: "bi-diagram-3", section: "General" },
    can("VIEW_SUPPLIERS") && { to: "/proveedores", label: "Proveedores", shortLabel: "Prov.", icon: "bi-truck", section: "General" },
    can("VIEW_PRODUCT_LINES") && { to: "/lineas-producto", label: "Lineas", icon: "bi-collection", section: "Productos" },
    can("VIEW_FAMILIES") && { to: "/familias", label: "Familias", icon: "bi-diagram-3", section: "Productos" },
    can("VIEW_SUBFAMILIES") && { to: "/subfamilias", label: "Subfamilias", shortLabel: "Subfam.", icon: "bi-diagram-2", section: "Productos" },
    can("VIEW_MODELS") && { to: "/modelos", label: "Modelos", icon: "bi-boxes", section: "Productos" },
    can("VIEW_MATERIALS") && { to: "/materiales", label: "Materiales", shortLabel: "Material", icon: "bi-layers", section: "Productos" },
    can("VIEW_COLORS") && { to: "/colores", label: "Colores", icon: "bi-palette", section: "Productos" },
    can("VIEW_PRODUCTS") && { to: "/productos", label: "Productos", shortLabel: "Productos", icon: "bi-box-seam", section: "Productos" },
    can("VIEW_PRODUCT_QUALITY") && { to: "/productos/calidad", label: "Calidad de datos", shortLabel: "Calidad", icon: "bi-clipboard-check", section: "Productos" },
    can("VIEW_PRODUCT_CATALOG") && { to: "/productos/catalogo", label: "Catalogo visual", shortLabel: "Catalogo", icon: "bi-images", section: "Productos" },
    can("VIEW_INVENTORY") && { to: "/insumos", label: "Insumos", icon: "bi-boxes", section: "Almacen" },
    can("VIEW_WAREHOUSE_RECEIPTS") && { to: "/almacen/entradas", label: "Entradas", icon: "bi-box-arrow-in-down", section: "Almacen" },
    can("VIEW_INPUT_TYPES") && { to: "/insumos/tipos", label: "Tipos de insumo", shortLabel: "Tipos", icon: "bi-tags", section: "Almacen" },
    can("VIEW_INVENTORY_OUTPUTS") && { to: "/salidas-insumos", label: "Salidas", icon: "bi-box-arrow-right", section: "Almacen" },
    can("VIEW_WAREHOUSE_REQUISITIONS") && { to: "/almacen/requisiciones", label: "Requisiciones", shortLabel: "Req.", icon: "bi-clipboard-check", section: "Almacen" },
    can("VIEW_MEASURE_UNITS") && { to: "/unidades-medida", label: "Unidad Medida", shortLabel: "Unidad", icon: "bi-aspect-ratio", section: "Almacen" },
    can("VIEW_WORK_CENTERS") && { to: "/centros-trabajo", label: "Centros de Trabajo", shortLabel: "Centros", icon: "bi-building", section: "Produccion" },
    can("VIEW_OPERATIONS") && { to: "/operaciones", label: "Operaciones", shortLabel: "Operacion", icon: "bi-gear", section: "Produccion" },
    can("VIEW_PRODUCTION_ORDERS") && { to: "/ordenes-produccion", label: "Ordenes de produccion", shortLabel: "Ordenes", icon: "bi-clipboard2-check", section: "Produccion" },
    can("VIEW_CIF") && { to: "/cif", label: "CIF", icon: "bi-diagram-3", section: "Produccion" },
    can("VIEW_PURCHASES") && { to: "/compras", label: "Compras", icon: "bi-cart-check", section: "Compras" },
    can("VIEW_PURCHASES") && { to: "/compras/abastecimiento", label: "Abastecimiento asistido", shortLabel: "Abasto", icon: "bi-stars", section: "Compras" },
    can("VIEW_ACCOUNTS_PAYABLE") && { to: "/compras/cuentas-por-pagar", label: "Cuentas por pagar", shortLabel: "Cuentas", icon: "bi-cash-coin", section: "Compras" },
    can("VIEW_CUSTOMERS") && { to: "/clientes", label: "Clientes", icon: "bi-person-vcard", section: "Comercial" },
    can("VIEW_QUOTES") && { to: "/cotizaciones", label: "Cotizaciones", shortLabel: "Cotiza.", icon: "bi-file-earmark-text", section: "Comercial" }
  ].filter(Boolean);
  const pinnedItems = pinnedRoutes
    .map((route) => navItems.find((item) => item.to === route))
    .filter(Boolean);
  const automaticItems = navItems
    .filter((item) => !pinnedRouteSet.has(item.to))
    .sort((a, b) => {
      const usageDiff = (Number(navUsage[b.to]) || 0) - (Number(navUsage[a.to]) || 0);
      if (usageDiff !== 0) return usageDiff;
      const activeDiff = Number(location.pathname.startsWith(b.to)) - Number(location.pathname.startsWith(a.to));
      return activeDiff;
    });
  const compactItems = [...pinnedItems, ...automaticItems]
    .slice(0, COMPACT_VISIBLE_ITEMS);
  const moreItems = navItems.filter((item) => !compactItems.some((compactItem) => compactItem.to === item.to));
  const moreSections = moreItems.reduce((sections, item) => {
    const section = item.section || "Mas";
    if (!sections[section]) sections[section] = [];
    sections[section].push(item);
    return sections;
  }, {});

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
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setOpenMore(false);
      }
      setPinMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPinMenu(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
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

      {!isOpen && !isMobile ? (
        <>
          <nav className="sidebar-compact-menu" aria-label="Accesos mas usados">
            {compactItems.map((item) => (
              <CompactLinkItem
                key={item.to}
                item={item}
                pinned={pinnedRouteSet.has(item.to)}
                onClick={() => handleRouteNavigation(item.to)}
                onContextMenu={(event) => openPinMenu(event, item)}
              />
            ))}
          </nav>

          <div ref={moreRef} className="sidebar-more">
            <button
              type="button"
              className={`sidebar-more-button ${openMore ? "is-open" : ""}`}
              onClick={() => {
                setOpenMenu(false);
                setOpenMore((current) => !current);
              }}
              aria-label="Mostrar mas opciones"
              title="Mas"
              aria-expanded={openMore}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>

            {openMore && (
              <div className="sidebar-more-panel">
                <div className="sidebar-more-header">
                  <strong>Mas opciones</strong>
                  <span>Segun tus permisos</span>
                </div>
                <div className="sidebar-more-content">
                  {Object.entries(moreSections).map(([section, items]) => (
                    <div key={section} className="sidebar-more-section">
                      <div className="sidebar-more-section-title">{section}</div>
                      {items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={`sidebar-more-link ${pinnedRouteSet.has(item.to) ? "is-pinned" : ""}`}
                          onClick={() => handleRouteNavigation(item.to)}
                          onContextMenu={(event) => openPinMenu(event, item)}
                        >
                          <i className={`bi ${item.icon}`}></i>
                          <span>{item.label}</span>
                          {pinnedRouteSet.has(item.to) && <i className="bi bi-pin-angle-fill sidebar-more-pin" aria-hidden="true"></i>}
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
      <nav className="sidebar-menu-list">
        {can("VIEW_DASHBOARD") && <LinkItem to="/tablero" label="Tablero" icon="bi-speedometer2" onClick={() => handleRouteNavigation("/tablero")} />}

        {puedeGestionarUsuarios && <LinkItem to="/usuarios/accesos" label="Usuarios y accesos" icon="bi-shield-check" onClick={() => handleRouteNavigation("/usuarios/accesos")} />}
        {can("VIEW_EMPLOYEES") && <LinkItem to="/empleados" label="Empleados" icon="bi-people" onClick={() => handleRouteNavigation("/empleados")} />}
        {can("VIEW_WORK_AREAS") && <LinkItem to="/areas-trabajo" label="Areas de trabajo" icon="bi-diagram-3" onClick={() => handleRouteNavigation("/areas-trabajo")} />}
        {can("VIEW_SUPPLIERS") && <LinkItem to="/proveedores" label="Proveedores" icon="bi-truck" onClick={() => handleRouteNavigation("/proveedores")} />}

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
              {can("VIEW_PRODUCT_LINES") && <LinkItem to="/lineas-producto" label="Lineas" icon="bi-collection" sub onClick={() => handleRouteNavigation("/lineas-producto")} />}
              {can("VIEW_FAMILIES") && <LinkItem to="/familias" label="Familias" icon="bi-diagram-3" sub onClick={() => handleRouteNavigation("/familias")} />}
              {can("VIEW_SUBFAMILIES") && <LinkItem to="/subfamilias" label="Subfamilias" icon="bi-diagram-2" sub onClick={() => handleRouteNavigation("/subfamilias")} />}
              {can("VIEW_MODELS") && <LinkItem to="/modelos" label="Modelos" icon="bi-boxes" sub onClick={() => handleRouteNavigation("/modelos")} />}
              {can("VIEW_MATERIALS") && <LinkItem to="/materiales" label="Materiales" icon="bi-layers" sub onClick={() => handleRouteNavigation("/materiales")} />}
              {can("VIEW_COLORS") && <LinkItem to="/colores" label="Colores" icon="bi-palette" sub onClick={() => handleRouteNavigation("/colores")} />}
              {can("VIEW_PRODUCTS") && <LinkItem to="/productos" label="Productos" icon="bi-box-seam" onClick={() => handleRouteNavigation("/productos")} />}
              {can("VIEW_PRODUCT_QUALITY") && <LinkItem to="/productos/calidad" label="Calidad de datos" icon="bi-clipboard-check" sub onClick={() => handleRouteNavigation("/productos/calidad")} />}
              {can("VIEW_PRODUCT_CATALOG") && <LinkItem to="/productos/catalogo" label="Catalogo visual" icon="bi-images" sub onClick={() => handleRouteNavigation("/productos/catalogo")} />}
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
              {can("VIEW_INVENTORY") && <LinkItem to="/insumos" label="Insumos" icon="bi-boxes" sub onClick={() => handleRouteNavigation("/insumos")} />}
              {can("VIEW_WAREHOUSE_RECEIPTS") && <LinkItem to="/almacen/entradas" label="Entradas" icon="bi-box-arrow-in-down" sub onClick={() => handleRouteNavigation("/almacen/entradas")} />}
              {can("VIEW_INPUT_TYPES") && <LinkItem to="/insumos/tipos" label="Tipos de insumo" icon="bi-tags" sub onClick={() => handleRouteNavigation("/insumos/tipos")} />}
              {can("VIEW_INVENTORY_OUTPUTS") && <LinkItem to="/salidas-insumos" label="Salidas" icon="bi-box-arrow-right" sub onClick={() => handleRouteNavigation("/salidas-insumos")} />}
              {can("VIEW_WAREHOUSE_REQUISITIONS") && <LinkItem to="/almacen/requisiciones" label="Requisiciones" icon="bi-clipboard-check" sub onClick={() => handleRouteNavigation("/almacen/requisiciones")} />}
              {can("VIEW_MEASURE_UNITS") && <LinkItem to="/unidades-medida" label="Unidad Medida" icon="bi-aspect-ratio" sub onClick={() => handleRouteNavigation("/unidades-medida")} />}
            </div>
          </div>
        )}

        {can("VIEW_WORK_CENTERS") && <LinkItem to="/centros-trabajo" label="Centros de Trabajo" icon="bi-building" onClick={() => handleRouteNavigation("/centros-trabajo")} />}
        {can("VIEW_OPERATIONS") && <LinkItem to="/operaciones" label="Operaciones" icon="bi-gear" onClick={() => handleRouteNavigation("/operaciones")} />}
        {can("VIEW_PRODUCTION_ORDERS") && <LinkItem to="/ordenes-produccion" label="Órdenes de producción" icon="bi-clipboard2-check" onClick={() => handleRouteNavigation("/ordenes-produccion")} />}
        {can("VIEW_CIF") && <LinkItem to="/cif" label="CIF" icon="bi-diagram-3" onClick={() => handleRouteNavigation("/cif")} />}
        {can("VIEW_PURCHASES") && <LinkItem to="/compras" label="Compras" icon="bi-cart-check" onClick={() => handleRouteNavigation("/compras")} />}
        {can("VIEW_PURCHASES") && <LinkItem to="/compras/abastecimiento" label="Abastecimiento asistido" icon="bi-stars" onClick={() => handleRouteNavigation("/compras/abastecimiento")} />}
        {can("VIEW_ACCOUNTS_PAYABLE") && <LinkItem to="/compras/cuentas-por-pagar" label="Cuentas por pagar" icon="bi-cash-coin" onClick={() => handleRouteNavigation("/compras/cuentas-por-pagar")} />}
        {can("VIEW_CUSTOMERS") && <LinkItem to="/clientes" label="Clientes" icon="bi-person-vcard" onClick={() => handleRouteNavigation("/clientes")} />}
        {can("VIEW_QUOTES") && <LinkItem to="/cotizaciones" label="Cotizaciones" icon="bi-file-earmark-text" onClick={() => handleRouteNavigation("/cotizaciones")} />}
      </nav>
      )}

      {pinMenu && (
        <div
          className="sidebar-pin-menu"
          style={{ left: `${pinMenu.x}px`, top: `${pinMenu.y}px` }}
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="sidebar-pin-menu-title">{pinMenu.item.label}</div>
          <button type="button" role="menuitem" onClick={() => togglePinnedRoute(pinMenu.item)}>
            <i className={`bi ${pinnedRouteSet.has(pinMenu.item.to) ? "bi-pin-angle-fill" : "bi-pin-angle"}`}></i>
            {pinnedRouteSet.has(pinMenu.item.to) ? "Desfijar" : "Fijar"}
          </button>
        </div>
      )}

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
