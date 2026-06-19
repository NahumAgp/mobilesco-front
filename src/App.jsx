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

import PerfilPage from "./modules/perfil/pages/PerfilPage.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import FamiliasPage from "./modules/familias/pages/FamiliasPage.jsx";
import FamiliaFormPage from "./modules/familias/pages/FamiliaFormPage.jsx";

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

import CentrosTrabajoPage from "./modules/centros-trabajo/pages/CentrosTrabajoPage.jsx";
import CentrosTrabajoFormPage from "./modules/centros-trabajo/pages/CentroTrabajoFormPage.jsx";

import OperacionesPage from "./modules/operaciones/pages/OperacionesPage.jsx";
import OperacionesFormPage from "./modules/operaciones/pages/OperacionFormPage.jsx";
import CifPage from "./modules/cif/pages/CifPage.jsx";
import CifFormPage from "./modules/cif/pages/CifFormPage.jsx";

import ComprasPage from "./modules/compras/pages/ComprasPage.jsx";
import ComprasFormPage from "./modules/compras/pages/CompraFormPage.jsx";

import KardexPage from "./modules/kardex/pages/KardexPage"; 
import CompraDetallePage from "./modules/compras/pages/CompraDetallePage.jsx";

import ProductoFormPage from "./modules/productos/pages/Productos/ProductoFormPage.jsx";
import ProductosCompletosPage from "./modules/productos/pages/ProductosCompletos/ProductosCompletosPage.jsx";
import ProductoCatalogoPage from "./modules/productos/pages/Productos/ProductoCatalogoPage.jsx";
import ProductoInsumosBOMPage from "./modules/productos/pages/Productos/ProductoInsumosBOMPage.jsx";
import ProductoOperacionesBOMPage from "./modules/productos/pages/Productos/ProductoOperacionesBOMPage.jsx";
import UsuariosAccesoPage from "./modules/usuarios/pages/UsuariosAccesoPage.jsx";

function ProductoDetalleRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/productos/${id}` : "/productos"} replace />;
}

export default function App() {

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


        <Route path="/unidadMedida" element={<UnidadMedida />} />
        <Route path="/almacen" element={<Navigate to="/insumos" replace />} />

        <Route path="/nuevaCotizacion" element={<NuevaCotizacion />} />

        <Route path="/cotizaciones" element={<Cotizacion />} />

        {/* EMPLEADOS */}
        <Route path="/empleados/nuevo" element={<EmpleadoFormPage />} />
        <Route path="/empleados/:id" element={<EmpleadoFormPage />} />
        <Route path="/empleados" element={<EmpleadosPage />} />

        <Route path="/perfil" element={<PerfilPage />} />

        <Route
          path="/usuarios/accesos"
          element={
            <RoleRoute allowedRoles={["ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA"]}>
              <UsuariosAccesoPage />
            </RoleRoute>
          }
        />

        {/* PROVEEDORES */}
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/proveedores/nuevo" element={<ProveedorFormPage />} />
        <Route path="/proveedores/:id" element={<ProveedorFormPage />} />

        {/* UNIDADES DE MEDIDA */}
        <Route path="/unidades-medida" element={<UnidadesMedidaPage />} />
        <Route path="/unidades-medida/nuevo" element={<UnidadMedidaFormPage />} />
        <Route path="/unidades-medida/:id" element={<UnidadMedidaFormPage />} />

        {/* FAMILIAS */}
         <Route path="/familias" element={<FamiliasPage />} />
         <Route path="/familias/nuevo" element={<FamiliaFormPage />} />
         <Route path="/familias/:id" element={<FamiliaFormPage />} />

        {/* LINEA - PRODUCTO */}
        <Route path="/lineas-producto" element={<LineaProductoPage />} />
        <Route path="/lineas-producto/nuevo" element={<LineaProductoFormPage />} />
        <Route path="/lineas-producto/:id" element={<LineaProductoFormPage />} />

        <Route path="/categorias/*" element={<Navigate to="/modelos" replace />} />

        {/* MATERIALES */}
        <Route path="/materiales" element={<MaterialesPage />} />
        <Route path="/materiales/nuevo" element={<MaterialFormPage />} />
        <Route path="/materiales/:id" element={<MaterialFormPage />} />

        {/* MODELOS */}
        <Route path="/modelos" element={<ModelosPage />} />
        <Route path="/modelos/nuevo" element={<ModelosFormPage />} />
        <Route path="/modelos/:id" element={<ModelosFormPage />} />

        {/* COLORES */}
        <Route path="/colores" element={<ColorPage />} />
        <Route path="/colores/nuevo" element={<ColorFormPage />} />
        <Route path="/colores/:id" element={<ColorFormPage />} />

        {/* Inusmos */}
        <Route path="/insumos" element={<InsumosPage />} />
        <Route path="/insumos/tipos" element={<TiposInsumoPage />} />
        <Route path="/insumos/costos" element={<InsumosCostosPage />} />
        <Route path="/insumos/nuevo" element={<InsumosFormPage />} />
        <Route path="/insumos/:id" element={<InsumosFormPage />} />
        <Route path="/salidas-insumos" element={<SalidasInsumosPage />} />
        <Route path="/salidas-insumos/nueva" element={<SalidasInsumosNuevaPage />} />
        <Route
          path="/almacen/entradas"
          element={
            <RoleRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN"]}>
              <EntradasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/almacen/entradas/:id"
          element={
            <RoleRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "DIRECTOR_GENERAL", "SUBDIRECCION_ADMINISTRATIVA", "JEFE_ALMACEN"]}>
              <EntradaRecepcionPage />
            </RoleRoute>
          }
        />

         {/* Centros de Trabajo */}
        <Route path="/centros-trabajo" element={<CentrosTrabajoPage />} />
        <Route path="/centros-trabajo/nuevo" element={<CentrosTrabajoFormPage />} />
        <Route path="/centros-trabajo/:id" element={<CentrosTrabajoFormPage />} />

        {/* Operaciones */}
        <Route path="/operaciones" element={<OperacionesPage />} />
        <Route path="/operaciones/nuevo" element={<OperacionesFormPage />} />
        <Route path="/operaciones/:id" element={<OperacionesFormPage />} />
        <Route path="/cif" element={<CifPage />} />
        <Route path="/cif/nuevo" element={<CifFormPage />} />
        <Route path="/cif/:id" element={<CifFormPage />} />

         {/* Compras */}
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/compras/nueva" element={<ComprasFormPage />} />
        <Route path="/compras/:id" element={<ComprasFormPage />} />
        <Route path="/compras/:id/ver" element={<CompraDetallePage />} />

         {/*Kardex */}
        <Route path="/kardex" element={<KardexPage />} />
        <Route path="/kardex/insumo/:insumoId" element={<KardexPage />} />
        
        {/* Productos */}
        <Route path="/productos" element={<ProductosCompletosPage />} />
        <Route path="/productos/catalogo" element={<ProductoCatalogoPage />} />
        <Route path="/productos/catalogo/:id" element={<ProductoCatalogoPage />} />
        <Route path="/productos/nuevo" element={<ProductosCompletosPage iniciarCreacion />} />
        <Route path="/productos/:id" element={<ProductoFormPage />} />
        <Route path="/productos/:id/ver" element={<ProductoDetalleRedirect />} />
        <Route path="/productos/:id/bom/insumos" element={<ProductoInsumosBOMPage />} />
        <Route path="/productos/:id/bom/operaciones" element={<ProductoOperacionesBOMPage />} />

        <Route path="/productos-completos" element={<Navigate to="/productos" replace />} />
        <Route path="/prueba/productos" element={<Navigate to="/productos" replace />} />
      </Route>

      

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      

    </Routes>

  );

}
