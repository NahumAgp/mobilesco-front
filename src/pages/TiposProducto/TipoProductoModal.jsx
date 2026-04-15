// pages/TiposProducto/TipoProductoModal.jsx
import TipoProductoForm from "./components/TipoProductoForm.jsx";

export default function TipoProductoModal({
  show,
  tipo,
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
              {tipo ? "Editar Tipo de Producto" : "Nuevo Tipo de Producto"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <TipoProductoForm
              tipo={tipo}
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