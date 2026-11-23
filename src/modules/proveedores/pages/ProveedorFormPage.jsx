import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProveedorForm from "../components/ProveedorForm.jsx";
import ProveedorCompras from "./ProveedorCompras.jsx";
import { obtenerProveedorPorId } from "../services/proveedores.js";

export default function ProveedorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const [proveedorCargado, setProveedorCargado] = useState(null);
  const proveedor = proveedorCargado?.id === id ? proveedorCargado.data : null;

  useEffect(() => {
    if (!esEdicion) return;
    let activo = true;
    obtenerProveedorPorId(id)
      .then((data) => { if (activo) setProveedorCargado({ id, data }); })
      .catch(() => { if (activo) setProveedorCargado({ id, data: null }); });
    return () => { activo = false; };
  }, [esEdicion, id]);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{esEdicion ? proveedor?.razonSocial || proveedor?.nombre || "Proveedor" : "Nuevo proveedor"}</h1>
          {esEdicion && <p className="text-muted mb-0">Historial de compras y datos del proveedor</p>}
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/proveedores")}>
          <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>Volver
        </button>
      </div>

      {esEdicion && <ProveedorCompras key={id} proveedorId={id} proveedorNombre={proveedor?.razonSocial || proveedor?.nombre} />}

      <section id="datos-proveedor" aria-label={esEdicion ? "Datos y edición del proveedor" : "Datos del proveedor"}>
        {esEdicion && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4 mb-2">
            <h2 className="h4 mb-0">Datos del proveedor</h2>
            {proveedor?.fechaUltimoContacto && (
              <span className="text-muted small">
                <i className="bi bi-clock-history me-1" aria-hidden="true"></i>
                Último contacto: {String(proveedor.fechaUltimoContacto).split("T")[0]}
              </span>
            )}
          </div>
        )}
        <ProveedorForm proveedorId={id} />
      </section>
    </div>
  );
}
