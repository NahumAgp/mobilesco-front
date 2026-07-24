import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  obtenerClasificacionesCliente,
  obtenerCliente,
} from "../services/clientes";

const inicial = {
  clasificacion: "PROSPECTO",
  tipoPersona: "MORAL",
  nombre: "",
  razonSocial: "",
  nombreComercial: "",
  rfc: "",
  contactoNombre: "",
  correo: "",
  telefono: "",
  whatsapp: "",
  estado: "",
  ciudad: "",
  colonia: "",
  calle: "",
  numeroExterior: "",
  numeroInterior: "",
  codigoPostal: "",
  diasCredito: 0,
  limiteCredito: 0,
  notas: "",
  activo: true,
};

export default function ClienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);
  const [form, setForm] = useState(inicial);
  const [codigo, setCodigo] = useState("");
  const [clasificaciones, setClasificaciones] = useState([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerClasificacionesCliente().then(setClasificaciones).catch(() => setClasificaciones([]));
  }, []);

  useEffect(() => {
    if (!esEdicion) return;
    obtenerCliente(id)
      .then((cliente) => {
        setCodigo(cliente.codigo);
        setForm({ ...inicial, ...cliente });
      })
      .catch((err) => setError(err?.message || "No fue posible cargar el cliente"))
      .finally(() => setCargando(false));
  }, [esEdicion, id]);

  const cambiar = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    try {
      setGuardando(true);
      setError("");
      const payload = {
        ...form,
        diasCredito: Number(form.diasCredito || 0),
        limiteCredito: Number(form.limiteCredito || 0),
        rfc: form.rfc.trim() || null,
      };
      if (esEdicion) await actualizarCliente(id, payload);
      else await crearCliente(payload);
      navigate("/clientes");
    } catch (err) {
      setError(err?.message || "No fue posible guardar el cliente");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!window.confirm("¿Eliminar este cliente? Si tendrá historial comercial, es preferible desactivarlo.")) return;
    try {
      await eliminarCliente(id);
      navigate("/clientes");
    } catch (err) {
      setError(err?.message || "No fue posible eliminar el cliente");
    }
  };

  if (cargando) {
    return <div className="container py-5 text-center"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-link px-0 text-decoration-none" onClick={() => navigate("/clientes")}>
            <i className="bi bi-arrow-left me-2"></i>Volver a clientes
          </button>
          <h2 className="mb-1">{esEdicion ? "Editar cliente" : "Nuevo cliente"}</h2>
          <p className="text-muted mb-0">{codigo || "El código se generará automáticamente al guardar."}</p>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={guardar}>
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3"><h5 className="mb-0">Identidad comercial</h5></div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Clasificación comercial *</label>
                <select className="form-select" name="clasificacion" value={form.clasificacion} onChange={cambiar} required>
                  {clasificaciones.map((item) => <option key={item.codigo} value={item.codigo}>{item.etiqueta}</option>)}
                </select>
                <div className="form-text">Puede modificarse conforme evolucione la relación comercial.</div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Tipo de persona *</label>
                <select className="form-select" name="tipoPersona" value={form.tipoPersona} onChange={cambiar}>
                  <option value="FISICA">Persona física</option>
                  <option value="MORAL">Persona moral</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">RFC</label>
                <input className="form-control text-uppercase" name="rfc" value={form.rfc || ""} onChange={cambiar} minLength="12" maxLength="13" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Nombre</label>
                <input className="form-control" name="nombre" value={form.nombre || ""} onChange={cambiar} maxLength="150" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Razón social</label>
                <input className="form-control" name="razonSocial" value={form.razonSocial || ""} onChange={cambiar} maxLength="180" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Nombre comercial</label>
                <input className="form-control" name="nombreComercial" value={form.nombreComercial || ""} onChange={cambiar} maxLength="180" />
              </div>
            </div>
            <div className="form-text mt-3">Captura al menos Nombre, Razón social o Nombre comercial.</div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3"><h5 className="mb-0">Contacto y ubicación</h5></div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4"><label className="form-label">Persona de contacto</label><input className="form-control" name="contactoNombre" value={form.contactoNombre || ""} onChange={cambiar} /></div>
              <div className="col-md-4"><label className="form-label">Correo</label><input type="email" className="form-control" name="correo" value={form.correo || ""} onChange={cambiar} /></div>
              <div className="col-md-2"><label className="form-label">Teléfono</label><input className="form-control" name="telefono" value={form.telefono || ""} onChange={cambiar} /></div>
              <div className="col-md-2"><label className="form-label">WhatsApp</label><input className="form-control" name="whatsapp" value={form.whatsapp || ""} onChange={cambiar} /></div>
              <div className="col-md-4"><label className="form-label">Calle</label><input className="form-control" name="calle" value={form.calle || ""} onChange={cambiar} /></div>
              <div className="col-md-2"><label className="form-label">Núm. exterior</label><input className="form-control" name="numeroExterior" value={form.numeroExterior || ""} onChange={cambiar} /></div>
              <div className="col-md-2"><label className="form-label">Núm. interior</label><input className="form-control" name="numeroInterior" value={form.numeroInterior || ""} onChange={cambiar} /></div>
              <div className="col-md-4"><label className="form-label">Colonia</label><input className="form-control" name="colonia" value={form.colonia || ""} onChange={cambiar} /></div>
              <div className="col-md-4"><label className="form-label">Ciudad / municipio</label><input className="form-control" name="ciudad" value={form.ciudad || ""} onChange={cambiar} /></div>
              <div className="col-md-4"><label className="form-label">Estado</label><input className="form-control" name="estado" value={form.estado || ""} onChange={cambiar} /></div>
              <div className="col-md-2"><label className="form-label">Código postal</label><input className="form-control" name="codigoPostal" value={form.codigoPostal || ""} onChange={cambiar} /></div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3"><h5 className="mb-0">Condiciones comerciales</h5></div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3"><label className="form-label">Días de crédito</label><input type="number" min="0" className="form-control" name="diasCredito" value={form.diasCredito} onChange={cambiar} /></div>
              <div className="col-md-3"><label className="form-label">Límite de crédito</label><input type="number" min="0" step="0.01" className="form-control" name="limiteCredito" value={form.limiteCredito} onChange={cambiar} /></div>
              <div className="col-md-6"><label className="form-label">Notas comerciales</label><textarea className="form-control" rows="3" name="notas" value={form.notas || ""} onChange={cambiar} maxLength="1000" /></div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center bg-white shadow-sm rounded p-3 flex-wrap gap-3">
          <div className="d-flex gap-3 align-items-center">
            <div className="form-check form-switch">
              <input className="form-check-input" id="clienteActivo" type="checkbox" name="activo" checked={form.activo} onChange={cambiar} />
              <label className="form-check-label" htmlFor="clienteActivo">Cliente activo</label>
            </div>
            {esEdicion ? <button type="button" className="btn btn-outline-danger" onClick={eliminar}>Eliminar</button> : null}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={() => navigate("/clientes")}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-4" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
