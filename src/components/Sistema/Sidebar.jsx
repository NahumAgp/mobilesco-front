import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { logout, getUser } from "../../services/authService";
import { useState, useRef, useEffect } from "react";

export default function Sidebar() {

  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const nombre = user?.nombre || "";
  const apellido = user?.apellidoPaterno || "";

  const rolMap = {
    ADMIN: "Administrador",
    EMPLOYEE: "Empleado"
  };

  const rol = rolMap[user?.roles?.[0]] || user?.roles?.[0] || "";

  const foto = user?.fotoUrl
    ? `http://localhost:8081${user.fotoUrl}`
    : null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Error logout:", e);
    }
    navigate("/login");
  };

  useEffect(() => {
    const updateUser = () => {
      setUser(getUser());
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
    <aside style={{ width: 260, padding: 16, background: "#244b47", color: "#fff" }}>

      {/* PERFIL */}
      <div ref={menuRef} style={{ position: "relative", marginBottom: 30 }}>

        <div
          onClick={() => setOpenMenu(!openMenu)}
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#1b7f72",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {foto ? (
              <img
                src={foto}
                alt="perfil"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <i className="bi bi-person-fill"></i>
            )}
          </div>

          <div>
            <strong>{nombre} {apellido}</strong>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{rol}</div>
          </div>
        </div>

        {/* DROPDOWN */}
        {openMenu && (
          <div
            style={{
              position: "absolute",
              top: 55,
              left: 0,
              width: "100%",
              background: "#2f5e58",
              borderRadius: 8,
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              overflow: "hidden"
            }}
          >
            <button
              onClick={() => navigate("/perfil")}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                color: "#fff",
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <i className="bi bi-person me-2"></i>
              Perfil
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                color: "#fff",
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* MENÚ */}
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
          <i className="bi bi-speedometer2 me-2"></i>
          Tablero
        </NavLink>

        {/* EMPLEADOS */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuEmpleados">
            <div className="sidebar-parent-content">
              <i className="bi bi-people me-2"></i>
              <span>Empleados</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>

          <div className="collapse sidebar-submenu" id="menuEmpleados">
            <NavLink to="/empleados" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista Empleados
            </NavLink>
            <NavLink to="/empleados/nuevo" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Empleado
            </NavLink>
          </div>
        </div>

        {/* PROVEEDORES */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuProveedores">
            <div className="sidebar-parent-content">
              <i className="bi bi-truck me-2"></i>
              <span>Proveedores</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>

          <div className="collapse sidebar-submenu" id="menuProveedores">
            <NavLink to="/proveedores" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista Proveedores
            </NavLink>
            <NavLink to="/proveedores/nuevo" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Proveedor
            </NavLink>
          </div>
        </div>

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

            {/* Familias */}
            <div>
              <button className="sidebar-parent sidebar-parent--sub" data-bs-toggle="collapse" data-bs-target="#menuFamilias">
                <div className="sidebar-parent-content">
                  <i className="bi bi-diagram-3 me-2"></i>
                  <span>Familias</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuFamilias">
                <NavLink to="/familias" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista de Familias
                </NavLink>
                <NavLink to="/familias/nuevo" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Familia
                </NavLink>
              </div>
            </div>

            {/* Estilos */}
            <div>
              <button className="sidebar-parent sidebar-parent--sub" data-bs-toggle="collapse" data-bs-target="#menuEstilos">
                <div className="sidebar-parent-content">
                  <i className="bi bi-palette me-2"></i>
                  <span>Estilos</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuEstilos">
                <NavLink to="/lineas-producto" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista de Estilos
                </NavLink>
                <NavLink to="/lineas-producto/nuevo" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Estilo
                </NavLink>
              </div>
            </div>

            {/* Categorías */}
            <div>
              <button className="sidebar-parent sidebar-parent--sub" data-bs-toggle="collapse" data-bs-target="#menuCategoria">
                <div className="sidebar-parent-content">
                  <i className="bi bi-tag me-2"></i>
                  <span>Categoria</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuCategoria">
                <NavLink to="/categorias" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista de Categorias
                </NavLink>
                <NavLink to="/categorias/nuevo" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Categoria
                </NavLink>
              </div>
            </div>

            {/* Unidad Medida */}
            <div>
              <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuUnidadesMedida">
                <div className="sidebar-parent-content">
                  <i className="bi bi-aspect-ratio me-2"></i>
                  <span>Unidad Medida</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuUnidadesMedida">
                <NavLink to="/unidades-medida" className="sidebar-link">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista Unidades
                </NavLink>
                <NavLink to="/unidades-medida/nuevo" className="sidebar-link">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Unidad
                </NavLink>
              </div>
            </div>

            {/* Materiales */}
            <div>
              <button className="sidebar-parent sidebar-parent--sub" data-bs-toggle="collapse" data-bs-target="#menuMateriales">
                <div className="sidebar-parent-content">
                  <i className="bi bi-bricks me-2"></i>
                  <span>Materiales</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuMateriales">
                <NavLink to="/materiales" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista de Materiales
                </NavLink>
                <NavLink to="/materiales/nuevo" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Material
                </NavLink>
              </div>
            </div>

            {/* Tipo Productos */}
            <div>
              <button className="sidebar-parent sidebar-parent--sub" data-bs-toggle="collapse" data-bs-target="#menuTiposProd">
                <div className="sidebar-parent-content">
                  <i className="bi bi-boxes me-2"></i>
                  
                  <span>Tipo Productos</span>
                </div>
                <i className="bi bi-chevron-down sidebar-chevron"></i>
              </button>

              <div className="collapse sidebar-submenu" id="menuTiposProd">
                <NavLink to="/tipos-producto" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-list-ul me-2"></i>
                  Lista Tipos de Productos
                </NavLink>
                <NavLink to="/tipos-producto/nuevo" className="sidebar-link sidebar-link--sub">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Tipo de producto
                </NavLink>
              </div>
            </div>

            <NavLink to="/productos" className="sidebar-link">
              <i className="bi bi-box-seam me-2"></i>
              Productos
            </NavLink>

          </div>
        </div>

        {/* INSUMOS */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuInsumos">
            <div className="sidebar-parent-content">
              <i class="bi bi-boxes me-2"></i>
              <span>Insumos</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>
          <div className="collapse sidebar-submenu" id="menuInsumos">
            <NavLink to="/insumos" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista Insumos
            </NavLink>
            <NavLink to="/insumos/nuevo" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Insumo
            </NavLink>
          </div>
        </div>

        {/* Centros de Trabajo */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuCentrosT">
            <div className="sidebar-parent-content">
              <i className="bi bi-building me-2"></i>
              <span>Centros de Trabajo</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>
          <div className="collapse sidebar-submenu" id="menuCentrosT">
            <NavLink to="/centros-trabajo" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista Centros de trabajo
            </NavLink>
            <NavLink to="/centros-trabajo/nuevo" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Centros de trabajo
            </NavLink>
          </div>
        </div>

        {/* OPERACIONES */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuOperaciones">
            <div className="sidebar-parent-content">
              <i className="bi bi-gear me-2"></i>
              <span>Operaciones</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>
          <div className="collapse sidebar-submenu" id="menuOperaciones">
            <NavLink to="/operaciones" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista Operaciones
            </NavLink>
            <NavLink to="/operaciones/nuevo" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Nueva Operacion
            </NavLink>
          </div>
        </div>

        {/* Compras */}
        <div>
          <button className="sidebar-parent" data-bs-toggle="collapse" data-bs-target="#menuCompras">
            <div className="sidebar-parent-content">
              <i className="bi bi-cart-check me-2"></i>
              <span>Compras</span>
            </div>
            <i className="bi bi-chevron-down sidebar-chevron"></i>
          </button>
          <div className="collapse sidebar-submenu" id="menuCompras">
            <NavLink to="/compras" className="sidebar-link">
              <i className="bi bi-list-ul me-2"></i>
              Lista de Compras
            </NavLink>
            <NavLink to="/compras/nueva" className="sidebar-link">
              <i className="bi bi-plus-circle me-2"></i>
              Registrar Compra
            </NavLink>
          </div>
        </div>

        {/* KARDEX */}
        <NavLink to="/kardex" className="sidebar-link">
          <i className="bi bi-journal-text me-2"></i>
          kardex
        </NavLink>

        {/* Nueva Cotización */}
        <NavLink to="/nuevaCotizacion" className="sidebar-link">
          <i className="bi bi-file-earmark-plus me-2"></i>
          Nueva Cotización
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