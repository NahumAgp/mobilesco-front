import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerProductoCotizable } from "../../../cotizaciones/services/cotizaciones.js";
import { CatalogoCotizacionContext } from "./catalogoCotizacionContext.js";
import "./catalogo-cotizacion-cart.css";

const STORAGE_KEY = "catalogo:carrito-cotizacion";
function leerCarritoGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

function revisarCosto(producto, resultado) {
  const costoTotal = Number(resultado?.costoTotal);
  if (!resultado?.cotizable) {
    const faltantes = resultado?.faltantes?.filter(Boolean).join(", ");
    throw new Error(faltantes || "los costos de fabricación están incompletos");
  }
  if (!Number.isFinite(costoTotal) || costoTotal <= 0) {
    throw new Error("el costo total debe ser mayor a cero");
  }
  return {
    ...producto,
    id: resultado.id ?? producto.id,
    sku: resultado.sku || producto.sku,
    nombre: resultado.nombre || producto.nombre,
    costoTotal,
    activo: true,
  };
}

export default function CatalogoCotizacionProvider({ children, enabled }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(leerCarritoGuardado);
  const [abierto, setAbierto] = useState(false);
  const [validandoIds, setValidandoIds] = useState(() => new Set());
  const [validandoCarrito, setValidandoCarrito] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [problemas, setProblemas] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      setMensaje("No se pudo guardar el carrito en este dispositivo.");
    }
  }, [items]);

  const agregar = async (producto, utilidad, cantidad = 1) => {
    const id = producto?.id || producto?.productoId || producto?.id_producto;
    if (!enabled || !id) return;
    if (!producto.activo) {
      setMensaje("Este producto está inactivo y no se puede cotizar.");
      return false;
    }
    const porcentaje = Number(utilidad);
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 95) {
      setMensaje("Selecciona una utilidad mayor a 0% y hasta 95%.");
      return false;
    }
    const piezas = Math.floor(Number(cantidad));
    if (!Number.isFinite(piezas) || piezas < 1 || piezas > 9999) {
      setMensaje("La cantidad debe ser de 1 a 9,999 piezas.");
      return false;
    }

    setValidandoIds((actual) => new Set(actual).add(String(id)));
    setMensaje("");
    try {
      const resultado = await obtenerProductoCotizable(id);
      const itemValidado = revisarCosto({
        id,
        sku: producto.sku,
        nombre: producto.nombre,
        modeloId: producto.modeloId || producto.modelo?.id || null,
        modeloNombre: producto.modeloNombre || producto.modelo?.nombre || "",
        colorId: producto.colorId || producto.id_color || null,
        materialNombre: producto.materialNombre,
        nivelNombre: producto.nivelNombre,
        colorNombre: producto.colorNombre,
        utilidad: porcentaje,
        imagenPrincipalUrl: producto.imagenPrincipalUrl || producto.imagenUrl || producto.urlImagen || "",
      }, resultado);
      setItems((actuales) => {
        const existente = actuales.find((item) => String(item.id) === String(id));
        return existente
          ? actuales.map((item) => String(item.id) === String(id)
            ? { ...itemValidado, cantidad: Math.min(9999, Number(item.cantidad || 1) + piezas) }
            : item)
          : [...actuales, { ...itemValidado, cantidad: piezas }];
      });
      setProblemas((actual) => {
        const siguiente = { ...actual };
        delete siguiente[id];
        return siguiente;
      });
      setMensaje(`${itemValidado.nombre || "Producto"} se agregó a tu cotización.`);
      return true;
    } catch (error) {
      setMensaje(`No se agregó ${producto.nombre || "el producto"}: ${error.message || "no tiene costos completos"}.`);
      return false;
    } finally {
      setValidandoIds((actual) => {
        const siguiente = new Set(actual);
        siguiente.delete(String(id));
        return siguiente;
      });
    }
  };

  const cambiarCantidad = (id, cantidad) => {
    const valor = Math.max(1, Math.min(9999, Math.floor(Number(cantidad) || 1)));
    setItems((actuales) => actuales.map((item) => String(item.id) === String(id)
      ? { ...item, cantidad: valor }
      : item));
  };

  const quitar = (id) => {
    setItems((actuales) => actuales.filter((item) => String(item.id) !== String(id)));
    setProblemas((actual) => {
      const siguiente = { ...actual };
      delete siguiente[id];
      return siguiente;
    });
  };

  const cotizar = async () => {
    if (!items.length || validandoCarrito) return;
    setValidandoCarrito(true);
    setMensaje("");
    const revisiones = await Promise.all(items.map(async (item) => {
      try {
        const resultado = await obtenerProductoCotizable(item.id);
        return { item: revisarCosto(item, resultado), error: "" };
      } catch (error) {
        return { item, error: error.message || "No se pudieron validar los costos." };
      }
    }));
    const incidencias = Object.fromEntries(revisiones
      .filter((revision) => revision.error)
      .map(({ item, error }) => [item.id, error]));
    setProblemas(incidencias);
    setValidandoCarrito(false);
    if (Object.keys(incidencias).length) {
      setMensaje("Revisa los productos marcados: sus costos ya no están completos o vigentes.");
      setAbierto(true);
      return;
    }

    const carritoInicial = revisiones.map(({ item }) => ({
      id: item.id,
      sku: item.sku,
      nombre: item.nombre,
      costoTotal: item.costoTotal,
      cantidad: item.cantidad,
      utilidad: item.utilidad ?? null,
    }));
    setAbierto(false);
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* El carrito también se limpia del estado local. */ }
    navigate("/cotizaciones/formal", {
      state: { carritoInicial, cotizacionRapida: true, origenCatalogo: true },
    });
  };

  const unidades = useMemo(() => items.reduce((total, item) => total + Number(item.cantidad || 1), 0), [items]);
  const modelos = useMemo(() => new Set(items.map((item) => {
    const modelo = item.modeloId || item.modelo?.id || String(item.modeloNombre || item.modelo?.nombre || item.nombre || item.sku || item.id).trim().toLocaleLowerCase("es-MX");
    const color = item.colorId || item.id_color || String(item.colorNombre || "sin-color").trim().toLocaleLowerCase("es-MX");
    return `${modelo}::${color}`;
  })).size, [items]);
  const value = { agregar, items, unidades, validandoIds, abrirCarrito: () => setAbierto(true) };

  return <CatalogoCotizacionContext.Provider value={value}>
    {children}
    {enabled && <>
      {mensaje && !abierto && <div className="catalogo-cart-toast" role="status">
        <span>{mensaje}</span>
        <button type="button" aria-label="Cerrar mensaje" onClick={() => setMensaje("")}><i className="bi bi-x-lg" aria-hidden="true"></i></button>
      </div>}
      <button type="button" className="catalogo-cart-launcher" onClick={() => setAbierto(true)}
        aria-label={`Abrir cotización: ${modelos} modelos distintos, ${unidades} piezas totales`}>
        <i className="bi bi-bag-check" aria-hidden="true"></i>
        <span className="catalogo-cart-launcher-copy">
          <strong>Mi cotización</strong>
          <small>{modelos} {modelos === 1 ? "modelo" : "modelos"} · {unidades} {unidades === 1 ? "pieza" : "piezas"}</small>
        </span>
      </button>
      {abierto && <div className="catalogo-cart-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setAbierto(false);
      }}>
        <aside className="catalogo-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="catalogo-cart-title">
          <header className="catalogo-cart-heading">
            <div><span>CATÁLOGO MOBILESCO</span><h2 id="catalogo-cart-title">Tu cotización</h2></div>
            <button type="button" className="catalogo-cart-close" aria-label="Cerrar carrito" onClick={() => setAbierto(false)}>
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </header>
          <p className="catalogo-cart-validation-note"><i className="bi bi-shield-check" aria-hidden="true"></i>
            Solo agregamos productos con costos completos y vigentes.
          </p>
          <div className="catalogo-cart-summary" aria-label="Resumen de la cotización">
            <div><strong>{modelos}</strong><span>{modelos === 1 ? "Modelo" : "Modelos"} (modelo + color)</span></div>
            <div><strong>{unidades}</strong><span>Piezas totales</span></div>
          </div>
          {mensaje && <div className="catalogo-cart-message" role="status">{mensaje}</div>}
          <div className="catalogo-cart-items">
            {items.map((item) => <article className="catalogo-cart-item" key={item.id}>
              <div className="catalogo-cart-item-image">
                {item.imagenPrincipalUrl
                  ? <img src={item.imagenPrincipalUrl} alt="" />
                  : <i className="bi bi-box-seam" aria-hidden="true"></i>}
              </div>
              <div className="catalogo-cart-item-info">
                <strong>{item.nombre}</strong><small>{item.sku || `Producto ${item.id}`}</small>
                {(item.materialNombre || item.nivelNombre || item.colorNombre) &&
                  <small>{[item.materialNombre, item.nivelNombre, item.colorNombre].filter(Boolean).join(" · ")}</small>}
                {item.utilidad != null && <small className="catalogo-cart-item-utility">Utilidad {item.utilidad}%</small>}
                <span className={problemas[item.id] ? "has-problem" : "is-validated"}>
                  <i className={`bi ${problemas[item.id] ? "bi-exclamation-circle" : "bi-check-circle"}`} aria-hidden="true"></i>
                  {problemas[item.id] ? problemas[item.id] : "Costos validados"}
                </span>
                <div className="catalogo-cart-item-controls">
                  <label>Cantidad <input aria-label={`Cantidad de ${item.nombre}`} type="number" min="1" max="9999"
                    value={item.cantidad || 1} onChange={(event) => cambiarCantidad(item.id, event.target.value)} /></label>
                  <button type="button" onClick={() => quitar(item.id)} aria-label={`Quitar ${item.nombre}`}>
                    <i className="bi bi-trash3" aria-hidden="true"></i> Quitar
                  </button>
                </div>
              </div>
            </article>)}
            {!items.length && <div className="catalogo-cart-empty">
              <i className="bi bi-bag" aria-hidden="true"></i><strong>Tu carrito está vacío</strong>
              <span>Agrega productos del catálogo para empezar tu cotización.</span>
            </div>}
          </div>
          <footer className="catalogo-cart-footer">
            <div><small>El precio final se calcula al preparar la cotización.</small></div>
            <button type="button" disabled={!items.length || validandoCarrito || validandoIds.size > 0} onClick={cotizar}>
              {validandoCarrito ? <><span className="catalogo-cart-spinner"></span>Validando costos...</>
                : <>Continuar a cotizar <i className="bi bi-arrow-right" aria-hidden="true"></i></>}
            </button>
          </footer>
        </aside>
      </div>}
    </>}
  </CatalogoCotizacionContext.Provider>;
}
