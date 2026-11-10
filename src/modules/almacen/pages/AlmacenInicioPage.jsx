import { Link } from "react-router-dom";
import { getUser, hasPermission } from "../../auth/services/authService";
import AlmacenDashboard from "./AlmacenDashboard";
import "./AlmacenInicioPage.css";

const modulos = [
  { nombre: "Insumos", descripcion: "Consulta y administra las existencias.", ruta: "/insumos", permiso: "VIEW_INVENTORY", icono: "bi-nut" },
  { nombre: "Entradas", descripcion: "Recibe los insumos comprados.", ruta: "/almacen/entradas", permiso: "VIEW_WAREHOUSE_RECEIPTS", icono: "bi-box-arrow-in-down" },
  { nombre: "Salidas", descripcion: "Consulta los movimientos de salida.", ruta: "/salidas-insumos", permiso: "VIEW_INVENTORY_OUTPUTS", icono: "bi-box-arrow-right" },
  { nombre: "Requisiciones", descripcion: "Consulta las solicitudes de insumos.", ruta: "/almacen/requisiciones", permiso: "VIEW_WAREHOUSE_REQUISITIONS", icono: "bi-clipboard-plus" },
  { nombre: "Producto terminado", descripcion: "Gestiona el inventario de productos terminados.", ruta: "/almacen/producto-terminado", permiso: "VIEW_FINISHED_GOODS", icono: "bi-boxes" },
  { nombre: "Tipos de insumo", descripcion: "Administra la clasificación de insumos.", ruta: "/insumos/tipos", permiso: "VIEW_INPUT_TYPES", icono: "bi-tags" },
  { nombre: "Unidades de medida", descripcion: "Consulta las unidades utilizadas en almacén.", ruta: "/unidades-medida", permiso: "VIEW_MEASURE_UNITS", icono: "bi-aspect-ratio" },
];

export default function AlmacenInicioPage() {
  const usuario = getUser();
  const accesos = modulos.filter((modulo) => hasPermission(usuario, modulo.permiso));

  return (
    <main className="almacen-inicio container-fluid py-4">
      <header className="almacen-inicio-header">
        <span className="almacen-inicio-eyebrow">Módulos de almacén</span>
        <h1>Almacén</h1>
        <p>Consulta los indicadores y accede a las áreas de trabajo.</p>
      </header>
      {hasPermission(usuario, "VIEW_DASHBOARD") && <AlmacenDashboard usuario={usuario} />}
      <h2 className="almacen-modulos-title">Áreas de trabajo</h2>
      {accesos.length ? (
        <nav className="almacen-inicio-grid" aria-label="Módulos de almacén">
          {accesos.map((modulo) => (
            <Link className="almacen-inicio-card" key={modulo.ruta} to={modulo.ruta}>
              <span className="almacen-inicio-icon"><i className={`bi ${modulo.icono}`} aria-hidden="true" /></span>
              <span className="almacen-inicio-copy"><strong>{modulo.nombre}</strong><small>{modulo.descripcion}</small></span>
              <i className="bi bi-arrow-right almacen-inicio-arrow" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      ) : <p className="alert alert-info">No tienes módulos de almacén disponibles.</p>}
    </main>
  );
}
