// pages/Insumos/InsumoFormPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import InsumoForm from "./InsumoForm.jsx";
import { obtenerHistorialInsumo } from "../../services/kardex.js";
import KardexTable from "../Kardex/KardexTable.jsx"; // 👈 Importar la tabla de Kardex
import Card from "../../components/ui/Card.jsx";

export default function InsumoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  
  const [movimientos, setMovimientos] = useState([]);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Cargar movimientos del Kardex cuando estamos en edición
  useEffect(() => {
    if (esEdicion) {
      cargarKardex();
    }
  }, [id]);

  const cargarKardex = async () => {
    try {
      setLoadingKardex(true);
      const data = await obtenerHistorialInsumo(id);
      setMovimientos(data || []);
    } catch (error) {
      console.error("Error cargando kardex:", error);
    } finally {
      setLoadingKardex(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Insumo" : "Nuevo Insumo"}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/insumos")}>
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>

      {/* FORMULARIO DE INSUMO */}
      <div className="card mb-4">
        <div className="card-body">
          <InsumoForm insumoId={id} />
        </div>
      </div>

      {/* 👇 SECCIÓN DE KARDEX - solo visible en edición */}
      {esEdicion && (
        <div className="mt-4">
          <Card 
            title="Movimientos de Inventario" 
            icon="bi-journal-text"
            headerClassName="bg-light"
          >
            {loadingKardex ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2 text-muted">Cargando movimientos...</p>
              </div>
            ) : movimientos.length > 0 ? (
              <>
                <KardexTable movimientos={movimientos} insumoNombre="este insumo" />
                <div className="text-end mt-3">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => navigate(`/kardex?insumoId=${id}`)}
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i>
                    Ver Kardex completo
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-journal-x fs-1 d-block mb-3 text-secondary"></i>
                <p className="text-muted">No hay movimientos registrados para este insumo</p>
                <p className="small text-muted">
                  Los movimientos aparecerán cuando se registren compras, 
                  ajustes de inventario o consumos en producción.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}