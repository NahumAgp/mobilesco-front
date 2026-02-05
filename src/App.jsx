import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Tablero from "./pages/Tablero";
import Productos from "./pages/Productos";
import Proveedores from "./pages/proveedores.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Al entrar a /, manda a /tablero */}
        <Route path="/" element={<Navigate to="/tablero" replace />} />

        <Route path="/tablero" element={<Tablero />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/proveedores" element={<Proveedores />} />

        {/* opcional: 404 */}
        <Route path="*" element={<Navigate to="/tablero" replace />} />
      </Route>
    </Routes>
  );
}
