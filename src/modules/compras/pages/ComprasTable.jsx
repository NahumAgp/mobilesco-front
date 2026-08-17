import CatalogTable, { CatalogEmptyState } from "../../../components/ui/CatalogTable.jsx";

const ESTADO_TONO = {
  BORRADOR: "secondary",
  PENDIENTE: "warning",
  RECIBIDA_PARCIAL: "info",
  RECIBIDA: "success",
  CANCELADA: "danger"
};

const ESTADO_TEXTO = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  RECIBIDA_PARCIAL: "Recibida parcialmente",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada"
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  }).format(value || 0);

const formatDate = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
    : "-";

export default function ComprasTable({
  data,
  onVer,
  onEliminar,
  onConfirmar,
  puedeEliminar = false,
  puedeConfirmar = false
}) {
  return (
    <CatalogTable>
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light catalog-table-head">
          <tr>
            <th>ID</th>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Método de pago</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data?.length > 0 ? (
            data.map((compra) => {
              const tono = ESTADO_TONO[compra.estado] || "secondary";
              return (
                <tr
                  key={compra.id}
                  className={[
                    "catalog-table-row",
                    compra.estado === "CANCELADA" ? "table-secondary" :
                    compra.estado === "RECIBIDA_PARCIAL" ? "table-info" :
                    compra.estado === "RECIBIDA" ? "table-success" : ""
                  ].filter(Boolean).join(" ")}
                  onClick={() => onVer?.(compra)}
                >
                  <td>{compra.id}</td>
                  <td><span className="fw-semibold">{compra.folio}</span></td>
                  <td>{formatDate(compra.fechaCompra)}</td>
                  <td>
                    <span className="fw-semibold">{compra.proveedorRazonSocial}</span>
                    <small className="text-muted d-block">{compra.proveedorRfc}</small>
                  </td>
                  <td><small>{compra.metodoPago || "-"}</small></td>
                  <td className="text-end fw-bold">{formatCurrency(compra.total)}</td>
                  <td>
                    <span className={`badge bg-${tono}-subtle text-${tono} border border-${tono}-subtle`}>
                      {ESTADO_TEXTO[compra.estado] || compra.estado}
                    </span>
                  </td>
                  <td className="catalog-actions">
                    <div className="btn-group btn-group-sm" role="group">
                      {compra.estado === "BORRADOR" && puedeConfirmar && (
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={(event) => {
                            event.stopPropagation();
                            onConfirmar?.(compra);
                          }}
                          title="Confirmar borrador"
                        >
                          <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
                          Confirmar
                        </button>
                      )}
                      <a
                        className="btn catalog-brand-outline"
                        href={`/compras/${compra.id}/ver`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye me-1" aria-hidden="true"></i>
                        Ver
                      </a>
                      {["BORRADOR", "PENDIENTE"].includes(compra.estado) && puedeEliminar && (
                        <button
                          type="button"
                          className="btn catalog-brand-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEliminar(compra);
                          }}
                          title="Eliminar compra"
                        >
                          <i className="bi bi-trash me-1" aria-hidden="true"></i>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <CatalogEmptyState
              colSpan={8}
              icon="bi-cart"
              title="No hay compras registradas"
              description="Ajusta los filtros o registra una nueva compra."
            />
          )}
        </tbody>
      </table>
    </CatalogTable>
  );
}
