import { useEffect, useMemo, useState } from "react";

import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import InsumoForm from "../../insumos/pages/InsumoForm.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import OperacionForm from "../../operaciones/pages/OperacionForm.jsx";
import { obtenerOperacionesActivas } from "../../operaciones/services/operaciones.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getId = (item) => item?.id ?? item?.insumoId ?? item?.operacionId ?? null;

function CatalogModal({ show, title, onClose, children }) {
  if (!show) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.55)", zIndex: 1120 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ModeloPlantillaProductivaFields({
  insumos = [],
  operaciones = [],
  onInsumosChange,
  onOperacionesChange
}) {
  const [catalogoInsumos, setCatalogoInsumos] = useState([]);
  const [catalogoOperaciones, setCatalogoOperaciones] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [operacionSeleccionada, setOperacionSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mostrarInsumo, setMostrarInsumo] = useState(false);
  const [mostrarOperacion, setMostrarOperacion] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([
      obtenerInsumos({ activo: true, page: 0, size: 500 }),
      obtenerOperacionesActivas()
    ])
      .then(([insumosRespuesta, operacionesRespuesta]) => {
        if (!activo) return;
        setCatalogoInsumos(getLista(insumosRespuesta));
        setCatalogoOperaciones(getLista(operacionesRespuesta));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const insumosNormalizados = useMemo(
    () => insumos.map((item) => {
      if (typeof item === "number" || typeof item === "string") {
        return catalogoInsumos.find((catalogo) => String(getId(catalogo)) === String(item)) || { id: item };
      }
      return item;
    }),
    [catalogoInsumos, insumos]
  );

  const operacionesNormalizadas = useMemo(
    () => operaciones.map((item) => {
      if (typeof item === "number" || typeof item === "string") {
        return catalogoOperaciones.find((catalogo) => String(getId(catalogo)) === String(item)) || { id: item };
      }
      return item;
    }),
    [catalogoOperaciones, operaciones]
  );

  const insumosDisponibles = catalogoInsumos.filter(
    (item) => !insumosNormalizados.some((seleccionado) => String(getId(seleccionado)) === String(getId(item)))
  );
  const operacionesDisponibles = catalogoOperaciones.filter(
    (item) => !operacionesNormalizadas.some((seleccionada) => String(getId(seleccionada)) === String(getId(item)))
  );

  const agregarInsumo = (id, opcion) => {
    if (!id) return;
    onInsumosChange?.([...insumosNormalizados, opcion || { id }]);
    setInsumoSeleccionado("");
  };

  const agregarOperacion = (id, opcion) => {
    if (!id) return;
    onOperacionesChange?.([...operacionesNormalizadas, opcion || { id }]);
    setOperacionSeleccionada("");
  };

  const moverOperacion = (index, delta) => {
    const destino = index + delta;
    if (destino < 0 || destino >= operacionesNormalizadas.length) return;
    const siguiente = [...operacionesNormalizadas];
    [siguiente[index], siguiente[destino]] = [siguiente[destino], siguiente[index]];
    onOperacionesChange?.(siguiente);
  };

  return (
    <>
      <div className="col-12">
        <div className="border-top pt-3">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <div className="fw-semibold">Plantilla de insumos</div>
              <small className="text-muted">
                Selecciona los insumos comunes. La cantidad se captura después en cada producto.
              </small>
            </div>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setMostrarInsumo(true)}>
              <i className="bi bi-plus-lg me-1"></i>Nuevo insumo
            </button>
          </div>
          <SearchableSelect
            label=""
            value={insumoSeleccionado}
            options={insumosDisponibles}
            onChange={agregarInsumo}
            closeOnSelect={false}
            loading={cargando}
            placeholder={cargando ? "Cargando insumos..." : "Buscar y agregar insumo..."}
            searchPlaceholder="Busca por código, nombre o unidad..."
            getOptionValue={getId}
            getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
            getOptionSearchText={(item) => [item.codigo, item.nombre, item.unidadMedida?.simbolo, item.unidadMedida]
              .filter(Boolean).join(" ").toLowerCase()}
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {insumosNormalizados.map((item) => (
              <span key={getId(item)} className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-2">
                <span>{item.codigo ? `[${item.codigo}] ` : ""}{item.nombre || `Insumo ${getId(item)}`}</span>
                <span className="text-warning">Cantidad pendiente</span>
                <button
                  type="button"
                  className="btn btn-sm p-0 border-0 bg-transparent text-danger"
                  onClick={() => onInsumosChange?.(insumosNormalizados.filter((actual) => String(getId(actual)) !== String(getId(item))))}
                  aria-label={`Quitar ${item.nombre || "insumo"}`}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </span>
            ))}
            {!insumosNormalizados.length && <span className="form-text">Aún no hay insumos en la plantilla.</span>}
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="border-top pt-3">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <div className="fw-semibold">Plantilla de operaciones</div>
              <small className="text-muted">
                Define las operaciones comunes y su secuencia. La cantidad se completa por producto.
              </small>
            </div>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setMostrarOperacion(true)}>
              <i className="bi bi-plus-lg me-1"></i>Nueva operación
            </button>
          </div>
          <SearchableSelect
            label=""
            value={operacionSeleccionada}
            options={operacionesDisponibles}
            onChange={agregarOperacion}
            closeOnSelect={false}
            loading={cargando}
            placeholder={cargando ? "Cargando operaciones..." : "Buscar y agregar operación..."}
            searchPlaceholder="Busca por código, nombre o centro..."
            getOptionValue={getId}
            getOptionLabel={(item) => `${item.codigo ? `[${item.codigo}] ` : ""}${item.nombre || "-"}`}
            getOptionSearchText={(item) => [item.codigo, item.nombre, item.centroTrabajoNombre]
              .filter(Boolean).join(" ").toLowerCase()}
          />
          <div className="list-group list-group-flush mt-2">
            {operacionesNormalizadas.map((item, index) => (
              <div key={getId(item)} className="list-group-item px-0 d-flex align-items-center gap-2">
                <span className="badge text-bg-secondary">{index + 1}</span>
                <span className="flex-grow-1">
                  {item.codigo ? `[${item.codigo}] ` : ""}{item.nombre || `Operación ${getId(item)}`}
                </span>
                <span className="badge text-bg-warning">Cantidad pendiente</span>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={index === 0} onClick={() => moverOperacion(index, -1)}>
                  <i className="bi bi-arrow-up"></i>
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={index === operacionesNormalizadas.length - 1} onClick={() => moverOperacion(index, 1)}>
                  <i className="bi bi-arrow-down"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onOperacionesChange?.(operacionesNormalizadas.filter((actual) => String(getId(actual)) !== String(getId(item))))}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            ))}
            {!operacionesNormalizadas.length && <span className="form-text">Aún no hay operaciones en la plantilla.</span>}
          </div>
        </div>
      </div>

      <CatalogModal show={mostrarInsumo} title="Nuevo insumo" onClose={() => setMostrarInsumo(false)}>
        <InsumoForm
          onCancel={() => setMostrarInsumo(false)}
          onSave={(creado) => {
            setCatalogoInsumos((actual) => [...actual.filter((item) => String(getId(item)) !== String(getId(creado))), creado]);
            agregarInsumo(getId(creado), creado);
            setMostrarInsumo(false);
          }}
        />
      </CatalogModal>

      <CatalogModal show={mostrarOperacion} title="Nueva operación" onClose={() => setMostrarOperacion(false)}>
        <OperacionForm
          onCancel={() => setMostrarOperacion(false)}
          onSave={(creada) => {
            setCatalogoOperaciones((actual) => [...actual.filter((item) => String(getId(item)) !== String(getId(creada))), creada]);
            agregarOperacion(getId(creada), creada);
            setMostrarOperacion(false);
          }}
        />
      </CatalogModal>
    </>
  );
}
