function Insumos() {
     const insumos = [
    {
      codigo: "TUB-034",
      nombre: "Tubo de 3/4",
      categoria: "Estructura",
      umCompra: "Pieza",
      umConsumo: "Metro",
      costo: "$320.00",
      estado: "Activo",
    },
    {
      codigo: "BAR-POL-01",
      nombre: "Barniz Poliuretano",
      categoria: "Acabados",
      umCompra: "Litro",
      umConsumo: "Mililitro",
      costo: "$180.00",
      estado: "Activo",
    },
    {
      codigo: "PIN-NEG-01",
      nombre: "Pintura Negra Mate",
      categoria: "Pinturas",
      umCompra: "Litro",
      umConsumo: "Mililitro",
      costo: "$150.00",
      estado: "Activo",
    },
    {
      codigo: "TAB-MEL-16",
      nombre: "Tablero Melamina 16mm",
      categoria: "Tableros",
      umCompra: "Hoja",
      umConsumo: "m²",
      costo: "$950.00",
      estado: "Activo",
    },
    {
      codigo: "TOR-MAD-01",
      nombre: "Tornillo Madera 1 1/2\"",
      categoria: "Herrajes",
      umCompra: "Caja",
      umConsumo: "Pieza",
      costo: "$420.00",
      estado: "Inactivo",
    },
  ];
    return (
        <div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Insumos</h2>
          <p className="text-muted mb-0">
            Materiales y consumibles utilizados en fabricación.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">Importar</button>
          <button className="btn btn-outline-secondary">Exportar</button>
          <button className="btn btn-success">+ Nuevo Insumo</button>
        </div>
      </div>

      {/* Filtros fake */}
      <div className="card mb-4">
        <div className="card-body d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o código..."
          />
          <button className="btn btn-outline-secondary">Categoría</button>
          <select className="form-select w-auto">
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>CÓDIGO</th>
                <th>INSUMO</th>
                <th>CATEGORÍA</th>
                <th>UM COMPRA</th>
                <th>UM CONSUMO</th>
                <th>COSTO</th>
                <th>ESTADO</th>
                <th className="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.codigo}>
                  <td className="text-muted">{i.codigo}</td>
                  <td className="fw-semibold">{i.nombre}</td>
                  <td>{i.categoria}</td>
                  <td>{i.umCompra}</td>
                  <td>{i.umConsumo}</td>
                  <td className="fw-semibold">{i.costo}</td>
                  <td>
                    <span
                      className={
                        i.estado === "Activo"
                          ? "badge bg-success-subtle text-success"
                          : "badge bg-secondary-subtle text-secondary"
                      }
                    >
                      {i.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1">
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
    );
}

export default Insumos;