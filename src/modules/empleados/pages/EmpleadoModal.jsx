import React from "react";
import PropTypes from "prop-types";

export default function EmpleadoModal({ empleado, onClose, onEditar }) {
  if (!empleado) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleString('es-MX');
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalles del Empleado</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              {/* Foto */}
              <div className="col-md-4 text-center mb-3">
                {empleado.fotoUrl ? (
                  <img 
                    src={empleado.fotoUrl} 
                    alt="foto"
                    className="img-fluid rounded-circle"
                    style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                       style={{ width: '150px', height: '150px' }}>
                    <i className="bi bi-person display-1 text-secondary"></i>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="col-md-8">
                <h4>{empleado.nombre} {empleado.apellidoPaterno} {empleado.apellidoMaterno}</h4>
                
                <div className="mt-3">
                  <p><strong>ID:</strong> #{empleado.id}</p>
                  <p><strong>Teléfono:</strong> {empleado.telefono || 'No registrado'}</p>
                  <p><strong>Email:</strong> {empleado.email || 'No registrado'}</p>
                  <p>
                    <strong>Estatus:</strong>{' '}
                    {empleado.activo ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </p>
                  <p><strong>Fecha de registro:</strong> {formatearFecha(empleado.fechaRegistro)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                onEditar(empleado);
                onClose();
              }}
            >
              Editar Empleado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

EmpleadoModal.propTypes = {
  empleado: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEditar: PropTypes.func.isRequired
};