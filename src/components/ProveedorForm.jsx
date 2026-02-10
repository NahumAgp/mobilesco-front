import { useState } from 'react';

function formInicial(proveedor) {
 

  return {
    
    razonSocial: proveedor?.razonSocial ?? '',
    rfc: proveedor?.rfc ?? '',
    nombre: proveedor?.nombre ?? '',
    direccion: proveedor?.direccion ?? '',
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
//console.log('errores:', errores); <-- ver errores en consola para debug

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

            {/* Razon Social */}
            <div className="col-md-4">
              <label className="form-label">Razon Social</label>
              <input
                className={`form-control ${errores.razonSocial ? 'is-invalid' : ''}`}
                name="razonSocial"
                value={form.razonSocial}
                onChange={handleChange}
              />
              {errores.razonSocial && <div className="invalid-feedback">{errores.razonSocial}</div>}
            </div>

            {/* RFC */}
            <div className="col-md-4">
              <label className="form-label">RFC</label>
              <input
                className={`form-control ${errores.rfc ? 'is-invalid' : ''}`}
                name="rfc"
                value={form.rfc}
                onChange={handleChange}
              />
              {errores.rfc && <div className="invalid-feedback">{errores.rfc}</div>}
            </div>

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

             {/* Direccion */}
            <div className="col-md-4">
              <label className="form-label">Direccion</label>
              <input
                className={`form-control ${errores.direccion ? 'is-invalid' : ''}`}
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
              />
              {errores.direccion && <div className="invalid-feedback">{errores.direccion}</div>}
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

            {/* Activo 
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
            </div> */}

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
