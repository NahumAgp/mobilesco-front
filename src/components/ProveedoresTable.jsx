export default function ProveedoresTable() {
  return (   
  <div className="container-fluid mt-4">
    <div className="row justify-content-center">
      <div className="col-12 col-xxl-10">
        <div className="card shadow-sm">
          <div className="card-body">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="m-0">Proveedores</h2>

              <button className="btn btn-primary btn-lg" onClick={handleNuevo}>
                Nuevo proveedor
              </button>

            </div>
            <div className="table-toolbar">
              <div className="search-box">
                <input
                  className="form-control"
                  placeholder="Buscar por nombre o contacto..."
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>


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
                    <th style={{ width: '25%', minWidth: '200px' }}>Nombre</th>
                    <th style={{ width: '18%', minWidth: '150px' }}>Contacto</th>
                    <th style={{ width: '25%', minWidth: '200px' }}>Correo</th>
                    <th style={{ width: '14%', minWidth: '120px' }}>Teléfono</th>
                    <th style={{ width: '10%', minWidth: '80px' }}>Activo</th>
                    <th style={{ width: '170px', minWidth: '170px', maxWidth: '170px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => (
                    <tr key={p.id}>
                      <td className="text-truncate" title={p.id}>{p.id}</td>
                      <td className="text-truncate" title={p.nombre}>{p.nombre}</td>
                      <td className="text-truncate" title={p.contacto}>{p.contacto}</td>
                      <td className="text-truncate" title={p.correo}>{p.correo}</td>
                      <td className="text-truncate" title={p.telefono}>{p.telefono}</td>
                      <td>{p.activo ? 'Sí' : 'No'}</td>
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
  );
}
