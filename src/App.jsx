import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layout/AppLayout";

import Tablero from "./pages/Tablero";
import UnidadMedida from "./pages/UnidadMedida.jsx";
import NuevaCotizacion from "./pages/NuevaCotizacion.jsx";
import Cotizacion from "./pages/Cotizaciones.jsx";

import ProveedoresPage from "./pages/Proveedores/ProveedoresPage.jsx";
import ProveedorFormPage from "./pages/Proveedores/ProveedorFormPage.jsx";

import UnidadesMedidaPage from "./pages/UnidadMedidas/UnidadMedidaPage.jsx";
import UnidadMedidaFormPage from "./pages/UnidadMedidas/UnidadMedidaFormPage.jsx";

import Login from "./pages/auth/Login.jsx";

import EmpleadoFormPage from "./pages/Empleados/EmpleadoFormPage.jsx";
import EmpleadosPage from "./pages/Empleados/EmpleadoPage.jsx";

import PerfilPage from "./pages/Perfil/PerfilPage.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import FamiliasPage from "./pages/Familias/FamiliasPage.jsx";
import FamiliaFormPage from "./pages/Familias/FamiliaFormPage.jsx";

import LineaProductoForm from "./pages/LineaProducto/LineaProductoFormPage.jsx";
import LineaProductoFormPage from "./pages/LineaProducto/LineaProductoFormPage.jsx";
import LineaProductoPage from "./pages/LineaProducto/LineaProductoPage.jsx";

import CategoriaPage from "./pages/Categoria/CategoriaPage.jsx";
import CategoriaFromPage from "./pages/Categoria/CategoriaFormPage.jsx";
import CategoriaFormPage from "./pages/Categoria/CategoriaFormPage.jsx";

import MaterialesPage from "./pages/Materiales/MaterialesPage.jsx";
import MaterialFormPage from "./pages/Materiales/MaterialFormPage.jsx";

import ModelosPage from "./pages/Modelos/ModelosPage.jsx";
import ModelosFormPage from "./pages/Modelos/ModelosFormPage.jsx";
import ColorPage from "./pages/colores/ColorPage.jsx";
import ColorFormPage from "./pages/colores/ColorFormPage.jsx";

import  InsumosPage from "./pages/Insumos/InsumosPage.jsx";
import  InsumosFormPage from "./pages/Insumos/InsumoFormPage.jsx";

import CentrosTrabajoPage from "./pages/CentrosTrabajo/CentrosTrabajoPage.jsx";
import CentrosTrabajoFormPage from "./pages/CentrosTrabajo/CentroTrabajoFormPage.jsx";

import OperacionesPage from "./pages/Operaciones/OperacionesPage.jsx";
import OperacionesFormPage from "./pages/Operaciones/OperacionFormPage.jsx";

import ComprasPage from "./pages/Compras/ComprasPage.jsx";
import ComprasFormPage from "./pages/Compras/CompraFormPage.jsx";

import KardexPage from "./pages/Kardex/KardexPage"; 
import CompraDetallePage from "./pages/Compras/CompraDetallePage.jsx";

import ProductosPage from "./pages/Productos/ProductosPage";
import ProductoFormPage from "./pages/Productos/ProductoFormPage";
import ProductoDetallePage from "./pages/Productos/ProductoDetallePage";
import ProductoBOMPage from "./pages/Productos/ProductoBOMPage";
import ProductoInsumosBOMPage from "./pages/Productos/ProductoInsumosBOMPage";
import ProductoOperacionesBOMPage from "./pages/Productos/ProductoOperacionesBOMPage";

import VariantesPage from "./pages/Variantes/VariantesPage.jsx";
import VarianteFormPage from "./pages/Variantes/VarianteFromPage.jsx";

import ProductosCompletosPage from "./pages/ProductosCompletos/ProductosCompletosPage.jsx";

export default function App() {

  return (

    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

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

        <Route path="/nuevaCotizacion" element={<NuevaCotizacion />} />

        <Route path="/cotizaciones" element={<Cotizacion />} />

        {/* EMPLEADOS */}
        <Route path="/empleados/nuevo" element={<EmpleadoFormPage />} />
        <Route path="/empleados/:id" element={<EmpleadoFormPage />} />
        <Route path="/empleados" element={<EmpleadosPage />} />

        <Route path="/perfil" element={<PerfilPage />} />

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

        {/* CATEGORIA */}
        <Route path="/categorias" element={<CategoriaPage />} />
        <Route path="/categorias/nuevo" element={<CategoriaFormPage />} />
        <Route path="/categorias/:id" element={<CategoriaFormPage />} />

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
        <Route path="/insumos/nuevo" element={<InsumosFormPage />} />
        <Route path="/insumos/:id" element={<InsumosFormPage />} />

         {/* Centros de Trabajo */}
        <Route path="/centros-trabajo" element={<CentrosTrabajoPage />} />
        <Route path="/centros-trabajo/nuevo" element={<CentrosTrabajoFormPage />} />
        <Route path="/centros-trabajo/:id" element={<CentrosTrabajoFormPage />} />

        {/* Operaciones */}
        <Route path="/operaciones" element={<OperacionesPage />} />
        <Route path="/operaciones/nuevo" element={<OperacionesFormPage />} />
        <Route path="/operaciones/:id" element={<OperacionesFormPage />} />

         {/* Compras */}
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/compras/nueva" element={<ComprasFormPage />} />
        <Route path="/compras/:id" element={<ComprasFormPage />} />
        <Route path="/compras/:id/ver" element={<CompraDetallePage />} />

         {/*Kardex */}
        <Route path="/kardex" element={<KardexPage />} />
        <Route path="/kardex/insumo/:insumoId" element={<KardexPage />} />
        
         {/* Variantes */}
        <Route path="/variantes" element={<VariantesPage />} />
        <Route path="/variantes/nuevo" element={<VarianteFormPage />} />
        <Route path="/variantes/:id" element={<VarianteFormPage />} />

        {/* Productos */}
       <Route path="/productos" element={<ProductosPage />} />
        <Route path="/productos/nuevo" element={<ProductoFormPage />} />
        <Route path="/productos/:id" element={<ProductoFormPage />} />
        <Route path="/productos/:id/ver" element={<ProductoDetallePage />} />
        <Route path="/productos/:id/bom/insumos" element={<ProductoInsumosBOMPage />} />
        <Route path="/productos/:id/bom/operaciones" element={<ProductoOperacionesBOMPage />} />

        <Route path="/productos-completos" element={<ProductosCompletosPage />} />
        <Route path="/prueba/productos" element={<Navigate to="/productos-completos" replace />} />
      </Route>

      

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      

    </Routes>

  );

}
