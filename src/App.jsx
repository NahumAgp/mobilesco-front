import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Tablero from "./pages/Tablero";
import Productos from "./pages/Productos";
import Proveedores from "./pages/proveedores.jsx";
import Insumos from "./pages/Insumos.jsx";
import UnidadMedida from "./pages/UnidadMedida.jsx";
import NuevaCotizacion from "./pages/NuevaCotizacion.jsx";
import Cotizacion from "./pages/Cotizaciones.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Al entrar a /, manda a /tablero */}
        <Route path="/" element={<Navigate to="/tablero" replace />} />

        <Route path="/tablero" element={<Tablero />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/insumos" element= {<Insumos /> } />
        <Route path="/unidadMedida" element={<UnidadMedida/>}/>
        <Route path="/nuevaCotizacion" element={<NuevaCotizacion />}/>
        <Route path="/cotizaciones" element= {<Cotizacion />} />

        {/* opcional: 404 */}
        <Route path="*" element={<Navigate to="/tablero" replace />} />
      </Route>
    </Routes>
  );
}
