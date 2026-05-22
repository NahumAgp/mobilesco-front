import InsumoForm from "./components/InsumoForm.jsx";

export default function InsumoModal({
  show,
  insumo,
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
              {insumo ? "Editar Insumo" : "Nuevo Insumo"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <InsumoForm
              insumo={insumo}
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