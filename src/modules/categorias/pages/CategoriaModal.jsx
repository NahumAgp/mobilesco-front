import CategoriaForm from "../../components/Categoria/CategoriaForm.jsx";

// Recibimos props desde la página
export default function CategoriaModal({
  show,          // booleano → controla si se muestra
  categoria,     // datos si estamos editando
  onClose,       // función para cerrar
  onSave,        // función para guardar
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
                {categoria ? "Editar Categoría" : "Nueva Categoría"}
              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            {/* BODY */}
            <div className="modal-body">

              <CategoriaForm
                categoria={categoria}
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