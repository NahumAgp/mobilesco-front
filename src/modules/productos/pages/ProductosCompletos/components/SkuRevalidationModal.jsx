import { useCallback, useEffect, useState } from "react";

import { corregirSkusProductos, validarSkusProductos } from "../../../services/productos.js";

const estadoBadge = {
  DESCUADRADO: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  CONFLICTO: "bg-danger-subtle text-danger border border-danger-subtle",
  NO_VALIDABLE: "bg-secondary-subtle text-secondary border border-secondary-subtle"
};

const estadoTexto = {
  DESCUADRADO: "Por corregir",
  CONFLICTO: "Conflicto",
  NO_VALIDABLE: "Clasificación incompleta"
};

export default function SkuRevalidationModal({ show, puedeCorregir, onClose, onCorrected }) {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const auditar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setMensaje("");
      setResultado(await validarSkusProductos());
    } catch (err) {
      setError(err?.message || "No se pudo realizar la validación de códigos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (show) auditar();
  }, [auditar, show]);

  const corregir = async () => {
    if (!window.confirm(`Se actualizarán ${resultado?.corregibles || 0} SKUs. ¿Deseas continuar?`)) return;
    try {
      setCorrigiendo(true);
      setError("");
      const respuesta = await corregirSkusProductos();
      setResultado(respuesta);
      setMensaje(`${respuesta?.actualizados || 0} SKUs fueron corregidos correctamente.`);
      await onCorrected?.();
    } catch (err) {
      setError(err?.message || "No se pudieron corregir los códigos.");
    } finally {
      setCorrigiendo(false);
    }
  };

  if (!show) return null;

  const detalles = Array.isArray(resultado?.detalles) ? resultado.detalles : [];

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="sku-validation-title">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title" id="sku-validation-title">Validación de códigos de producto</h5>
                <div className="small text-muted mt-1">
                  Compara cada SKU contra línea, familia, subfamilia, modelo, categoría, material y color.
                </div>
              </div>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body">
              {cargando ? (
                <div className="text-center text-muted py-5">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Revisando todos los productos...
                </div>
              ) : (
                <>
                  {error && <div className="alert alert-danger">{error}</div>}
                  {mensaje && <div className="alert alert-success">{mensaje}</div>}

                  {resultado && (
                    <>
                      <div className="row g-3 mb-4">
                        <div className="col-6 col-lg-3">
                          <div className="border rounded-3 p-3 h-100">
                            <div className="text-muted small">Revisados</div>
                            <div className="fs-4 fw-semibold">{resultado.total || 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-lg-3">
                          <div className="border border-success-subtle bg-success-subtle rounded-3 p-3 h-100">
                            <div className="text-success small">Correctos</div>
                            <div className="fs-4 fw-semibold text-success">{resultado.correctos || 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-lg-3">
                          <div className="border border-warning-subtle bg-warning-subtle rounded-3 p-3 h-100">
                            <div className="text-warning-emphasis small">Corregibles</div>
                            <div className="fs-4 fw-semibold text-warning-emphasis">{resultado.corregibles || 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-lg-3">
                          <div className="border border-danger-subtle bg-danger-subtle rounded-3 p-3 h-100">
                            <div className="text-danger small">Requieren revisión</div>
                            <div className="fs-4 fw-semibold text-danger">{resultado.bloqueados || 0}</div>
                          </div>
                        </div>
                      </div>

                      {detalles.length ? (
                        <div className="table-responsive border rounded-3">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Producto</th>
                                <th>SKU actual</th>
                                <th>SKU esperado</th>
                                <th>Resultado</th>
                                <th>Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles.map((detalle) => (
                                <tr key={detalle.productoId}>
                                  <td>
                                    <div className="fw-semibold">{detalle.productoNombre || "Sin nombre"}</div>
                                    <div className="small text-muted">ID {detalle.productoId}</div>
                                  </td>
                                  <td><code>{detalle.skuActual || "-"}</code></td>
                                  <td><code>{detalle.skuEsperado || "-"}</code></td>
                                  <td>
                                    <span className={`badge ${estadoBadge[detalle.estado] || "text-bg-secondary"}`}>
                                      {estadoTexto[detalle.estado] || detalle.estado}
                                    </span>
                                  </td>
                                  <td className="small text-muted">{detalle.motivo || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-success mb-0">
                          Todos los productos mantienen el formato correspondiente a su clasificación actual.
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
              <button type="button" className="btn btn-outline-primary" onClick={auditar} disabled={cargando || corrigiendo}>
                Volver a validar
              </button>
              {puedeCorregir && resultado?.corregibles > 0 && (
                <button type="button" className="btn productos-brand-primary" onClick={corregir} disabled={corrigiendo}>
                  {corrigiendo ? "Corrigiendo..." : `Corregir ${resultado.corregibles} códigos`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
