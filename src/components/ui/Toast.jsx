import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div
      className={`toast-container position-fixed top-0 end-0 p-3`}
      style={{ zIndex: 9999 }}
    >
      <div className={`toast show text-white bg-${type}`}>
        <div className="d-flex">
          <div className="toast-body">
            {message}
          </div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            onClick={onClose}
          ></button>
        </div>
      </div>
    </div>
  );
}
