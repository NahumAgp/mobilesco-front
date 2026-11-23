import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerComprasPorProveedor } from "../../compras/services/compras.js";
import { getUser, hasPermission } from "../../auth/services/authService.js";
import { resumirComprasProveedor } from "../utils/resumenComprasProveedor.js";
import "./ProveedorCompras.css";

const moneda = (valor) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(valor || 0);
const fecha = (valor) => {
  if (!valor) return "—";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
};
const colorEstado = (estado) => ({
  BORRADOR: "secondary", PENDIENTE: "warning", RECIBIDA_PARCIAL: "info",
  RECIBIDA: "success", CANCELADA: "danger",
})[estado] || "secondary";

export default function ProveedorCompras({ proveedorId, proveedorNombre }) {
  const navigate = useNavigate();
  const usuario = getUser();
  const puedeVer = hasPermission(usuario, "VIEW_PURCHASES");
  const puedeCrear = hasPermission(usuario, "ACTION_PURCHASES_CREATE");
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(Boolean(proveedorId && puedeVer));
  const [error, setError] = useState("");
  const [verTodas, setVerTodas] = useState(false);

  useEffect(() => {
    if (!proveedorId || !puedeVer) return;
    let vigente = true;
    obtenerComprasPorProveedor(proveedorId)
      .then((datos) => {
        if (vigente) setCompras(Array.isArray(datos) ? datos : datos?.content || []);
      })
      .catch((caughtError) => {
        if (vigente) setError(caughtError.message || "No se pudo consultar el historial de compras.");
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [proveedorId, puedeVer]);

  const resumen = useMemo(() => resumirComprasProveedor(compras), [compras]);
  const maximoMes = Math.max(0, ...resumen.meses.map((mes) => mes.monto));
  const visibles = verTodas ? resumen.ordenadas : resumen.ordenadas.slice(0, 5);
  const nuevaCompra = () => navigate(`/compras/nueva?proveedorId=${encodeURIComponent(proveedorId)}`);

  return (
    <section className="proveedor-compras" aria-labelledby="proveedor-compras-titulo">
      <div className="proveedor-compras-cabecera">
        <div>
          <div className="proveedor-compras-kicker">ACTIVIDAD DEL PROVEEDOR</div>
          <h2 id="proveedor-compras-titulo">Historial de compras</h2>
          <p>{proveedorNombre || "Este proveedor"}</p>
        </div>
        {puedeCrear && puedeVer && <button type="button" className="btn btn-primary" onClick={nuevaCompra}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>Nueva compra
        </button>}
      </div>

      {!puedeVer ? <div className="proveedor-compras-aviso">Tu perfil no tiene permiso para consultar compras. Los datos del proveedor están disponibles más abajo.</div>
        : cargando ? <div className="proveedor-compras-aviso" role="status">Cargando historial de compras…</div>
          : error ? <div className="alert alert-warning m-3" role="alert">{error}</div>
            : <>
              <div className="proveedor-compras-indicadores">
                <div><span>Compras registradas</span><strong>{resumen.cantidad}</strong></div>
                <div><span>Monto no cancelado</span><strong>{moneda(resumen.monto)}</strong></div>
                <div><span>Promedio por compra</span><strong>{moneda(resumen.promedio)}</strong></div>
                <div><span>Última compra</span><strong>{fecha(resumen.ultimaFecha)}</strong></div>
              </div>

              <div className="proveedor-compras-graficas">
                <div className="proveedor-compras-grafica">
                  <div className="proveedor-compras-grafica-titulo"><h3>Importe por mes</h3><span>{resumen.cantidad ? "6 meses hasta la última compra" : "Últimos 6 meses"}</span></div>
                  <div className="proveedor-compras-barras" role="img" aria-label={`Importe mensual de compras no canceladas: ${resumen.meses.map((mes) => `${mes.etiqueta} ${mes.anio}, ${moneda(mes.monto)}`).join("; ")}`}>
                    {resumen.meses.map((mes) => <div className="proveedor-compras-columna" key={mes.clave}>
                      <div className="proveedor-compras-barra-pista" title={`${mes.etiqueta} ${mes.anio}: ${moneda(mes.monto)}`}>
                        <div className="proveedor-compras-barra" style={{ height: maximoMes && mes.monto > 0 ? `${mes.monto / maximoMes * 100}%` : "0%" }} />
                      </div>
                      <span>{mes.etiqueta} {String(mes.anio).slice(-2)}</span>
                    </div>)}
                  </div>
                  <p className="proveedor-compras-nota">Importes no cancelados, incluidos borradores y pendientes.</p>
                </div>
                <div className="proveedor-compras-grafica">
                  <div className="proveedor-compras-grafica-titulo"><h3>Estado de las compras</h3><span>{resumen.cantidad} en total</span></div>
                  <div className="proveedor-compras-estado-barra" role="img" aria-label={resumen.estados.map((estado) => `${estado.etiqueta}: ${estado.cantidad}`).join("; ")}>
                    {resumen.estados.map((estado) => <div key={estado.clave} className={`proveedor-compras-estado-${estado.clave}`}
                      style={{ width: resumen.cantidad ? `${estado.cantidad / resumen.cantidad * 100}%` : "0%" }} />)}
                  </div>
                  <div className="proveedor-compras-leyenda">{resumen.estados.map((estado) => <div key={estado.clave}>
                    <span className={`proveedor-compras-punto proveedor-compras-estado-${estado.clave}`} />
                    <span>{estado.etiqueta}</span><strong>{estado.cantidad}</strong>
                  </div>)}</div>
                </div>
              </div>

              <div className="proveedor-compras-lista">
                <div className="proveedor-compras-lista-titulo"><h3>Compras registradas</h3><span>De la más reciente a la más antigua</span></div>
                {resumen.cantidad === 0 ? <div className="proveedor-compras-vacio">
                  <i className="bi bi-cart-x" aria-hidden="true"></i>
                  <p>Aún no hay compras registradas para este proveedor.</p>
                  {puedeCrear && <button type="button" className="btn btn-primary" onClick={nuevaCompra}>Crear primera compra</button>}
                </div> : <>
                  <div className="table-responsive proveedor-compras-tabla"><table className="table table-hover align-middle mb-0">
                    <thead><tr><th>Folio</th><th>Fecha</th><th>Método de pago</th><th className="text-end">Total</th><th>Estado</th><th className="text-end">Detalle</th></tr></thead>
                    <tbody>{visibles.map((compra) => <tr key={compra.id}>
                      <td className="fw-semibold">{compra.folio || `#${compra.id}`}</td><td>{fecha(compra.fechaCompra)}</td>
                      <td>{compra.metodoPago || "—"}</td><td className="text-end fw-semibold">{moneda(compra.total)}</td>
                      <td><span className={`badge text-bg-${colorEstado(compra.estado)}`}>{compra.estado || "Sin estado"}</span></td>
                      <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/compras/${compra.id}/ver`)} aria-label={`Ver compra ${compra.folio || compra.id}`}>
                        <i className="bi bi-eye" aria-hidden="true"></i></button></td>
                    </tr>)}</tbody>
                  </table></div>
                  {resumen.cantidad > 5 && <button type="button" className="proveedor-compras-mas" onClick={() => setVerTodas((actual) => !actual)}>
                    {verTodas ? "Mostrar menos" : `Mostrar todas las compras (${resumen.cantidad})`}
                  </button>}
                </>}
              </div>
            </>}
    </section>
  );
}
