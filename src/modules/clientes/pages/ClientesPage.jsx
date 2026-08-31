import { useCallback, useEffect, useState } from "react";
import { getInitialPaginationPage, usePersistedPagination } from "../../../hooks/usePersistedPagination.js";
import { useNavigate } from "react-router-dom";

import CatalogRowActions from "../../../components/ui/CatalogRowActions";
import CatalogStatusBadge from "../../../components/ui/CatalogStatusBadge";
import { getUser, hasPermission } from "../../auth/services/authService";
import {
  cambiarEstatusCliente,
  obtenerClasificacionesCliente,
  obtenerClientes,
} from "../services/clientes";

const estadoInicial = {
  busqueda: "",
  clasificacion: "",
  activo: "true",
};

export default function ClientesPage() {
  const navigate = useNavigate();
  const puedeCrear = hasPermission(getUser(), "ACTION_CUSTOMERS_CREATE");
  const [filtros, setFiltros] = useState(estadoInicial);
  const [page, setPage] = useState(() => getInitialPaginationPage("clientes"));
  usePersistedPagination("clientes", page);
  const [resultado, setResultado] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [clasificaciones, setClasificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const data = await obtenerClientes({
        page,
        size: 10,
        busqueda: filtros.busqueda.trim(),
        clasificacion: filtros.clasificacion,
        activo: filtros.activo,
        sortBy: "nombre",
        direction: "asc",
      });
      setResultado(data);
    } catch (err) {
      setError(err?.message || "No fue posible cargar los clientes");
    } finally {
      setCargando(false);
    }
  }, [filtros, page]);

  useEffect(() => {
    obtenerClasificacionesCliente()
      .then(setClasificaciones)
      .catch(() => setClasificaciones([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(cargar, 250);
    return () => clearTimeout(timer);
  }, [cargar]);

  const actualizarFiltro = (event) => {
    const { name, value } = event.target;
    setFiltros((actual) => ({ ...actual, [name]: value }));
    setPage(0);
  };

  const cambiarEstado = async (cliente) => {
    try {
      await cambiarEstatusCliente(cliente.id, !cliente.activo);
      await cargar();
    } catch (err) {
      setError(err?.message || "No fue posible cambiar el estado");
    }
  };

  return (
    <div className="container-fluid py-4 mobile-module-page clientes-page">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="mb-1">Clientes</h2>
          <p className="text-muted mb-0">
            Catálogo comercial preparado para cotizaciones y ventas.
          </p>
        </div>
        {puedeCrear && <button className="btn btn-primary" onClick={() => navigate("/clientes/nuevo")}>
          <i className="bi bi-person-plus me-2"></i>
          Nuevo cliente
        </button>}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6">
              <label className="form-label fw-semibold">Buscar</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  className="form-control"
                  name="busqueda"
                  value={filtros.busqueda}
                  onChange={actualizarFiltro}
                  placeholder="Código, nombre, razón social, RFC, correo o teléfono"
                />
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Clasificación comercial</label>
              <select className="form-select" name="clasificacion" value={filtros.clasificacion} onChange={actualizarFiltro}>
                <option value="">Todas</option>
                {clasificaciones.map((item) => (
                  <option key={item.codigo} value={item.codigo}>{item.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Estatus</label>
              <select className="form-select" name="activo" value={filtros.activo} onChange={actualizarFiltro}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card border-0 shadow-sm">
        <div
          className="table-responsive mobile-table-region clientes-table-scroll"
          role="region"
          aria-label="Tabla de clientes. Desliza horizontalmente para ver todas las columnas."
          tabIndex="0"
        >
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Clasificación</th>
                <th>RFC</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Estatus</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : resultado.content.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-5">
                    <i className="bi bi-people fs-1 d-block mb-2"></i>
                    No hay clientes que coincidan con los filtros
                  </td>
                </tr>
              ) : resultado.content.map((cliente) => (
                <tr key={cliente.id} role="button" onClick={() => navigate(`/clientes/${cliente.id}`)}>
                  <td className="text-nowrap"><span className="badge text-bg-light">{cliente.codigo}</span></td>
                  <td>
                    <div className="fw-semibold">{cliente.nombreVisual}</div>
                    <small className="text-muted">{cliente.tipoPersonaEtiqueta}</small>
                  </td>
                  <td><span className="badge text-bg-primary-subtle text-primary-emphasis">{cliente.clasificacionEtiqueta}</span></td>
                  <td>{cliente.rfc || "—"}</td>
                  <td>
                    <div>{cliente.contactoNombre || "—"}</div>
                    <small className="text-muted">{cliente.correo || cliente.telefono || ""}</small>
                  </td>
                  <td>{[cliente.ciudad, cliente.estado].filter(Boolean).join(", ") || "—"}</td>
                  <td><CatalogStatusBadge active={cliente.activo} /></td>
                  <td className="text-end" onClick={(event) => event.stopPropagation()}>
                    <CatalogRowActions
                      item={cliente}
                      active={cliente.activo}
                      onEdit={() => navigate(`/clientes/${cliente.id}`)}
                      onToggle={() => cambiarEstado(cliente)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
          <small className="text-muted">{resultado.totalElements || 0} clientes</small>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage((valor) => valor - 1)}>
              Anterior
            </button>
            <span className="btn btn-outline-secondary btn-sm disabled">Página {page + 1} de {Math.max(resultado.totalPages, 1)}</span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page + 1 >= resultado.totalPages} onClick={() => setPage((valor) => valor + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
