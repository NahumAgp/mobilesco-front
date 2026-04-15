// pages/Proveedores/ProveedorFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import ProveedorForm from "../../components/Proveedores/ProveedorForm.jsx";
import ProveedorCompras from "./ProveedorCompras.jsx"; // 👈 Importar el nuevo componente
import { useState, useEffect } from "react";
import { obtenerProveedorPorId } from "../../services/proveedores.js";

export default function ProveedorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  
  const [proveedor, setProveedor] = useState(null);

  // Cargar datos del proveedor para obtener el nombre
  useEffect(() => {
    if (esEdicion) {
      cargarProveedor();
    }
  }, [id]);

  const cargarProveedor = async () => {
    try {
      const data = await obtenerProveedorPorId(id);
      setProveedor(data);
    } catch (error) {
      console.error("Error cargando proveedor:", error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/proveedores")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>

      {/* FORMULARIO DEL PROVEEDOR */}
      <div className="card mb-4">
        <div className="card-body">
          <ProveedorForm proveedorId={id} />
        </div>
      </div>

      {/* 👇 COMPRAS DEL PROVEEDOR - solo visible en edición */}
      {esEdicion && (
        <div className="mt-4">
          <ProveedorCompras 
            proveedorId={id} 
            proveedorNombre={proveedor?.razonSocial || proveedor?.nombre}
          />
        </div>
      )}
    </div>
  );
}