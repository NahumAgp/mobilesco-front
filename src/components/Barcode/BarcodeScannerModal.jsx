import { useEffect, useRef, useState } from "react";
import "./BarcodeScannerModal.css";

export default function BarcodeScannerModal({
  open,
  title = "Escanear código de barras",
  description = "Coloca el cursor en el campo y usa la pistola lectora. Al terminar enviará Enter.",
  onDetected,
  onClose
}) {
  const inputRef = useRef(null);
  const detectedCallbackRef = useRef(onDetected);
  const closeCallbackRef = useRef(onClose);
  const [codigoManual, setCodigoManual] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    detectedCallbackRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    closeCallbackRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setCodigoManual("");
    setErrorMessage("");

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const procesarCodigo = (codigo) => {
    const valor = codigo.trim();
    if (!valor) {
      setErrorMessage("Escanea o escribe un código antes de presionar Enter.");
      return;
    }

    setErrorMessage("");
    detectedCallbackRef.current(valor);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    procesarCodigo(codigoManual);
  };

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="barcode-scanner-header">
          <div>
            <div className="barcode-scanner-kicker">Lectura por pistola</div>
            <h5 className="mb-0">{title}</h5>
            <p className="mb-0">{description}</p>
          </div>
          <button type="button" className="btn btn-light btn-sm" onClick={() => closeCallbackRef.current()}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="barcode-scanner-body">
          <div className="barcode-scanner-panel">
            <div className="barcode-scanner-strip" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="barcode-scanner-instructions">
              <div className="barcode-scanner-icon">
                <i className="bi bi-upc-scan"></i>
              </div>
              <div>
                <div className="fw-bold">Escanea el código y presiona Enter</div>
                <small className="text-muted">
                  La pistola funciona como teclado: captura el número, agrega Enter y el sistema lo tomará automáticamente.
                </small>
              </div>
            </div>
          </div>

          <form className="barcode-scanner-manual mt-3" onSubmit={handleSubmit}>
            <label className="form-label fw-semibold">Código leído</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-upc"></i>
              </span>
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    procesarCodigo(codigoManual);
                  }
                }}
                placeholder="Escanea aquí o pega el código"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="submit" className="btn btn-primary" disabled={!codigoManual.trim()}>
                Procesar
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="alert alert-warning mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {errorMessage}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-light" onClick={() => closeCallbackRef.current()}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
