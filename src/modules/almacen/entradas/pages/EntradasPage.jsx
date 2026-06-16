import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../../components/ui/Toast.jsx";
import { obtenerEntradas } from "../services/entradas.js";

function formatoFecha(valor) {
  if (!valor) return "--";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function colorEstado(estado) {
  switch (estado) {
    case "RECIBIDA":
      return "success";
    case "RECIBIDA_PARCIAL":
      return "warning";
    case "POR_CERRAR":
      return "info";
    case "CANCELADA":
      return "danger";
    default:
      return "secondary";
  }
}

function numero(valor) {
  const normalizado = Number(valor || 0);
  return Number.isFinite(normalizado) ? normalizado : 0;
}

function getPendienteDetalle(detalle) {
  if (detalle.cantidadPendiente !== null && detalle.cantidadPendiente !== undefined) {
    return numero(detalle.cantidadPendiente);
  }

  return Math.max(numero(detalle.cantidad) - numero(detalle.cantidadRecibida), 0);
}

function getResumenEntrada(entrada) {
  const detalles = Array.isArray(entrada.detalles) ? entrada.detalles : [];

  return detalles.reduce(
    (acc, detalle) => ({
      totalComprado: acc.totalComprado + numero(detalle.cantidad),
      totalRecibido: acc.totalRecibido + numero(detalle.cantidadRecibida),
      totalPendiente: acc.totalPendiente + getPendienteDetalle(detalle)
    }),
    { totalComprado: 0, totalRecibido: 0, totalPendiente: 0 }
  );
}

function getEstadoOperativo(entrada) {
  if (entrada.estado === "CANCELADA" || entrada.estado === "RECIBIDA") {
    return entrada.estado;
  }

  const detalles = Array.isArray(entrada.detalles) ? entrada.detalles : [];
  if (detalles.length === 0) {
    return entrada.estado || "PENDIENTE";
  }

  const resumen = getResumenEntrada(entrada);
  if (resumen.totalComprado > 0 && resumen.totalPendiente <= 0) {
    return "POR_CERRAR";
  }

  if (resumen.totalRecibido > 0) {
    return "RECIBIDA_PARCIAL";
  }

  return entrada.estado || "PENDIENTE";
}

function etiquetaEstado(estado) {
  return estado === "POR_CERRAR" ? "POR CERRAR" : estado;
}

export default function EntradasPage() {
  const navigate = useNavigate();
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await obtenerEntradas();
        setEntradas(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando entradas:", error);
        setToastType("danger");
        setToastMessage("No se pudieron cargar las entradas");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const entradasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return entradas.filter((entrada) => {
      const coincideTexto = !termino ||
        entrada.folio?.toLowerCase().includes(termino) ||
        entrada.proveedorRazonSocial?.toLowerCase().includes(termino) ||
        entrada.proveedorRfc?.toLowerCase().includes(termino) ||
        entrada.numeroDocumento?.toLowerCase().includes(termino) ||
        entrada.entregadoPor?.toLowerCase().includes(termino);

      const estadoOperativo = getEstadoOperativo(entrada);
      const coincideEstado = filtroEstado === "TODOS" || estadoOperativo === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [busqueda, entradas, filtroEstado]);

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Entradas"
        subtitle="Recepción de compras y actualización de stock"
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate("/compras")}>
            <i className="bi bi-cart-check me-2"></i>
            Ir a compras
          </button>
        }
      />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-7">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por folio, proveedor, RFC, documento o entregante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RECIBIDA_PARCIAL">Parciales</option>
                <option value="POR_CERRAR">Por cerrar</option>
                <option value="RECIBIDA">Recibidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("TODOS");
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Cargando entradas...</div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Folio</th>
                  <th>Proveedor</th>
                  <th>Entregado por</th>
                  <th>Estado</th>
                  <th>Fecha compra</th>
                  <th className="text-end">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entradasFiltradas.length > 0 ? entradasFiltradas.map((entrada) => {
                  const estadoOperativo = getEstadoOperativo(entrada);
                  const color = colorEstado(estadoOperativo);
                  const cerrada = estadoOperativo === "CANCELADA" || estadoOperativo === "RECIBIDA";

                  return (
                    <tr key={entrada.id}>
                      <td className="fw-semibold">{entrada.folio}</td>
                      <td>
                        <div>{entrada.proveedorRazonSocial}</div>
                        <small className="text-muted">{entrada.proveedorRfc}</small>
                      </td>
                      <td>{entrada.entregadoPor || "--"}</td>
                      <td>
                        <span className={`badge bg-${color}-subtle text-${color} border border-${color}-subtle`}>
                          {etiquetaEstado(estadoOperativo)}
                        </span>
                      </td>
                      <td>{formatoFecha(entrada.fechaCompra)}</td>
                      <td className="text-end fw-semibold">${Number(entrada.total || 0).toFixed(2)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${estadoOperativo === "POR_CERRAR" ? "btn-outline-primary" : "btn-primary"}`}
                          disabled={cerrada}
                          onClick={() => navigate(`/almacen/entradas/${entrada.id}`)}
                        >
                          {estadoOperativo === "POR_CERRAR" ? "Cerrar" : "Recibir"}
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No hay entradas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
