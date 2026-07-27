import { Navigate, Route, Routes, useParams } from "react-router-dom";

import AppLayout from "./layout/AppLayout";

import Tablero from "./modules/tablero/pages/Tablero";
import UnidadMedida from "./modules/unidades-medida/legacy/UnidadMedida.jsx";
import NuevaCotizacion from "./modules/cotizaciones/pages/NuevaCotizacion.jsx";
import Cotizacion from "./modules/cotizaciones/pages/Cotizaciones.jsx";

import ProveedoresPage from "./modules/proveedores/pages/ProveedoresPage.jsx";
import ProveedorFormPage from "./modules/proveedores/pages/ProveedorFormPage.jsx";

import UnidadesMedidaPage from "./modules/unidades-medida/pages/UnidadMedidaPage.jsx";
import UnidadMedidaFormPage from "./modules/unidades-medida/pages/UnidadMedidaFormPage.jsx";

import Login from "./modules/auth/pages/Login.jsx";
import Register from "./modules/auth/pages/Register.jsx";

import EmpleadoFormPage from "./modules/empleados/pages/EmpleadoFormPage.jsx";
import EmpleadosPage from "./modules/empleados/pages/EmpleadoPage.jsx";
import AreasTrabajoPage from "./modules/areas-trabajo/pages/AreasTrabajoPage.jsx";

import PerfilPage from "./modules/perfil/pages/PerfilPage.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import FamiliasPage from "./modules/familias/pages/FamiliasPage.jsx";
import FamiliaFormPage from "./modules/familias/pages/FamiliaFormPage.jsx";
import SubfamiliasPage from "./modules/subfamilias/pages/SubfamiliasPage.jsx";
import SubfamiliaFormPage from "./modules/subfamilias/pages/SubfamiliaFormPage.jsx";

import LineaProductoFormPage from "./modules/lineas-producto/pages/LineaProductoFormPage.jsx";
import LineaProductoPage from "./modules/lineas-producto/pages/LineaProductoPage.jsx";

import ModelosPage from "./modules/modelos/pages/ModelosPage.jsx";
import ModelosFormPage from "./modules/modelos/pages/ModelosFormPage.jsx";
import MaterialesPage from "./modules/materiales/pages/MaterialesPage.jsx";
import MaterialFormPage from "./modules/materiales/pages/MaterialFormPage.jsx";
import ColorPage from "./modules/colores/pages/ColorPage.jsx";
import ColorFormPage from "./modules/colores/pages/ColorFormPage.jsx";

import  InsumosPage from "./modules/insumos/pages/InsumosPage.jsx";
import InsumosCostosPage from "./modules/insumos/pages/InsumosCostosPage.jsx";
import  InsumosFormPage from "./modules/insumos/pages/InsumoFormPage.jsx";
import TiposInsumoPage from "./modules/insumos/pages/TiposInsumoPage.jsx";
import SalidasInsumosPage from "./modules/salidas-insumos/pages/SalidasInsumosPage.jsx";
import SalidasInsumosNuevaPage from "./modules/salidas-insumos/pages/SalidasInsumosNuevaPage.jsx";
import EntradasPage from "./modules/almacen/entradas/pages/EntradasPage.jsx";
import EntradaRecepcionPage from "./modules/almacen/entradas/pages/EntradaRecepcionPage.jsx";
import RequisicionesPage from "./modules/almacen/requisiciones/pages/RequisicionesPage.jsx";
import RequisicionNuevaPage from "./modules/almacen/requisiciones/pages/RequisicionNuevaPage.jsx";
import RequisicionDetallePage from "./modules/almacen/requisiciones/pages/RequisicionDetallePage.jsx";

import CentrosTrabajoPage from "./modules/centros-trabajo/pages/CentrosTrabajoPage.jsx";
import CentrosTrabajoFormPage from "./modules/centros-trabajo/pages/CentroTrabajoFormPage.jsx";

import OperacionesPage from "./modules/operaciones/pages/OperacionesPage.jsx";
import OperacionesFormPage from "./modules/operaciones/pages/OperacionFormPage.jsx";
import CifPage from "./modules/cif/pages/CifPage.jsx";
import CifFormPage from "./modules/cif/pages/CifFormPage.jsx";

import ComprasPage from "./modules/compras/pages/ComprasPage.jsx";
import ComprasFormPage from "./modules/compras/pages/CompraFormPage.jsx";
import CuentasPorPagarPage from "./modules/compras/pages/CuentasPorPagarPage.jsx";
import CuentaPorPagarDetallePage from "./modules/compras/pages/CuentaPorPagarDetallePage.jsx";

import KardexPage from "./modules/kardex/pages/KardexPage"; 
import CompraDetallePage from "./modules/compras/pages/CompraDetallePage.jsx";

import ProductoFormPage from "./modules/productos/pages/Productos/ProductoFormPage.jsx";
import ProductosCompletosPage from "./modules/productos/pages/ProductosCompletos/ProductosCompletosPage.jsx";
import ProductoCatalogoPage from "./modules/productos/pages/Productos/ProductoCatalogoPage.jsx";
import ProductosCalidadPage from "./modules/productos/pages/Productos/ProductosCalidadPage.jsx";
import ProductoInsumosBOMPage from "./modules/productos/pages/Productos/ProductoInsumosBOMPage.jsx";
import ProductoOperacionesBOMPage from "./modules/productos/pages/Productos/ProductoOperacionesBOMPage.jsx";
import UsuariosAccesoPage from "./modules/usuarios/pages/UsuariosAccesoPage.jsx";
import NotificacionesPage from "./modules/notificaciones/pages/NotificacionesPage.jsx";
import ClientesPage from "./modules/clientes/pages/ClientesPage.jsx";
import ClienteFormPage from "./modules/clientes/pages/ClienteFormPage.jsx";

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

        <Route path="/tablero" element={<Tablero />} />
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

  );

}
