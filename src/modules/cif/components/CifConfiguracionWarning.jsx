export default function CifConfiguracionWarning({
  title = "Falta la configuracion CIF",
  message,
  actionLabel = "Ir a configuracion CIF",
  onAction,
  className = "",
}) {
  return (
    <div className={`producto-cif-warning ${className}`.trim()}>
      <div className="d-flex align-items-start gap-3">
        <div className="producto-cif-warning-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <div className="flex-grow-1">
          <div className="text-uppercase small fw-bold producto-cif-warning-kicker">Configuracion pendiente</div>
          <h5 className="mb-2">{title}</h5>
          {message && <p className="mb-3">{message}</p>}
          {onAction && (
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn producto-cif-warning-button" onClick={onAction}>
                <i className="bi bi-sliders2 me-2" />
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
