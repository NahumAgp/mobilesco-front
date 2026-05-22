import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Toast from "../../../components/ui/Toast.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { crearSalidaInsumo } from "../services/salidasInsumos.js";

function obtenerFechaHoraLocal() {
  const ahora = new Date();
  const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
  return new Date(ahora.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function SalidasInsumosNuevaPage() {
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [errores, setErrores] = useState({});
  const [insumos, setInsumos] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [cantidadEntrada, setCantidadEntrada] = useState(1);
  const [formData, setFormData] = useState({
    ordenProduccion: "",
    fechaSalida: obtenerFechaHoraLocal(),
    observaciones: ""
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const insumosResp = await obtenerInsumos();
        setInsumos(Array.isArray(insumosResp?.content) ? insumosResp.content : Array.isArray(insumosResp) ? insumosResp : []);
      } catch (error) {
        console.error("Error cargando insumos:", error);
        setToastType("danger");
        setToastMessage("No se pudieron cargar los insumos");
      }
    };

    cargarCatalogos();
  }, []);

  const totalCantidad = useMemo(
    () => detalles.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [detalles]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    }
  };

  const normalizarCodigo = (valor) => String(valor || "").replace(/\D/g, "");

  const buscarInsumoPorEntrada = (valor) => {
    const termino = String(valor || "").trim().toLowerCase();
    const codigoNormalizado = normalizarCodigo(termino);

    if (!termino) {
      return null;
    }

    const coincidenciaExactaCodigo = insumos.find((insumo) => {
      const codigoBarras = normalizarCodigo(insumo.codigoBarras);
      const codigoInterno = normalizarCodigo(insumo.codigo);
      return codigoBarras === codigoNormalizado || codigoInterno === codigoNormalizado;
    });

    if (coincidenciaExactaCodigo) {
      return coincidenciaExactaCodigo;
    }

    const coincidenciaExactaNombre = insumos.find((insumo) => String(insumo.nombre || "").trim().toLowerCase() === termino);
    if (coincidenciaExactaNombre) {
      return coincidenciaExactaNombre;
    }

    const coincidenciaPorNombre = insumos.find((insumo) => String(insumo.nombre || "").toLowerCase().includes(termino));
    if (coincidenciaPorNombre) {
      return coincidenciaPorNombre;
    }

    return insumos.find((insumo) => {
      const codigoBarras = String(insumo.codigoBarras || "").toLowerCase();
      const codigo = String(insumo.codigo || "").toLowerCase();
      return codigoBarras.includes(termino) || codigo.includes(termino);
    }) || null;
  };

  const agregarDetalle = () => {
    const insumo = buscarInsumoPorEntrada(busquedaInsumo);
    const cantidad = Number(cantidadEntrada || 0);

    if (!insumo) {
      setToastType("danger");
      setToastMessage("Escribe o escanea un insumo válido");
      return;
    }

    if (cantidad <= 0) {
      setToastType("danger");
      setToastMessage("La cantidad debe ser mayor a cero");
      return;
    }

    const stockBase = Number(insumo.stockActual || 0);
    const existente = detalles.find((item) => String(item.insumoId) === String(insumo.id));
    const cantidadAcumulada = Number(existente?.cantidad || 0) + cantidad;
    const stockDisponible = stockBase - cantidadAcumulada;

    if (cantidadAcumulada > stockBase) {
      setToastType("danger");
      setToastMessage(`Stock insuficiente para ${insumo.nombre}`);
      return;
    }

    if (existente) {
      setDetalles((prev) =>
        prev.map((item) =>
          String(item.insumoId) === String(insumo.id)
            ? {
                ...item,
                cantidad: cantidadAcumulada,
                stockActual: stockDisponible
              }
            : item
        )
      );
    } else {
      setDetalles((prev) => [
        ...prev,
        {
          id: Date.now(),
          insumoId: insumo.id,
          insumoNombre: insumo.nombre,
          unidad: insumo.unidadMedida?.simbolo || insumo.unidadMedida?.nombre || "",
          cantidad,
          stockBase,
          stockActual: stockDisponible
        }
      ]);
    }

    setBusquedaInsumo("");
    setCantidadEntrada(1);
  };

  const handleBusquedaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarDetalle();
    }
  };

  const actualizarCantidadDetalle = (id, valor) => {
    const nuevaCantidad = Number(valor || 0);

    if (nuevaCantidad <= 0) {
      return;
    }

    setDetalles((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (nuevaCantidad > Number(item.stockBase || 0)) {
          setToastType("danger");
          setToastMessage(`Stock insuficiente para ${item.insumoNombre}`);
          return item;
        }

        return {
          ...item,
          cantidad: nuevaCantidad,
          stockActual: Number(item.stockBase || 0) - nuevaCantidad
        };
      })
    );
  };

  const eliminarDetalle = (id) => {
    setDetalles((prev) => prev.filter((item) => item.id !== id));
  };

  const limpiarFormulario = () => {
    setFormData({
      ordenProduccion: "",
      fechaSalida: obtenerFechaHoraLocal(),
      observaciones: ""
    });
    setDetalles([]);
    setBusquedaInsumo("");
    setCantidadEntrada(1);
    setErrores({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = {};
    if (!formData.ordenProduccion.trim()) nuevosErrores.ordenProduccion = "La orden de producción es obligatoria";
    if (detalles.length === 0) nuevosErrores.detalles = "Agrega al menos un insumo";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setToastType("danger");
      setToastMessage("Revisa los campos obligatorios");
      return;
    }

    try {
      setCargando(true);
      setErrores({});

      const payload = {
        ordenProduccion: formData.ordenProduccion.trim(),
        fechaSalida: formData.fechaSalida || null,
        observaciones: formData.observaciones.trim() || null,
        detalles: detalles.map((item) => ({
          insumoId: item.insumoId,
          cantidad: Number(item.cantidad),
          observaciones: null
        }))
      };

      await crearSalidaInsumo(payload);
      setToastType("success");
      setToastMessage("Salida de insumos registrada con éxito");
      limpiarFormulario();
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo registrar la salida");
      if (error.errors) {
        setErrores(error.errors);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-4">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Nueva salida de insumos</h2>
          <p className="text-muted mb-0">Captura insumos por código o nombre y regístralos por orden de producción.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" type="button" onClick={() => navigate("/salidas-insumos")}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver al historial
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-clipboard2-minus me-2"></i>Información general
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Orden de producción *</label>
                <input
                  type="text"
                  name="ordenProduccion"
                  className={`form-control ${errores.ordenProduccion ? "is-invalid" : ""}`}
                  value={formData.ordenProduccion}
                  onChange={handleFormChange}
                  placeholder="OP-001"
                />
                <div className="invalid-feedback">{errores.ordenProduccion}</div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Fecha y hora</label>
                <input
                  type="datetime-local"
                  name="fechaSalida"
                  className="form-control"
                  value={formData.fechaSalida}
                  onChange={handleFormChange}
                />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">Observaciones</label>
                <textarea
                  name="observaciones"
                  className="form-control"
                  rows="2"
                  value={formData.observaciones}
                  onChange={handleFormChange}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 text-secondary">
              <i className="bi bi-list-check me-2"></i>Insumos de salida
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive mb-3">
              <table className="table table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Insumo</th>
                    <th className="text-end">Cantidad</th>
                    <th>Unidad</th>
                    <th className="text-end">Stock disponible</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.length > 0 ? (
                    detalles.map((item) => (
                      <tr key={item.id}>
                        <td>{item.insumoNombre}</td>
                        <td className="text-end" style={{ maxWidth: "130px" }}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="form-control form-control-sm text-end"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidadDetalle(item.id, e.target.value)}
                          />
                        </td>
                        <td>{item.unidad}</td>
                        <td className="text-end">{Number(item.stockActual).toFixed(2)}</td>
                        <td className="text-end">
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminarDetalle(item.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No hay insumos agregados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="row g-2 align-items-end bg-light rounded p-3">
              <div className="col-md-8">
                <label className="form-label fw-semibold small">Insumo</label>
                <input
                  type="search"
                  className="form-control"
                  value={busquedaInsumo}
                  onChange={(e) => setBusquedaInsumo(e.target.value)}
                  onKeyDown={handleBusquedaKeyDown}
                  placeholder="Escribe el nombre o escanea el código y presiona Enter"
                  autoFocus
                />
                <small className="text-muted d-block mt-1">
                  Si el insumo ya existe en la lista, su cantidad se aumenta en 1.
                </small>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  value={cantidadEntrada}
                  onChange={(e) => setCantidadEntrada(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button type="button" className="btn btn-success w-100" onClick={agregarDetalle}>
                  <i className="bi bi-plus-lg me-2"></i>Agregar
                </button>
              </div>
            </div>

            {errores.detalles && <div className="text-danger small mt-2">{errores.detalles}</div>}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Total de piezas a salir: <strong>{totalCantidad.toFixed(2)}</strong>
              </small>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setDetalles([])}>
                Vaciar detalles
              </button>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-light px-4"
            onClick={() => navigate("/salidas-insumos")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary px-5 fw-bold" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar salida"}
          </button>
        </div>
      </form>
    </div>
  );
}
