import { useEffect, useRef } from "react";

export default function ConfirmationDialog({
  open,
  title = "Confirmar acción",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onCancel?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="catalog-confirm-backdrop" role="presentation" onMouseDown={() => !loading && onCancel?.()}>
      <section
        className="catalog-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="catalog-confirm-title"
        aria-describedby="catalog-confirm-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className={`catalog-confirm-icon catalog-confirm-icon--${variant}`} aria-hidden="true">
          <i className={`bi ${variant === "danger" ? "bi-exclamation-triangle" : "bi-question-circle"}`}></i>
        </span>
        <div className="catalog-confirm-content">
          <h2 id="catalog-confirm-title">{title}</h2>
          <p id="catalog-confirm-message">{message}</p>
        </div>
        <div className="catalog-confirm-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn catalog-brand-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
