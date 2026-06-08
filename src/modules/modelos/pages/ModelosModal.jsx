// pages/Modelos/ModelosModal.jsx
import ModelosForm from "./ModelosForm.jsx";

export default function ModelosModal({
  show,
  modelo,
  onClose,
  onSave,
  errores = {}
}) {

  if (!show) return null;

  return (
    <div
      className="modal fade show modelos-modal-popout"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {modelo ? "Editar Modelo" : "Nuevo Modelo"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <ModelosForm
              modelo={modelo}
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
