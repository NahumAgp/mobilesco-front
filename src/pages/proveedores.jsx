import { useEffect, useState } from 'react';
import { obtenerProveedores, crearProveedor, eliminarProveedor, actualizarProveedor} from '../services/proveedores.Js';
import ProveedorForm from '../components/ProveedorForm';
import Sidebar from '../components/Sidebar';
import ProveedoresTable from '../components/ProveedoresTable';
import PageHeader from '../components/PageHeader';


export default function Proveedores() {
  
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [erroresForm, setErroresForm] = useState({});
  const [mostrarForm, setMostrarForm] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);

  // ---- cargar lista ----
  async function recargar() {
    try {
      setError('');
      const data = await obtenerProveedores();
      setProveedores(data);
    } catch (e) {
      setError(e?.message || 'Error cargando proveedores');
    }
  }

  // ---- cargar al iniciar ----
  useEffect(() => {
    async function initData() {
      await recargar(); // Llamamos a recargar datos aquí
    }
    initData();
  }, []); // Ejecutamos una vez al inicio

  // ---- eliminar ----
  async function handleEliminar(id) {
    const ok = window.confirm('¿Seguro que deseas eliminar este proveedor?');
    if (!ok) return;

    try {
      setError('');
      await eliminarProveedor(id);
      await recargar(); // Recargar la lista después de eliminar
    } catch (e) {
      setError(e?.message || 'Error eliminando proveedor');
    }
  }

  // ---- editar ----
  function handleEditar(proveedor) {
    setErroresForm({});
    setProveedorEditando(proveedor);
    setMostrarForm(true);
  }

  // ---- nuevo ----
  /*function handleNuevo() {
    setErroresForm({});
    setProveedorEditando(null);
    setMostrarForm(true);
  }*/

   return (
      <div>
    <PageHeader
      title="Directorio de Proveedores"
      subtitle="Base de datos centralizada de proveedores."
      actions={
    <button
      className="btn btn-success"
      onClick={() => {
        setProveedorEditando(null); // por si venías de editar
        setMostrarForm(true);       // abre el form
      }}
    >
      Nuevo Proveedor
    </button>
  }
    />
    <div className="container-fluid mt-4">
    <div className="row justify-content-center">
      <div className="col-12 col-xxl-10">
        <div className="card shadow-sm">
          <div className="card-body">
           
            {/* Formulario */}
            {mostrarForm && (
              <div className="mb-4">
                <ProveedorForm
                  key={proveedorEditando ? proveedorEditando.id : 'nuevo'}
                  proveedor={proveedorEditando}
                  errores={erroresForm}
                  onCancelar={() => {
                    setMostrarForm(false);
                    setProveedorEditando(null);
                  }}
                  onGuardar={async (data) => {
                    try {
                      setError('');
                      setErroresForm({});

                      if (proveedorEditando) {
                        await actualizarProveedor({ ...data, id: proveedorEditando.id });
                      } else {
                        await crearProveedor(data);
                      }

                      setMostrarForm(false);
                      setProveedorEditando(null);
                      await recargar();
                    } catch (e) {
                      if (e?.errors && Array.isArray(e.errors)) {
                        const errs = {};
                        e.errors.forEach((msg) => {
                          const m = msg.toLowerCase();
                          if (m.includes('nombre')) errs.nombre = msg;
                          else if (m.includes('razón social')) errs.razonSocial = msg;
                          else if (m.includes('contacto')) errs.contacto = msg;
                          else if (m.includes('correo')) errs.correo = msg;
                          else if (m.includes('teléfono') || m.includes('telefono')) errs.telefono = msg;
                        });
                        setErroresForm(errs);
                      } else {
                        setError('Error guardando proveedor');
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Error general */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Tabla - VERSIÓN FIXED (ocupa toda la pantalla) */}
            <div className="table-responsive" style={{ 
              maxWidth: '100%', 
              overflowX: 'auto',
              maxHeight: 'calc(100vh - 300px)', // Altura máxima
              minHeight: '400px'
            }}>
              <table className="table align-middle erp-table" style={{ 
                minWidth: '100%', // Asegura que use todo el ancho disponible
                width: '100%',
                tableLayout: 'fixed' // Evita que las celdas se expandan irregularmente
              }}>
                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ width: '8%', minWidth: '80px' }}>ID</th>
                    <th style={{ width: '25%', minWidth: '200px' }}>Razon Social</th>
                    <th style={{ width: '18%', minWidth: '150px' }}>Contacto</th>
                    <th style={{ width: '25%', minWidth: '200px' }}>Correo</th>
                    <th style={{ width: '14%', minWidth: '120px' }}>Teléfono</th>
                    <th style={{ width: '10%', minWidth: '80px' }}>Estado</th>
                    <th style={{ width: '170px', minWidth: '170px', maxWidth: '170px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => (
                    <tr key={p.id}>
                      <td className="text-truncate" title={p.id}>{p.id}</td>
                      <td className="text-truncate" title={p.razonSocial}>{p.razonSocial}</td>
                      <td className="text-truncate" title={p.nombre}>{p.nombre}</td>
                      <td className="text-truncate" title={p.correo}>{p.correo}</td>
                      <td className="text-truncate" title={p.telefono}>{p.telefono}</td>
                      <td>{p.activo ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleEditar(p)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleEliminar(p.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {proveedores.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No hay proveedores
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Fin tabla */}
          </div>
        </div>
      </div>
    </div>
  </div>

  </div>
  );
}