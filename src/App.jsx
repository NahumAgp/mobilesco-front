import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

const Login = lazy(() => import("./modules/auth/pages/Login.jsx"));
const Register = lazy(() => import("./modules/auth/pages/Register.jsx"));
const Tablero = lazy(() => import("./modules/tablero/pages/Tablero"));
const NotificacionesPage = lazy(() => import("./modules/notificaciones/pages/NotificacionesPage.jsx"));
const UnidadMedida = lazy(() => import("./modules/unidades-medida/legacy/UnidadMedida.jsx"));
const NuevaCotizacion = lazy(() => import("./modules/cotizaciones/pages/NuevaCotizacion.jsx"));
const Cotizacion = lazy(() => import("./modules/cotizaciones/pages/Cotizaciones.jsx"));
const ClientesPage = lazy(() => import("./modules/clientes/pages/ClientesPage.jsx"));
const ClienteFormPage = lazy(() => import("./modules/clientes/pages/ClienteFormPage.jsx"));
const EmpleadoFormPage = lazy(() => import("./modules/empleados/pages/EmpleadoFormPage.jsx"));
const EmpleadosPage = lazy(() => import("./modules/empleados/pages/EmpleadoPage.jsx"));
const AreasTrabajoPage = lazy(() => import("./modules/areas-trabajo/pages/AreasTrabajoPage.jsx"));
const PerfilPage = lazy(() => import("./modules/perfil/pages/PerfilPage.jsx"));
const UsuariosAccesoPage = lazy(() => import("./modules/usuarios/pages/UsuariosAccesoPage.jsx"));
const ProveedoresPage = lazy(() => import("./modules/proveedores/pages/ProveedoresPage.jsx"));
const ProveedorFormPage = lazy(() => import("./modules/proveedores/pages/ProveedorFormPage.jsx"));
const UnidadesMedidaPage = lazy(() => import("./modules/unidades-medida/pages/UnidadMedidaPage.jsx"));
const UnidadMedidaFormPage = lazy(() => import("./modules/unidades-medida/pages/UnidadMedidaFormPage.jsx"));
const FamiliasPage = lazy(() => import("./modules/familias/pages/FamiliasPage.jsx"));
const FamiliaFormPage = lazy(() => import("./modules/familias/pages/FamiliaFormPage.jsx"));
const SubfamiliasPage = lazy(() => import("./modules/subfamilias/pages/SubfamiliasPage.jsx"));
const SubfamiliaFormPage = lazy(() => import("./modules/subfamilias/pages/SubfamiliaFormPage.jsx"));
const LineaProductoPage = lazy(() => import("./modules/lineas-producto/pages/LineaProductoPage.jsx"));
const LineaProductoFormPage = lazy(() => import("./modules/lineas-producto/pages/LineaProductoFormPage.jsx"));
const MaterialesPage = lazy(() => import("./modules/materiales/pages/MaterialesPage.jsx"));
const MaterialFormPage = lazy(() => import("./modules/materiales/pages/MaterialFormPage.jsx"));
const ModelosPage = lazy(() => import("./modules/modelos/pages/ModelosPage.jsx"));
const ModelosFormPage = lazy(() => import("./modules/modelos/pages/ModelosFormPage.jsx"));
const ColorPage = lazy(() => import("./modules/colores/pages/ColorPage.jsx"));
const ColorFormPage = lazy(() => import("./modules/colores/pages/ColorFormPage.jsx"));
const InsumosPage = lazy(() => import("./modules/insumos/pages/InsumosPage.jsx"));
const InsumosCostosPage = lazy(() => import("./modules/insumos/pages/InsumosCostosPage.jsx"));
const InsumosFormPage = lazy(() => import("./modules/insumos/pages/InsumoFormPage.jsx"));
const TiposInsumoPage = lazy(() => import("./modules/insumos/pages/TiposInsumoPage.jsx"));
const SalidasInsumosPage = lazy(() => import("./modules/salidas-insumos/pages/SalidasInsumosPage.jsx"));
const SalidasInsumosNuevaPage = lazy(() => import("./modules/salidas-insumos/pages/SalidasInsumosNuevaPage.jsx"));
const RequisicionesPage = lazy(() => import("./modules/almacen/requisiciones/pages/RequisicionesPage.jsx"));
const RequisicionNuevaPage = lazy(() => import("./modules/almacen/requisiciones/pages/RequisicionNuevaPage.jsx"));
const RequisicionDetallePage = lazy(() => import("./modules/almacen/requisiciones/pages/RequisicionDetallePage.jsx"));
const EntradasPage = lazy(() => import("./modules/almacen/entradas/pages/EntradasPage.jsx"));
const EntradaRecepcionPage = lazy(() => import("./modules/almacen/entradas/pages/EntradaRecepcionPage.jsx"));
const CentrosTrabajoPage = lazy(() => import("./modules/centros-trabajo/pages/CentrosTrabajoPage.jsx"));
const CentrosTrabajoFormPage = lazy(() => import("./modules/centros-trabajo/pages/CentroTrabajoFormPage.jsx"));
const OperacionesPage = lazy(() => import("./modules/operaciones/pages/OperacionesPage.jsx"));
const OperacionesFormPage = lazy(() => import("./modules/operaciones/pages/OperacionFormPage.jsx"));
const CifPage = lazy(() => import("./modules/cif/pages/CifPage.jsx"));
const CifFormPage = lazy(() => import("./modules/cif/pages/CifFormPage.jsx"));
const ComprasPage = lazy(() => import("./modules/compras/pages/ComprasPage.jsx"));
const ComprasFormPage = lazy(() => import("./modules/compras/pages/CompraFormPage.jsx"));
const CuentasPorPagarPage = lazy(() => import("./modules/compras/pages/CuentasPorPagarPage.jsx"));
const CuentaPorPagarDetallePage = lazy(() => import("./modules/compras/pages/CuentaPorPagarDetallePage.jsx"));
const CompraDetallePage = lazy(() => import("./modules/compras/pages/CompraDetallePage.jsx"));
const KardexPage = lazy(() => import("./modules/kardex/pages/KardexPage"));
const ProductosCompletosPage = lazy(() => import("./modules/productos/pages/ProductosCompletos/ProductosCompletosPage.jsx"));
const ProductoCatalogoPage = lazy(() => import("./modules/productos/pages/Productos/ProductoCatalogoPage.jsx"));
const ProductosCalidadPage = lazy(() => import("./modules/productos/pages/Productos/ProductosCalidadPage.jsx"));
const ProductoFormPage = lazy(() => import("./modules/productos/pages/Productos/ProductoFormPage.jsx"));
const ProductoInsumosBOMPage = lazy(() => import("./modules/productos/pages/Productos/ProductoInsumosBOMPage.jsx"));
const ProductoOperacionesBOMPage = lazy(() => import("./modules/productos/pages/Productos/ProductoOperacionesBOMPage.jsx"));

function RouteFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5" role="status" aria-live="polite">
      <span className="spinner-border text-primary" aria-hidden="true" />
      <span className="visually-hidden">Cargando página…</span>
    </div>
  );
}

function ProductoDetalleRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/productos/${id}` : "/productos"} replace />;
}

const ROLES_GESTION_COMPRAS = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN"];
const ROLES_GESTION_INSUMOS = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN", "ALMACEN"];
const ROLES_GESTION_SALIDAS = ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN", "ALMACEN"];

export default function App() {
  const withPermission = (element, permission) => (
    <RoleRoute permission={permission}>
      {element}
    </RoleRoute>
  );

  const withRoles = (element, allowedRoles) => (
    <RoleRoute allowedRoles={allowedRoles}>
      {element}
    </RoleRoute>
  );

  const withPermissionOrRoles = (element, permission, allowedRoles) => (
    <RoleRoute permission={permission} allowedRoles={allowedRoles}>
      {element}
    </RoleRoute>
  );

  return (

    <Suspense fallback={<RouteFallback />}>
    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* REDIRECCIÓN INICIAL */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* RUTAS PROTEGIDAS */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        <Route path="/tablero" element={withPermission(<Tablero />, "VIEW_DASHBOARD")} />
        <Route path="/notificaciones" element={<NotificacionesPage />} />


        <Route path="/unidadMedida" element={withPermission(<UnidadMedida />, "VIEW_INVENTORY")} />
        <Route path="/almacen" element={<Navigate to="/insumos" replace />} />

        <Route path="/nuevaCotizacion" element={<Navigate to="/cotizaciones/nueva" replace />} />

        <Route path="/cotizaciones" element={withPermission(<Cotizacion />, "VIEW_QUOTES")} />
        <Route path="/cotizaciones/nueva" element={withPermission(<NuevaCotizacion />, "VIEW_QUOTES")} />

        {/* CLIENTES */}
        <Route path="/clientes" element={withPermission(<ClientesPage />, "VIEW_CUSTOMERS")} />
        <Route path="/clientes/nuevo" element={withPermission(<ClienteFormPage />, "VIEW_CUSTOMERS")} />
        <Route path="/clientes/:id" element={withPermission(<ClienteFormPage />, "VIEW_CUSTOMERS")} />

        {/* EMPLEADOS */}
        <Route path="/empleados/nuevo" element={withPermission(<EmpleadoFormPage />, "VIEW_EMPLOYEES")} />
        <Route path="/empleados/:id" element={withPermission(<EmpleadoFormPage />, "VIEW_EMPLOYEES")} />
        <Route path="/empleados" element={withPermission(<EmpleadosPage />, "VIEW_EMPLOYEES")} />
        <Route path="/areas-trabajo" element={withPermission(<AreasTrabajoPage />, "VIEW_EMPLOYEES")} />

        <Route path="/perfil" element={<PerfilPage />} />

        <Route
          path="/usuarios/accesos"
          element={
            <RoleRoute
              allowedRoles={["ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"]}
              permission="VIEW_USERS"
            >
              <UsuariosAccesoPage />
            </RoleRoute>
          }
        />

        {/* PROVEEDORES */}
        <Route path="/proveedores" element={withPermission(<ProveedoresPage />, "VIEW_SUPPLIERS")} />
        <Route path="/proveedores/nuevo" element={withPermission(<ProveedorFormPage />, "VIEW_SUPPLIERS")} />
        <Route path="/proveedores/:id" element={withPermission(<ProveedorFormPage />, "VIEW_SUPPLIERS")} />

        {/* UNIDADES DE MEDIDA */}
        <Route path="/unidades-medida" element={withPermission(<UnidadesMedidaPage />, "VIEW_INVENTORY")} />
        <Route path="/unidades-medida/nuevo" element={withPermission(<UnidadMedidaFormPage />, "VIEW_INVENTORY")} />
        <Route path="/unidades-medida/:id" element={withPermission(<UnidadMedidaFormPage />, "VIEW_INVENTORY")} />

        {/* FAMILIAS */}
        <Route path="/familias" element={withPermission(<FamiliasPage />, "VIEW_PRODUCTS")} />
        <Route path="/familias/nuevo" element={withPermission(<FamiliaFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/familias/:id" element={withPermission(<FamiliaFormPage />, "VIEW_PRODUCTS")} />

        {/* SUBFAMILIAS */}
        <Route path="/subfamilias" element={withPermission(<SubfamiliasPage />, "VIEW_PRODUCTS")} />
        <Route path="/subfamilias/nuevo" element={withPermission(<SubfamiliaFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/subfamilias/:id" element={withPermission(<SubfamiliaFormPage />, "VIEW_PRODUCTS")} />

        {/* LINEA - PRODUCTO */}
        <Route path="/lineas-producto" element={withPermission(<LineaProductoPage />, "VIEW_PRODUCTS")} />
        <Route path="/lineas-producto/nuevo" element={withPermission(<LineaProductoFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/lineas-producto/:id" element={withPermission(<LineaProductoFormPage />, "VIEW_PRODUCTS")} />

        <Route path="/categorias/*" element={<Navigate to="/modelos" replace />} />

        {/* MATERIALES */}
        <Route path="/materiales" element={withPermission(<MaterialesPage />, "VIEW_PRODUCTS")} />
        <Route path="/materiales/nuevo" element={withPermission(<MaterialFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/materiales/:id" element={withPermission(<MaterialFormPage />, "VIEW_PRODUCTS")} />

        {/* MODELOS */}
        <Route path="/modelos" element={withPermission(<ModelosPage />, "VIEW_PRODUCTS")} />
        <Route path="/modelos/nuevo" element={withPermission(<ModelosFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/modelos/:id" element={withPermission(<ModelosFormPage />, "VIEW_PRODUCTS")} />

        {/* COLORES */}
        <Route path="/colores" element={withPermission(<ColorPage />, "VIEW_PRODUCTS")} />
        <Route path="/colores/nuevo" element={withPermission(<ColorFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/colores/:id" element={withPermission(<ColorFormPage />, "VIEW_PRODUCTS")} />

        {/* Inusmos */}
        <Route path="/insumos" element={withPermission(<InsumosPage />, "VIEW_INVENTORY")} />
        <Route path="/insumos/tipos" element={withPermission(<TiposInsumoPage />, "VIEW_INVENTORY")} />
        <Route path="/insumos/costos" element={withPermission(<InsumosCostosPage />, "ACTION_INSUMOS_COSTS")} />
        <Route path="/insumos/nuevo" element={withRoles(<InsumosFormPage />, ROLES_GESTION_INSUMOS)} />
        <Route path="/insumos/:id" element={withRoles(<InsumosFormPage />, ROLES_GESTION_INSUMOS)} />
        <Route path="/salidas-insumos" element={withPermission(<SalidasInsumosPage />, "VIEW_INVENTORY")} />
        <Route path="/salidas-insumos/nueva" element={withRoles(<SalidasInsumosNuevaPage />, ROLES_GESTION_SALIDAS)} />
        <Route path="/almacen/requisiciones" element={withPermissionOrRoles(<RequisicionesPage />, "VIEW_WAREHOUSE_REQUISITIONS", ["JEFE_ALMACEN"])} />
        <Route path="/almacen/requisiciones/nueva" element={withRoles(<RequisicionNuevaPage />, ["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "JEFE_ALMACEN"])} />
        <Route path="/almacen/requisiciones/:id" element={withPermissionOrRoles(<RequisicionDetallePage />, "VIEW_WAREHOUSE_REQUISITIONS", ["JEFE_ALMACEN"])} />
        <Route
          path="/almacen/entradas"
          element={
            <RoleRoute
              allowedRoles={ROLES_GESTION_COMPRAS}
            >
              <EntradasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/almacen/entradas/:id"
          element={
            <RoleRoute
              allowedRoles={ROLES_GESTION_COMPRAS}
            >
              <EntradaRecepcionPage />
            </RoleRoute>
          }
        />

         {/* Centros de Trabajo */}
        <Route path="/centros-trabajo" element={withPermission(<CentrosTrabajoPage />, "VIEW_WORK_CENTERS")} />
        <Route path="/centros-trabajo/nuevo" element={withPermission(<CentrosTrabajoFormPage />, "VIEW_WORK_CENTERS")} />
        <Route path="/centros-trabajo/:id" element={withPermission(<CentrosTrabajoFormPage />, "VIEW_WORK_CENTERS")} />

        {/* Operaciones */}
        <Route path="/operaciones" element={withPermission(<OperacionesPage />, "VIEW_OPERATIONS")} />
        <Route path="/operaciones/nuevo" element={withPermission(<OperacionesFormPage />, "VIEW_OPERATIONS")} />
        <Route path="/operaciones/:id" element={withPermission(<OperacionesFormPage />, "VIEW_OPERATIONS")} />
        <Route path="/cif" element={withPermission(<CifPage />, "VIEW_CIF")} />
        <Route path="/cif/nuevo" element={withPermission(<CifFormPage />, "VIEW_CIF")} />
        <Route path="/cif/:id" element={withPermission(<CifFormPage />, "VIEW_CIF")} />

         {/* Compras */}
        <Route path="/compras" element={withPermission(<ComprasPage />, "VIEW_PURCHASES")} />
        <Route path="/compras/cuentas-por-pagar" element={withPermission(<CuentasPorPagarPage />, "VIEW_PURCHASES")} />
        <Route path="/compras/cuentas-por-pagar/:id" element={withPermission(<CuentaPorPagarDetallePage />, "VIEW_PURCHASES")} />
        <Route path="/compras/nueva" element={withRoles(<ComprasFormPage />, ROLES_GESTION_COMPRAS)} />
        <Route path="/compras/:id" element={withRoles(<ComprasFormPage />, ROLES_GESTION_COMPRAS)} />
        <Route path="/compras/:id/ver" element={withPermission(<CompraDetallePage />, "VIEW_PURCHASES")} />

         {/*Kardex */}
        <Route path="/kardex" element={withPermission(<KardexPage />, "VIEW_KARDEX")} />
        <Route path="/kardex/insumo/:insumoId" element={withPermission(<KardexPage />, "VIEW_KARDEX")} />
        
        {/* Productos */}
        <Route path="/productos" element={withPermission(<ProductosCompletosPage />, "VIEW_PRODUCTS")} />
        <Route path="/productos/catalogo" element={withPermission(<ProductoCatalogoPage />, "VIEW_PRODUCT_CATALOG")} />
        <Route path="/productos/catalogo/:id" element={withPermission(<ProductoCatalogoPage />, "VIEW_PRODUCT_CATALOG")} />
        <Route path="/productos/calidad" element={withPermission(<ProductosCalidadPage />, "VIEW_PRODUCTS")} />
        <Route path="/productos/nuevo" element={withPermission(<ProductosCompletosPage iniciarCreacion />, "VIEW_PRODUCTS")} />
        <Route path="/productos/:id" element={withPermission(<ProductoFormPage />, "VIEW_PRODUCTS")} />
        <Route path="/productos/:id/ver" element={withPermission(<ProductoDetalleRedirect />, "VIEW_PRODUCTS")} />
        <Route path="/productos/:id/bom/insumos" element={withPermission(<ProductoInsumosBOMPage />, "VIEW_PRODUCTS")} />
        <Route path="/productos/:id/bom/operaciones" element={withPermission(<ProductoOperacionesBOMPage />, "VIEW_PRODUCTS")} />

        <Route path="/productos-completos" element={<Navigate to="/productos" replace />} />
        <Route path="/prueba/productos" element={<Navigate to="/productos" replace />} />
      </Route>

      

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      

    </Routes>
    </Suspense>

  );

}
