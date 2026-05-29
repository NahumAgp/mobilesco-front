import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { getUser } from "../../auth/services/authService";
import { actualizarConceptoCif, crearConceptoCif, obtenerConceptoCif } from "../services/cif";

const ROLES_GESTION_CIF = ["ADMIN", "SUPER_ADMIN", "SUBDIRECCION_ADMINISTRATIVA"];
const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  tipo: "FIJO",
  periodicidad: "MENSUAL",
  montoMensual: "",
  activo: true,
};

function normalizarConcepto(concepto) {
  return {
    nombre: concepto.nombre || "",
    descripcion: concepto.descripcion || "",
    tipo: concepto.tipo || "FIJO",
    periodicidad: concepto.periodicidad || "MENSUAL",
    montoMensual: concepto.monto ?? concepto.montoMensual ?? "",
    activo: concepto.activo ?? true,
  };
}

export default function CifFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const user = getUser();
  const puedeGestionar = user?.roles?.some((rol) => ROLES_GESTION_CIF.includes(rol));
  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!esEdicion) return;

    const cargarConcepto = async () => {
      try {
        setLoading(true);
        const concepto = await obtenerConceptoCif(id);
        setForm(normalizarConcepto(concepto));
      } catch (error) {
        setToast({ message: error.message || "No fue posible cargar el concepto CIF.", type: "danger" });
      } finally {
        setLoading(false);
      }
    };

    cargarConcepto();
  }, [id, esEdicion]);

  const manejarCambio = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    if (!puedeGestionar) return;

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || "",
      tipo: form.tipo,
      periodicidad: form.periodicidad,
      baseDistribucion: "HORAS_MOD",
      montoMensual: Number(form.montoMensual),
      activo: form.activo,
    };

    try {
      setGuardando(true);
      if (esEdicion) {
        await actualizarConceptoCif(id, payload);
        setToast({ message: "Concepto CIF actualizado.", type: "success" });
      } else {
        await crearConceptoCif(payload);
        setToast({ message: "Concepto CIF creado.", type: "success" });
      }
      window.setTimeout(() => navigate("/cif"), 500);
    } catch (error) {
      setToast({ message: error.message || "No fue posible guardar el concepto CIF.", type: "danger" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: "" })} />

      <PageHeader
        title={esEdicion ? "Editar CIF" : "Nuevo CIF"}
        subtitle="Captura el concepto indirecto que se prorratea por minuto productivo"
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate("/cif")}>
            <i className="bi bi-arrow-left me-2" />
            Volver
          </button>
        }
      />

      {!puedeGestionar && (
        <div className="alert alert-warning">No tienes permisos para gestionar conceptos CIF.</div>
      )}

      {loading ? (
        <div className="alert alert-info">Cargando concepto CIF...</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <form onSubmit={guardar}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" value={form.nombre} disabled={!puedeGestionar} onChange={(e) => manejarCambio("nombre", e.target.value)} required />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.tipo} disabled={!puedeGestionar} onChange={(e) => manejarCambio("tipo", e.target.value)}>
                    <option value="FIJO">Fijo</option>
                    <option value="VARIABLE">Variable</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Periodo</label>
                  <select className="form-select" value={form.periodicidad} disabled={!puedeGestionar} onChange={(e) => manejarCambio("periodicidad", e.target.value)}>
                    <option value="SEMANAL">Semanal</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Monto</label>
                  <input type="number" min="0" step="0.01" className="form-control" value={form.montoMensual} disabled={!puedeGestionar} onChange={(e) => manejarCambio("montoMensual", e.target.value)} required />
                </div>
                <div className="col-12 col-md-9">
                  <label className="form-label">Descripcion</label>
                  <input className="form-control" value={form.descripcion} disabled={!puedeGestionar} onChange={(e) => manejarCambio("descripcion", e.target.value)} />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/cif")}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={!puedeGestionar || guardando}>
                  <i className="bi bi-save me-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
