import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LineaProductoForm from "./LineaProductoForm.jsx";
import { obtenerLineaProductoPorId } from "../../services/lineaProducto.js";
import { obtenerFamilias } from "../../services/familias.js";

export default function LineaProductoFormPage() {
  const { id } = useParams(); // si existe, estamos editando
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const [lineaProducto, setLineaProducto] = useState(null);
  const [familias, setFamilias] = useState([]);
  const [cargandoFamilias, setCargandoFamilias] = useState(false);
  const [errorFamilias, setErrorFamilias] = useState("");

  useEffect(() => {
    const cargarLinea = async () => {
      if (!esEdicion) {
        setLineaProducto(null);
        return;
      }

      try {
        const data = await obtenerLineaProductoPorId(id);
        setLineaProducto(data || null);
      } catch {
        setLineaProducto(null);
      }
    };

    cargarLinea();
  }, [esEdicion, id]);

  useEffect(() => {
    const cargarFamilias = async () => {
      if (!esEdicion) {
        setFamilias([]);
        return;
      }

      try {
        setCargandoFamilias(true);
        setErrorFamilias("");

        const data = await obtenerFamilias();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : [];

        setFamilias(lista);
      } catch {
        setFamilias([]);
        setErrorFamilias("No se pudieron cargar las familias de esta línea.");
      } finally {
        setCargandoFamilias(false);
      }
    };

    cargarFamilias();
  }, [esEdicion, id]);

  const familiasDeEstaLinea = useMemo(() => {
    if (!id) return [];

    return familias.filter((familia) => {
      const lineaFamiliaId = familia.lineaId ?? familia.linea?.id ?? "";
      return String(lineaFamiliaId) === String(id);
    });
  }, [familias, id]);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">{esEdicion ? "Editar Línea de Producto" : "Nueva Línea de Producto"}</h3>

        <button className="btn btn-outline-secondary" onClick={() => navigate("/lineas-producto")}>
          Volver
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="card mb-4">
        <div className="card-body">
          {/* Reutilizamos el MISMO form */}
          <LineaProductoForm lineaProductoId={id} lineaProducto={lineaProducto} />
        </div>
      </div>

      {/* FAMILIAS */}
      {esEdicion && (
        <div className="card">
          <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Familias de esta línea</h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {familiasDeEstaLinea.length} familias
            </span>
          </div>
          <div className="card-body">
            {cargandoFamilias ? (
              <div className="text-muted">Cargando familias...</div>
            ) : errorFamilias ? (
              <div className="alert alert-warning mb-0">{errorFamilias}</div>
            ) : familiasDeEstaLinea.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familiasDeEstaLinea.map((familia) => (
                      <tr key={familia.id}>
                        <td>{familia.id}</td>
                        <td>{familia.codigo || "-"}</td>
                        <td>{familia.nombre || "-"}</td>
                        <td>
                          <span
                            className={
                              familia.activo
                                ? "badge bg-success-subtle text-success border border-success-subtle"
                                : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                            }
                          >
                            {familia.activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">
                Esta línea todavía no tiene familias asociadas.
              </div>
            )}
          </div>
        </div>
      )}

      {!esEdicion && (
        <div className="card">
          <div className="card-body text-muted">
            Guarda la línea para poder ver aquí sus familias asociadas.
          </div>
        </div>
      )}
    </div>
  );
}
