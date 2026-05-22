import OperacionForm from "./OperacionForm.jsx";

export default function OperacionModal({
  show,
  operacion,
  onClose,
  onSave,
  errores = {}
}) {

  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {operacion ? "Editar Operación" : "Nueva Operación"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <OperacionForm
              operacion={operacion}
              onSave={onSave}
              onCancel={onClose}
              errores={errores}
            />
          </div>
        </div>
      </div>
    </div>
  );
}