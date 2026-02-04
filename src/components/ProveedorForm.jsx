import { useState } from 'react';

function formInicial(proveedor) {
  return {
    nombre: proveedor?.nombre ?? '',
    contacto: proveedor?.contacto ?? '',
    correo: proveedor?.correo ?? '',
    telefono: proveedor?.telefono ?? '',
    activo: proveedor?.activo ?? true,
  };
}

export default function ProveedorForm({
  onGuardar,
  onCancelar,
  errores = {},
  proveedor = null,
}) {
  const [form, setForm] = useState(() => formInicial(proveedor));

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar(form);
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">
          {proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Nombre */}
            <div className="col-md-4">
              <label className="form-label">Nombre</label>
              <input
                className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            {/* Contacto */}
            <div className="col-md-4">
              <label className="form-label">Contacto</label>
              <input
                className={`form-control ${errores.contacto ? 'is-invalid' : ''}`}
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
              />
              {errores.contacto && <div className="invalid-feedback">{errores.contacto}</div>}
            </div>

            {/* Correo */}
            <div className="col-md-4">
              <label className="form-label">Correo</label>
              <input
                className={`form-control ${errores.correo ? 'is-invalid' : ''}`}
                name="correo"
                value={form.correo}
                onChange={handleChange}
              />
              {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
            </div>

            {/* Teléfono */}
            <div className="col-md-4">
              <label className="form-label">Teléfono</label>
              <input
                className={`form-control ${errores.telefono ? 'is-invalid' : ''}`}
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
              />
              {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
            </div>

            {/* Activo */}
            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <label className="form-check-label">Activo</label>
              </div>
            </div>

            {/* Botones */}
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-success" type="submit">
                Guardar
              </button>
              <button className="btn btn-secondary" type="button" onClick={onCancelar}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
