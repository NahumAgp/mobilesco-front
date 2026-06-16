import React, { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { obtenerCompraPorId } from "../../compras/services/compras.js";
import { obtenerHistorialInsumo, obtenerMovimientosPorPeriodo, obtenerCostoPromedio } from "../services/kardex.js";
import KardexTable from "./KardexTable.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import Card from "../../../components/ui/Card.jsx";

export default function KardexPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const insumoIdParam = new URLSearchParams(location.search).get("insumoId");
  const esConsultaEspecifica = Boolean(insumoIdParam);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [costoPromedio, setCostoPromedio] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [usarFiltroFechas, setUsarFiltroFechas] = useState(false);

  const obtenerNombreProveedorCompra = (compra) => {
    if (!compra) return "";
    if (compra.proveedorRazonSocial) return compra.proveedorRazonSocial;
    if (compra.proveedorNombreCompleto) return compra.proveedorNombreCompleto;
    return [compra.proveedorNombre, compra.proveedorApellidoPaterno, compra.proveedorApellidoMaterno]
      .filter(Boolean)
      .join(" ");
  };

  const completarDatosCompras = async (movimientosBase) => {
    const compraIds = [...new Set(
      (movimientosBase || [])
        .map((movimiento) => movimiento.compraId)
        .filter(Boolean)
    )];

    if (compraIds.length === 0) {
      return movimientosBase || [];
    }

    const compras = await Promise.all(
      compraIds.map(async (compraId) => {
        try {
          const compra = await obtenerCompraPorId(compraId);
          return [String(compraId), compra];
        } catch (error) {
          console.error(`Error cargando datos de compra ${compraId}:`, error);
          return [String(compraId), null];
        }
      })
    );
    const comprasPorId = Object.fromEntries(compras);

    return (movimientosBase || []).map((movimiento) => ({
      ...movimiento,
      proveedorNombre: movimiento.proveedorNombre || obtenerNombreProveedorCompra(comprasPorId[String(movimiento.compraId)]) || "",
      cantidadEsperadaCompra: obtenerCantidadEsperadaCompra(comprasPorId[String(movimiento.compraId)], movimiento.insumoId)
    }));
  };

  const obtenerCantidadEsperadaCompra = (compra, insumoId) => {
    const detalle = compra?.detalles?.find((item) => String(item.insumoId) === String(insumoId));
    if (!detalle) return null;

    const cantidad = Number(detalle.cantidad || 0);
    const factorConversion = Number(detalle.factorConversion || 1);
    return cantidad * factorConversion;
  };

  // Cargar insumos al montar
  useEffect(() => {
    cargarInsumos();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const insumoIdParam = params.get("insumoId");

    if (insumoIdParam) {
      setInsumoSeleccionado(insumoIdParam);
    }
  }, [location.search]);

  const cargarInsumos = async () => {
    try {
      const data = await obtenerInsumos();
      const lista = data.content || data || [];
      setInsumos(lista);

      const params = new URLSearchParams(location.search);
      const insumoIdParam = params.get("insumoId");
      if (insumoIdParam) {
        const existe = lista.some((insumo) => String(insumo.id) === String(insumoIdParam));
        if (existe) {
          setInsumoSeleccionado(insumoIdParam);
        }
      }
    } catch (error) {
      console.error("Error cargando insumos:", error);
      setToastType("danger");
      setToastMessage("Error al cargar insumos");
    }
  };

  const handleConsultar = useCallback(async ({ mostrarAviso = true } = {}) => {
    if (!insumoSeleccionado) {
      if (mostrarAviso) {
        setToastType("warning");
        setToastMessage("Selecciona un insumo");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data;
      if (usarFiltroFechas && fechaInicio && fechaFin) {
        // Convertir fechas a LocalDateTime (inicio y fin del día)
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        data = await obtenerMovimientosPorPeriodo(
          inicio.toISOString(),
          fin.toISOString()
        );
        // Filtrar por insumo (el endpoint de período trae todos)
        data = data.filter(m => m.insumoId === parseInt(insumoSeleccionado));
      } else {
        data = await obtenerHistorialInsumo(insumoSeleccionado);
      }
      
      setMovimientos(await completarDatosCompras(data));
      
      // Obtener costo promedio
      const promedio = await obtenerCostoPromedio(insumoSeleccionado);
      setCostoPromedio(promedio);
      
    } catch (error) {
      console.error("Error consultando kardex:", error);
      setError("Error al consultar el kardex");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [fechaFin, fechaInicio, insumoSeleccionado, usarFiltroFechas]);

  useEffect(() => {
    if (!esConsultaEspecifica || !insumoSeleccionado) {
      return;
    }

    handleConsultar({ mostrarAviso: false });
  }, [esConsultaEspecifica, fechaFin, fechaInicio, handleConsultar, insumoSeleccionado, usarFiltroFechas]);

  const insumoInfo = insumos.find(i => i.id === parseInt(insumoSeleccionado));
  const abrirEdicion = () => {
    if (!insumoSeleccionado) return;
    navigate(`/insumos/${insumoSeleccionado}`);
  };

  return (
    <>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <PageHeader
        title="Kardex de Insumos"
        subtitle="Historial de movimientos y control de inventarios"
      />

      <div className="row mb-4">
        <div className="col-md-12">
          <Card>
            {esConsultaEspecifica ? (
              <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 bg-light rounded border p-3">
                <div className="d-flex flex-wrap align-items-end gap-3">
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={usarFiltroFechas}
                      onChange={(e) => setUsarFiltroFechas(e.target.checked)}
                      id="filtrarFechas"
                    />
                    <label className="form-check-label fw-semibold" htmlFor="filtrarFechas">
                      Filtrar por fechas
                    </label>
                  </div>

                  {usarFiltroFechas && (
                    <>
                      <div>
                        <label className="form-label fw-semibold small mb-1">Desde</label>
                        <input
                          type="date"
                          className="form-control"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label fw-semibold small mb-1">Hasta</label>
                        <input
                          type="date"
                          className="form-control"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={abrirEdicion}
                  disabled={!insumoSeleccionado}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Editar insumo
                </button>
              </div>
            ) : (
              <>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div>
                    <h5 className="mb-1">Consulta del Kardex</h5>
                    <p className="text-muted mb-0">
                      {insumoInfo ? `Viendo ${insumoInfo.nombre}` : "Selecciona un insumo para consultar sus movimientos"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={abrirEdicion}
                    disabled={!insumoSeleccionado}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Editar insumo
                  </button>
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Insumo</label>
                    <select
                      className="form-select"
                      value={insumoSeleccionado}
                      onChange={(e) => setInsumoSeleccionado(e.target.value)}
                    >
                      <option value="">Seleccionar insumo...</option>
                      {insumos.map(ins => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nombre} ({ins.unidadMedida?.simbolo || '?'})
                        </option>
                      ))}
                    </select>
                  </div>

              <div className="col-md-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={usarFiltroFechas}
                    onChange={(e) => setUsarFiltroFechas(e.target.checked)}
                    id="filtrarFechas"
                  />
                  <label className="form-check-label" htmlFor="filtrarFechas">
                    Filtrar por fechas
                  </label>
                </div>
              </div>

              {usarFiltroFechas && (
                <>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </>
              )}

                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleConsultar}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Consultar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setInsumoSeleccionado("");
                        setMovimientos([]);
                        setCostoPromedio(0);
                        setError("");
                      }}
                      title="Limpiar"
                    >
                      <i className="bi bi-eraser"></i>
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {insumoSeleccionado && insumoInfo && (
        <div className="row mb-4">
          <div className="col-md-3">
            <Card>
              <div className="text-center">
                <h6 className="text-muted mb-2">Stock Actual</h6>
                <h3 className="mb-0">
                  {insumoInfo.stockActual?.toFixed(2) || '0.00'}
                  <small className="text-muted fs-6 ms-1">{insumoInfo.unidadMedida?.simbolo}</small>
                </h3>
              </div>
            </Card>
          </div>

          <div className="col-md-3">
            <Card>
              <div className="text-center">
                <h6 className="text-muted mb-2">Stock Mínimo</h6>
                <h3 className="mb-0">
                  {insumoInfo.stockMinimo?.toFixed(2) || '0.00'}
                  <small className="text-muted fs-6 ms-1">{insumoInfo.unidadMedida?.simbolo}</small>
                </h3>
              </div>
            </Card>
          </div>

          <div className="col-md-3">
            <Card>
              <div className="text-center">
                <h6 className="text-muted mb-2">Costo Promedio</h6>
                <h3 className="mb-0 text-primary">
                  ${costoPromedio.toFixed(2)}
                  <small className="text-muted fs-6 ms-1">por {insumoInfo.unidadMedida?.simbolo}</small>
                </h3>
              </div>
            </Card>
          </div>

          <div className="col-md-3">
            <Card>
              <div className="text-center">
                <h6 className="text-muted mb-2">Valor Inventario</h6>
                <h3 className="mb-0 text-success">
                  ${((insumoInfo.stockActual || 0) * costoPromedio).toFixed(2)}
                </h3>
              </div>
            </Card>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <KardexTable 
        movimientos={movimientos}
        loading={loading}
        insumoNombre={insumoInfo?.nombre}
      />
    </>
  );
}

