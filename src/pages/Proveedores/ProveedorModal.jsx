import ProveedorForm from "../../components/Proveedores/ProveedorForm.jsx";

// Recibimos props desde la página
export default function ProveedorModal({
  show,          // booleano → controla si se muestra
  proveedor,     // datos si estamos editando
  onClose,       // función para cerrar
  onSave,      // función para guardar
  errores        // errores del formulario
}) {

  // Si show es false, no renderizamos nada
  if (!show) return null;

  return (
    <>
      {/* FONDO OSCURO */}
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      >

        {/* CONTENEDOR CENTRAL */}
        <div className="modal-dialog modal-lg modal-dialog-centered">

          <div className="modal-content">

            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">
                {proveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            {/* BODY */}
            <div className="modal-body">

              <ProveedorForm
                proveedor={proveedor}
                onSave={onSave}
                onCancel={onClose}
                errores={errores}
              />


            </div>

          </div>

        </div>
      </div>
    </>
  );
}
